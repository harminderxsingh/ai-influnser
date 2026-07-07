const router = require("express").Router();
const { query } = require("../database/connection.js");
const adminValidator = require("../middlewares/admin.js");
const userValidator = require("../middlewares/user.js");
const Stripe = require("stripe");
const { updateUserPlan, addUserCredits } = require("../utils/common.js");
const paypal = require("@paypal/checkout-server-sdk");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

// ── helper: detect country for dual currency (USD / INR) ─────────────────────
function detectCountryFromRequest(req) {
  const fromClient = req?.query?.country || req?.body?.country;
  if (fromClient) return String(fromClient).toUpperCase();

  const headers = req?.headers || {};
  const fromHeader =
    headers["cf-ipcountry"] ||
    headers["x-country-code"] ||
    headers["x-vercel-ip-country"];
  if (fromHeader) return String(fromHeader).toUpperCase();

  return "US";
}

// Base prices are stored in USD. India users see/pay in INR using the exchange rate.
async function getCurrency(req = null) {
  const data = await query(`SELECT * FROM web_public LIMIT 1`, []);
  const inrRate = parseFloat(data[0]?.currency_exchange_rate) || 83;
  const country = detectCountryFromRequest(req);

  if (country === "IN") {
    return {
      symbol: "₹",
      code: "INR",
      rate: inrRate,
      base: "USD",
      country: "IN",
    };
  }

  return {
    symbol: "$",
    code: "USD",
    rate: 1,
    base: "USD",
    country: country || "US",
  };
}

// ── helper: convert USD price → local currency amount in smallest unit ─────────
// e.g. plan.price = 10 USD, rate = 82 INR → returns 82000 paise
function toSmallestUnit(usdPrice, rate, code) {
  const localAmount = parseFloat(usdPrice) * rate;
  // these currencies have no decimal / smallest unit = 1
  const zeroDecimal = [
    "JPY",
    "KRW",
    "VND",
    "CLP",
    "GNF",
    "MGA",
    "PYG",
    "RWF",
    "UGX",
    "XAF",
    "XOF",
  ];
  if (zeroDecimal.includes(code.toUpperCase())) {
    return Math.round(localAmount);
  }
  return Math.round(localAmount * 100); // cents / paise / kobo etc
}

function toLocalAmount(usdPrice, rate) {
  return parseFloat((parseFloat(usdPrice) * rate).toFixed(2));
}

function getPurchaseInput(body = {}) {
  const productType =
    body.product_type === "credit_package" || body.package_id
      ? "credit_package"
      : "plan";
  const productId = productType === "credit_package" ? body.package_id : body.plan_id;
  return { productType, productId };
}

async function getPurchaseItem({ productType, productId }) {
  if (!productId) {
    throw new Error(productType === "credit_package" ? "Package ID is required" : "Plan ID is required");
  }

  if (productType === "credit_package") {
    const packages = await query(
      `SELECT * FROM credit_packages WHERE id = ? AND status = 'active' LIMIT 1`,
      [productId],
    );
    if (!packages.length) throw new Error("Credit package not found");
    const creditPackage = packages[0];
    return {
      productType,
      packageId: creditPackage.id,
      planId: null,
      title: creditPackage.title,
      price: creditPackage.price,
      credits: creditPackage.credits,
      description: `${creditPackage.credits} credits`,
    };
  }

  const plans = await query(`SELECT * FROM plan WHERE id = ? LIMIT 1`, [
    productId,
  ]);
  if (!plans.length) throw new Error("Plan not found");
  const plan = plans[0];
  return {
    productType: "plan",
    planId: plan.id,
    packageId: null,
    title: plan.title,
    price: plan.price,
    credits: plan.credits,
    expiryDays: plan.expiry_days,
    description: `${plan.credits} credits · ${plan.expiry_days} days`,
  };
}

function getPurchaseMetadata(item, uid) {
  return {
    product_type: item.productType,
    uid: String(uid),
    ...(item.productType === "credit_package"
      ? { package_id: String(item.packageId) }
      : { plan_id: String(item.planId) }),
  };
}

function getCancelPath(item) {
  return item.productType === "credit_package"
    ? `/checkout/credits/${item.packageId}`
    : `/checkout/${item.planId}`;
}

async function fulfillPurchase(item, uid, order = {}) {
  if (item.productType === "credit_package") {
    return await addUserCredits({ packageId: item.packageId, uid, order });
  }
  return await updateUserPlan({ planId: item.planId, uid });
}

async function savePaidOrder({ uid, item, amount, gateway, meta }) {
  return await query(
    `INSERT INTO orders (uid, plan_id, package_id, product_type, amount, gateway, meta, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', NOW())`,
    [
      uid,
      item.planId,
      item.packageId,
      item.productType,
      amount,
      gateway,
      JSON.stringify(meta),
    ],
  );
}

function successMessage(item) {
  return item.productType === "credit_package"
    ? "Credits added successfully!"
    : "Plan activated successfully!";
}

function normalizeBillingInterval(value) {
  return value === "yearly" ? "yearly" : "monthly";
}

function getPlanPriceForInterval(plan, billingInterval) {
  const interval = normalizeBillingInterval(billingInterval);
  const price =
    interval === "yearly"
      ? plan.yearly_price || plan.price
      : plan.monthly_price || plan.price;
  return parseFloat(price || 0);
}

async function getSubscriptionPlan({ planId, billingInterval }) {
  const [plan] = await query(`SELECT * FROM plan WHERE id = ? LIMIT 1`, [planId]);
  if (!plan) throw new Error("Plan not found");
  if (Number(plan.recurring_enabled ?? 1) !== 1) {
    throw new Error("Recurring subscription is not enabled for this plan");
  }
  const interval = normalizeBillingInterval(billingInterval);
  const amount = getPlanPriceForInterval(plan, interval);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid subscription amount");
  }
  return { plan, billingInterval: interval, amount };
}

function getSubscriptionPeriodEnd(billingInterval) {
  const end = new Date();
  if (billingInterval === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

async function saveSubscription({
  uid,
  planId,
  billingInterval,
  amount,
  gateway,
  gatewaySubscriptionId,
  gatewayCustomerId = null,
  status = "active",
  meta = {},
}) {
  const now = new Date();
  const periodEnd = getSubscriptionPeriodEnd(billingInterval);
  return await query(
    `INSERT INTO subscriptions
      (uid, plan_id, billing_interval, amount, gateway, gateway_subscription_id, gateway_customer_id, status, current_period_start, current_period_end, meta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uid,
      planId,
      billingInterval,
      amount,
      gateway,
      gatewaySubscriptionId,
      gatewayCustomerId,
      status,
      now,
      periodEnd,
      JSON.stringify(meta),
    ],
  );
}

// ── helper ───────────────────────────────────────────────────────────────────
async function getStripeInstance() {
  const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
  if (!data.length) throw new Error("No settings found");
  const { pay_stripe_key, stripe_active } = data[0];
  if (!stripe_active) throw new Error("Stripe is not enabled");
  if (!pay_stripe_key) throw new Error("Stripe secret key not configured");
  return new Stripe(pay_stripe_key);
}

// ── GET /api/payment/get ─────────────────────────────────────────────────────
router.get("/get", adminValidator, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
    if (data.length < 1)
      return res.json({ success: false, msg: "No settings found" });

    const {
      pay_stripe_id,
      pay_stripe_key,
      stripe_active,
      pay_paypal_id,
      pay_paypal_key,
      paypal_active,
      rz_id,
      rz_key,
      rz_active,
      pay_paystack_id,
      pay_paystack_key,
      paystack_active,
      pay_mercadopago_access_token,
      pay_mercadopago_public_key,
      mercadopago_active,
      offline_payment_html,
      offline_payment_active,
    } = data[0];

    res.json({
      success: true,
      data: {
        pay_stripe_id,
        pay_stripe_key,
        stripe_active,
        pay_paypal_id,
        pay_paypal_key,
        paypal_active,
        rz_id,
        rz_key,
        rz_active,
        pay_paystack_id,
        pay_paystack_key,
        paystack_active,
        pay_mercadopago_access_token,
        pay_mercadopago_public_key,
        mercadopago_active,
        offline_payment_html,
        offline_payment_active,
      },
    });
  } catch (err) {
    res.json({ err, success: false, message: "Something went wrong" });
  }
});

// ── POST /api/payment/post ───────────────────────────────────────────────────
router.post("/post", adminValidator, async (req, res) => {
  try {
    const {
      pay_stripe_id,
      pay_stripe_key,
      stripe_active,
      pay_paypal_id,
      pay_paypal_key,
      paypal_active,
      rz_id,
      rz_key,
      rz_active,
      pay_paystack_id,
      pay_paystack_key,
      paystack_active,
      pay_mercadopago_access_token,
      pay_mercadopago_public_key,
      mercadopago_active,
      offline_payment_html,
      offline_payment_active,
    } = req.body;

    await query(
      `UPDATE web_private SET
        pay_stripe_id = ?, pay_stripe_key = ?, stripe_active = ?,
        pay_paypal_id = ?, pay_paypal_key = ?, paypal_active = ?,
        rz_id = ?, rz_key = ?, rz_active = ?,
        pay_paystack_id = ?, pay_paystack_key = ?, paystack_active = ?,
        pay_mercadopago_access_token = ?, pay_mercadopago_public_key = ?, mercadopago_active = ?, offline_payment_html = ?, offline_payment_active = ?`,
      [
        pay_stripe_id || null,
        pay_stripe_key || null,
        stripe_active || 0,
        pay_paypal_id || null,
        pay_paypal_key || null,
        paypal_active || 0,
        rz_id || null,
        rz_key || null,
        rz_active || 0,
        pay_paystack_id || null,
        pay_paystack_key || null,
        paystack_active || 0,
        pay_mercadopago_access_token || null,
        pay_mercadopago_public_key || null,
        mercadopago_active || 0,
        offline_payment_html || null,
        offline_payment_active || 0,
      ],
    );
    res.json({ success: true, msg: "Payment gateways updated successfully" });
  } catch (err) {
    res.json({ err, success: false, message: "Something went wrong" });
  }
});

// ── GET /api/payment/active-gateways ────────────────────────────────────────
router.get("/active-gateways", async (req, res) => {
  try {
    const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
    if (!data.length) return res.json({ success: true, data: {} });

    const d = data[0];
    res.json({
      success: true,
      data: {
        stripe: { active: !!d.stripe_active, publicKey: d.pay_stripe_id },
        paypal: { active: !!d.paypal_active, clientId: d.pay_paypal_id },
        razorpay: { active: !!d.rz_active, keyId: d.rz_id },
        paystack: { active: !!d.paystack_active, publicKey: d.pay_paystack_id },
        mercadopago: {
          active: !!d.mercadopago_active,
          publicKey: d.pay_mercadopago_public_key,
        },
      },
    });
  } catch (err) {
    res.json({ err, success: false, message: "Something went wrong" });
  }
});

async function getStripeKeys() {
  const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
  if (!data.length) throw new Error("No settings found");
  const { pay_stripe_id, pay_stripe_key, stripe_active } = data[0];
  if (!stripe_active) throw new Error("Stripe is not enabled");
  if (!pay_stripe_key) throw new Error("Stripe secret key not configured");
  if (!pay_stripe_id) throw new Error("Stripe public key not configured");
  return {
    secretKey: pay_stripe_key,
    publicKey: pay_stripe_id,
  };
}

// ── POST /api/payment/stripe/create-session ──────────────────────────────────
router.post("/stripe/create-session", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const item = await getPurchaseItem(getPurchaseInput(req.body));

    const { secretKey } = await getStripeKeys();
    const { symbol, code, rate } = await getCurrency(req); // ← currency
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";
    const stripe = require("stripe")(secretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: code.toLowerCase(), // ← dynamic
            unit_amount: toSmallestUnit(item.price, rate, code), // ← converted
            product_data: {
              name: item.title,
              description: item.description,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/checkout/success?gateway=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${getCancelPath(item)}?cancelled=true`,
      metadata: getPurchaseMetadata(item, uid),
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Stripe session creation failed",
    });
  }
});

// ── POST /api/payment/stripe/create-subscription ──────────────────────────────
router.post("/stripe/create-subscription", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const { plan_id, billing_interval } = req.body;
    const { plan, billingInterval, amount } = await getSubscriptionPlan({
      planId: plan_id,
      billingInterval: billing_interval,
    });
    const { secretKey } = await getStripeKeys();
    const { code, rate } = await getCurrency(req);
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";
    const stripe = require("stripe")(secretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: code.toLowerCase(),
            unit_amount: toSmallestUnit(amount, rate, code),
            recurring: {
              interval: billingInterval === "yearly" ? "year" : "month",
            },
            product_data: {
              name: plan.title,
              description: `${plan.credits} credits · ${billingInterval} subscription`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/success?gateway=stripe&session_id={CHECKOUT_SESSION_ID}&mode=subscription`,
      cancel_url: `${appUrl}/checkout/${plan.id}?billing=${billingInterval}&cancelled=true`,
      metadata: {
        product_type: "plan_subscription",
        plan_id: String(plan.id),
        uid: String(uid),
        billing_interval: billingInterval,
      },
      subscription_data: {
        metadata: {
          plan_id: String(plan.id),
          uid: String(uid),
          billing_interval: billingInterval,
        },
      },
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Stripe subscription creation failed",
    });
  }
});

// ── POST /api/payment/stripe/verify-session ──────────────────────────────────
router.post("/stripe/verify-session", userValidator, async (req, res) => {
  try {
    const { session_id } = req.body;
    const uid = req.decode.uid; // ← uid from JWT

    const stripe = await getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // must be paid
    if (session.payment_status !== "paid") {
      return res.json({ success: false, msg: "Payment not completed" });
    }

    // must belong to this user
    if (String(session.metadata.uid) !== String(uid)) {
      return res.json({ success: false, msg: "Unauthorized" });
    }

    if (session.mode === "subscription") {
      const billingInterval = normalizeBillingInterval(
        session.metadata.billing_interval,
      );
      const { plan, amount } = await getSubscriptionPlan({
        planId: session.metadata.plan_id,
        billingInterval,
      });

      const existingSubscription = await query(
        `SELECT id FROM subscriptions WHERE gateway = 'stripe' AND gateway_subscription_id = ? LIMIT 1`,
        [session.subscription],
      );
      if (!existingSubscription.length) {
        await saveSubscription({
          uid,
          planId: plan.id,
          billingInterval,
          amount,
          gateway: "stripe",
          gatewaySubscriptionId: session.subscription,
          gatewayCustomerId: session.customer,
          meta: {
            session_id: session.id,
            payment_intent: session.payment_intent,
          },
        });
      }

      const result = await updateUserPlan({ planId: plan.id, uid });
      if (!result.success) return res.json({ success: false, msg: result.msg });

      return res.json({
        success: true,
        msg: "Subscription activated successfully!",
        product_type: "plan_subscription",
      });
    }

    const item = await getPurchaseItem({
      productType: session.metadata.product_type || "plan",
      productId:
        session.metadata.product_type === "credit_package"
          ? session.metadata.package_id
          : session.metadata.plan_id,
    });

    // ── idempotency: don't activate twice ────────────────────────────────────
    const existing = await query(
      `SELECT id FROM orders WHERE gateway = 'stripe' AND JSON_EXTRACT(meta, '$.session_id') = ? LIMIT 1`,
      [session_id],
    );
    if (existing.length) {
      return res.json({
        success: true,
        msg: "Plan already activated",
        alreadyDone: true,
      });
    }

    // ── save order record ─────────────────────────────────────────────────────
    const order = await savePaidOrder({
      uid,
      item,
      amount: session.amount_total / 100,
      gateway: "stripe",
      meta: {
        session_id: session.id,
        payment_intent: session.payment_intent,
        customer_email: session.customer_details?.email || null,
      },
    });

    const result = await fulfillPurchase(item, uid, {
      gateway: "stripe",
      amount: session.amount_total / 100,
      orderId: order.insertId,
    });

    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }

    res.json({
      success: true,
      msg: successMessage(item),
      product_type: item.productType,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message || "Verification failed" });
  }
});

// ── helper: get PayPal client ─────────────────────────────────────────────────
async function getPayPalClient() {
  const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
  if (!data.length) throw new Error("No settings found");
  const { pay_paypal_id, pay_paypal_key, paypal_active } = data[0];
  if (!paypal_active) throw new Error("PayPal is not enabled");
  if (!pay_paypal_id) throw new Error("PayPal client ID not configured");
  if (!pay_paypal_key) throw new Error("PayPal secret not configured");

  // const environment =
  //   process.env.PAYPAL_MODE === "live"
  //     ? new paypal.core.LiveEnvironment(pay_paypal_id, pay_paypal_key)
  //     : new paypal.core.SandboxEnvironment(pay_paypal_id, pay_paypal_key);

  const environment = new paypal.core.LiveEnvironment(
    pay_paypal_id,
    pay_paypal_key,
  );

  return new paypal.core.PayPalHttpClient(environment);
}

async function getPayPalAccessToken() {
  const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
  if (!data.length) throw new Error("No settings found");
  const { pay_paypal_id, pay_paypal_key, paypal_active } = data[0];
  if (!paypal_active) throw new Error("PayPal is not enabled");
  const auth = Buffer.from(`${pay_paypal_id}:${pay_paypal_key}`).toString(
    "base64",
  );
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error_description || result.error);
  return result.access_token;
}

router.post("/paypal/create-subscription", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const { plan_id, billing_interval } = req.body;
    const { plan, billingInterval, amount } = await getSubscriptionPlan({
      planId: plan_id,
      billingInterval: billing_interval,
    });
    const { code, rate } = await getCurrency(req);
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";
    const accessToken = await getPayPalAccessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const productRes = await fetch("https://api-m.paypal.com/v1/catalogs/products", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: plan.title,
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    });
    const product = await productRes.json();
    if (!productRes.ok) throw new Error(product.message || "PayPal product creation failed");

    const localAmount = toLocalAmount(amount, rate);
    const planRes = await fetch("https://api-m.paypal.com/v1/billing/plans", {
      method: "POST",
      headers,
      body: JSON.stringify({
        product_id: product.id,
        name: `${plan.title} ${billingInterval}`,
        billing_cycles: [
          {
            frequency: {
              interval_unit: billingInterval === "yearly" ? "YEAR" : "MONTH",
              interval_count: 1,
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: localAmount.toFixed(2),
                currency_code: code.toUpperCase(),
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });
    const paypalPlan = await planRes.json();
    if (!planRes.ok) throw new Error(paypalPlan.message || "PayPal plan creation failed");

    const subRes = await fetch("https://api-m.paypal.com/v1/billing/subscriptions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        plan_id: paypalPlan.id,
        custom_id: JSON.stringify({
          uid,
          plan_id: String(plan.id),
          billing_interval: billingInterval,
        }),
        application_context: {
          brand_name: process.env.APP_NAME || "MyAvatarLab",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${appUrl}/checkout/success?gateway=paypal&mode=subscription`,
          cancel_url: `${appUrl}/checkout/${plan.id}?billing=${billingInterval}&cancelled=true`,
        },
      }),
    });
    const subscription = await subRes.json();
    if (!subRes.ok) throw new Error(subscription.message || "PayPal subscription creation failed");
    const approveUrl = subscription.links?.find((l) => l.rel === "approve")?.href;
    if (!approveUrl) throw new Error("PayPal approval URL not found");

    await saveSubscription({
      uid,
      planId: plan.id,
      billingInterval,
      amount,
      gateway: "paypal",
      gatewaySubscriptionId: subscription.id,
      status: "pending",
      meta: { paypal_plan_id: paypalPlan.id, paypal_product_id: product.id },
    });

    res.json({ success: true, url: approveUrl, subscriptionId: subscription.id });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message || "PayPal subscription creation failed" });
  }
});

// ── POST /api/payment/paypal/create-order ─────────────────────────────────────
router.post("/paypal/create-order", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const item = await getPurchaseItem(getPurchaseInput(req.body));

    // ✅ FIX: no destructuring
    const client = await getPayPalClient();

    const { code, rate } = await getCurrency(req);
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";

    const localAmount = toLocalAmount(item.price, rate);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: code.toUpperCase(),
            value: localAmount.toFixed(2),
          },
          description: `${item.title} — ${item.description}`,
          custom_id: JSON.stringify(getPurchaseMetadata(item, uid)),
        },
      ],
      application_context: {
        brand_name: process.env.APP_NAME || "App",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${appUrl}/checkout/success?gateway=paypal`,
        cancel_url: `${appUrl}${getCancelPath(item)}?cancelled=true`,
      },
    });

    // ✅ correct usage
    const order = await client.execute(request);

    const approveUrl = order.result.links.find(
      (l) => l.rel === "approve",
    )?.href;

    if (!approveUrl) {
      return res.json({
        success: false,
        msg: "Could not get PayPal approval URL",
      });
    }

    return res.json({
      success: true,
      url: approveUrl,
      orderId: order.result.id,
    });
  } catch (err) {
    console.log("PayPal create order error:", err);

    return res.json({
      success: false,
      msg: err.message || "PayPal order creation failed",
    });
  }
});

// ── POST /api/payment/paypal/verify-order ─────────────────────────────────────
router.post("/paypal/verify-order", userValidator, async (req, res) => {
  try {
    const { order_id } = req.body;
    const uid = req.decode.uid;

    const client = await getPayPalClient();

    // capture the payment
    const captureRequest = new paypal.orders.OrdersCaptureRequest(order_id);
    captureRequest.requestBody({});
    const capture = await client.execute(captureRequest);

    const result = capture.result;

    if (result.status !== "COMPLETED") {
      return res.json({ success: false, msg: "Payment not completed" });
    }

    // extract purchase metadata from custom_id we stored earlier
    const customId = result.purchase_units?.[0]?.custom_id;
    const parsed = JSON.parse(customId || "{}");
    const item = await getPurchaseItem({
      productType: parsed.product_type || "plan",
      productId:
        parsed.product_type === "credit_package"
          ? parsed.package_id
          : parsed.plan_id,
    });
    const tokenUid = parsed.uid;

    // security: make sure uid matches
    if (String(tokenUid) !== String(uid)) {
      return res.json({ success: false, msg: "Unauthorized" });
    }

    // idempotency check
    const existing = await query(
      `SELECT id FROM orders WHERE gateway = 'paypal' AND JSON_EXTRACT(meta, '$.order_id') = ? LIMIT 1`,
      [order_id],
    );
    if (existing.length) {
      return res.json({
        success: true,
        msg: "Plan already activated",
        alreadyDone: true,
      });
    }

    const captureId = result.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerEmail = result.payer?.email_address || null;
    const payerId = result.payer?.payer_id || null;
    const amountPaid =
      result.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;

    const order = await savePaidOrder({
      uid,
      item,
      amount: amountPaid,
      gateway: "paypal",
      meta: {
        order_id: order_id,
        capture_id: captureId,
        payer_email: payerEmail,
        payer_id: payerId,
      },
    });

    const planResult = await fulfillPurchase(item, uid, {
      gateway: "paypal",
      amount: amountPaid,
      orderId: order.insertId,
    });
    if (!planResult.success) {
      return res.json({ success: false, msg: planResult.msg });
    }

    res.json({
      success: true,
      msg: successMessage(item),
      product_type: item.productType,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "PayPal verification failed",
    });
  }
});

// ── helper: get Razorpay instance ─────────────────────────────────────────────
async function getRazorpayInstance() {
  const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
  if (!data.length) throw new Error("No settings found");
  const { rz_id, rz_key, rz_active } = data[0];
  if (!rz_active) throw new Error("Razorpay is not enabled");
  if (!rz_id) throw new Error("Razorpay key ID not configured");
  if (!rz_key) throw new Error("Razorpay key secret not configured");
  return {
    instance: new Razorpay({ key_id: rz_id, key_secret: rz_key }),
    rz_id,
    rz_key,
  };
}

// ── POST /api/payment/razorpay/create-order ───────────────────────────────────
router.post("/razorpay/create-order", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const item = await getPurchaseItem(getPurchaseInput(req.body));

    const { instance, rz_id } = await getRazorpayInstance();
    const { symbol, code, rate } = await getCurrency(req); // ← currency

    const order = await instance.orders.create({
      amount: toSmallestUnit(item.price, rate, code), // ← converted
      currency: code.toUpperCase(), // ← dynamic
      receipt: `receipt_${uid}_${item.productType}_${item.planId || item.packageId}_${Date.now()}`,
      notes: getPurchaseMetadata(item, uid),
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: rz_id,
      plan: {
        title: item.title,
        description: item.description,
      },
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Razorpay order creation failed",
    });
  }
});

router.post("/razorpay/create-subscription", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const { plan_id, billing_interval } = req.body;
    const { plan, billingInterval, amount } = await getSubscriptionPlan({
      planId: plan_id,
      billingInterval: billing_interval,
    });
    const { instance, rz_id } = await getRazorpayInstance();
    const { code, rate } = await getCurrency(req);

    const razorpayPlan = await instance.plans.create({
      period: billingInterval === "yearly" ? "yearly" : "monthly",
      interval: 1,
      item: {
        name: `${plan.title} ${billingInterval}`,
        amount: toSmallestUnit(amount, rate, code),
        currency: code.toUpperCase(),
        description: `${plan.credits} credits`,
      },
      notes: {
        uid: String(uid),
        plan_id: String(plan.id),
        billing_interval: billingInterval,
      },
    });

    const subscription = await instance.subscriptions.create({
      plan_id: razorpayPlan.id,
      total_count: billingInterval === "yearly" ? 10 : 120,
      customer_notify: 1,
      notes: {
        uid: String(uid),
        plan_id: String(plan.id),
        billing_interval: billingInterval,
      },
    });

    await saveSubscription({
      uid,
      planId: plan.id,
      billingInterval,
      amount,
      gateway: "razorpay",
      gatewaySubscriptionId: subscription.id,
      status: "pending",
      meta: { razorpay_plan_id: razorpayPlan.id },
    });

    res.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: rz_id,
      plan: {
        title: plan.title,
        description: `${plan.credits} credits · ${billingInterval}`,
      },
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Razorpay subscription creation failed",
    });
  }
});

// ── POST /api/payment/razorpay/verify-order ───────────────────────────────────
router.post("/razorpay/verify-order", userValidator, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
      package_id,
      product_type,
    } = req.body;
    const uid = req.decode.uid;

    const { rz_key } = await getRazorpayInstance();

    // ── verify signature ──────────────────────────────────────────────────────
    const expectedSignature = crypto
      .createHmac("sha256", rz_key)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, msg: "Invalid payment signature" });
    }

    // ── idempotency ───────────────────────────────────────────────────────────
    const existing = await query(
      `SELECT id FROM orders WHERE gateway = 'razorpay' AND JSON_EXTRACT(meta, '$.payment_id') = ? LIMIT 1`,
      [razorpay_payment_id],
    );
    if (existing.length) {
      return res.json({
        success: true,
        msg: "Plan already activated",
        alreadyDone: true,
      });
    }

    const item = await getPurchaseItem(
      getPurchaseInput({ plan_id, package_id, product_type }),
    );

    const order = await savePaidOrder({
      uid,
      item,
      amount: parseFloat(item.price),
      gateway: "razorpay",
      meta: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

    const result = await fulfillPurchase(item, uid, {
      gateway: "razorpay",
      amount: parseFloat(item.price),
      orderId: order.insertId,
    });
    if (!result.success) return res.json({ success: false, msg: result.msg });

    res.json({
      success: true,
      msg: successMessage(item),
      product_type: item.productType,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Razorpay verification failed",
    });
  }
});

router.post("/razorpay/verify-subscription", userValidator, async (req, res) => {
  try {
    const {
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    const uid = req.decode.uid;
    const { rz_key } = await getRazorpayInstance();
    const expectedSignature = crypto
      .createHmac("sha256", rz_key)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, msg: "Invalid subscription signature" });
    }

    const [subscription] = await query(
      `SELECT * FROM subscriptions WHERE gateway = 'razorpay' AND gateway_subscription_id = ? AND uid = ? LIMIT 1`,
      [razorpay_subscription_id, uid],
    );
    if (!subscription) {
      return res.json({ success: false, msg: "Subscription record not found" });
    }

    await query(
      `UPDATE subscriptions SET status = 'active', meta = JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.payment_id', ?, '$.signature', ?) WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, subscription.id],
    );

    const result = await updateUserPlan({ planId: subscription.plan_id, uid });
    if (!result.success) return res.json({ success: false, msg: result.msg });

    res.json({
      success: true,
      msg: "Subscription activated successfully!",
      product_type: "plan_subscription",
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Razorpay subscription verification failed",
    });
  }
});

// ── helper: get Paystack keys ─────────────────────────────────────────────────
async function getPaystackKeys() {
  const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
  if (!data.length) throw new Error("No settings found");
  const { pay_paystack_id, pay_paystack_key, paystack_active } = data[0];
  if (!paystack_active) throw new Error("Paystack is not enabled");
  if (!pay_paystack_key) throw new Error("Paystack secret key not configured");
  if (!pay_paystack_id) throw new Error("Paystack public key not configured");
  return { secretKey: pay_paystack_key, publicKey: pay_paystack_id };
}

// ── POST /api/payment/paystack/create-order ───────────────────────────────────
router.post("/paystack/create-order", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const item = await getPurchaseItem(getPurchaseInput(req.body));

    const users = await query(`SELECT * FROM user WHERE uid = ? LIMIT 1`, [
      uid,
    ]);
    if (!users.length)
      return res.json({ success: false, msg: "User not found" });
    const user = users[0];

    const { secretKey, publicKey } = await getPaystackKeys();
    const { symbol, code, rate } = await getCurrency(req); // ← currency
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";
    const reference = `pstk_${uid}_${item.productType}_${item.planId || item.packageId}_${Date.now()}`;

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: toSmallestUnit(item.price, rate, code), // ← converted
          currency: code.toUpperCase(), // ← dynamic
          reference: reference,
          metadata: {
            ...getPurchaseMetadata(item, uid),
            product_title: item.title,
          },
          callback_url: `${appUrl}/checkout/success?gateway=paystack`,
        }),
      },
    );

    const paystackData = await paystackRes.json();
    if (!paystackData.status) {
      return res.json({
        success: false,
        msg: paystackData.message || "Paystack init failed",
      });
    }

    res.json({
      success: true,
      url: paystackData.data.authorization_url,
      reference: reference,
      publicKey: publicKey,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Paystack order creation failed",
    });
  }
});

router.post("/paystack/create-subscription", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const { plan_id, billing_interval } = req.body;
    const { plan, billingInterval, amount } = await getSubscriptionPlan({
      planId: plan_id,
      billingInterval: billing_interval,
    });
    const users = await query(`SELECT * FROM user WHERE uid = ? LIMIT 1`, [
      uid,
    ]);
    if (!users.length) return res.json({ success: false, msg: "User not found" });
    const user = users[0];
    const { secretKey, publicKey } = await getPaystackKeys();
    const { code, rate } = await getCurrency(req);
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";

    const planRes = await fetch("https://api.paystack.co/plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${plan.title} ${billingInterval}`,
        amount: toSmallestUnit(amount, rate, code),
        interval: billingInterval === "yearly" ? "annually" : "monthly",
        currency: code.toUpperCase(),
      }),
    });
    const paystackPlan = await planRes.json();
    if (!paystackPlan.status) {
      return res.json({
        success: false,
        msg: paystackPlan.message || "Paystack plan creation failed",
      });
    }

    const reference = `pstk_sub_${uid}_${plan.id}_${billingInterval}_${Date.now()}`;
    const initRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: toSmallestUnit(amount, rate, code),
          currency: code.toUpperCase(),
          reference,
          plan: paystackPlan.data.plan_code,
          metadata: {
            product_type: "plan_subscription",
            uid: String(uid),
            plan_id: String(plan.id),
            billing_interval: billingInterval,
          },
          callback_url: `${appUrl}/checkout/success?gateway=paystack&mode=subscription`,
        }),
      },
    );
    const initData = await initRes.json();
    if (!initData.status) {
      return res.json({
        success: false,
        msg: initData.message || "Paystack subscription init failed",
      });
    }

    await saveSubscription({
      uid,
      planId: plan.id,
      billingInterval,
      amount,
      gateway: "paystack",
      gatewaySubscriptionId: paystackPlan.data.plan_code,
      status: "pending",
      meta: { reference, plan_code: paystackPlan.data.plan_code },
    });

    res.json({
      success: true,
      url: initData.data.authorization_url,
      reference,
      publicKey,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Paystack subscription creation failed",
    });
  }
});

// ── POST /api/payment/paystack/verify-order ───────────────────────────────────
router.post("/paystack/verify-order", userValidator, async (req, res) => {
  try {
    const { reference } = req.body;
    const uid = req.decode.uid;

    const { secretKey } = await getPaystackKeys();

    // verify with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return res.json({ success: false, msg: "Payment not completed" });
    }

    const txData = verifyData.data;

    // security: uid must match what we stored in metadata
    if (String(txData.metadata?.uid) !== String(uid)) {
      return res.json({ success: false, msg: "Unauthorized" });
    }

    const item = await getPurchaseItem({
      productType: txData.metadata?.product_type || "plan",
      productId:
        txData.metadata?.product_type === "credit_package"
          ? txData.metadata?.package_id
          : txData.metadata?.plan_id,
    });

    // ── idempotency ───────────────────────────────────────────────────────────
    const existing = await query(
      `SELECT id FROM orders WHERE gateway = 'paystack' AND JSON_EXTRACT(meta, '$.reference') = ? LIMIT 1`,
      [reference],
    );
    if (existing.length) {
      return res.json({
        success: true,
        msg: "Plan already activated",
        alreadyDone: true,
      });
    }

    // ── save order ────────────────────────────────────────────────────────────
    const order = await savePaidOrder({
      uid,
      item,
      amount: txData.amount / 100,
      gateway: "paystack",
      meta: {
        reference: reference,
        transaction_id: String(txData.id),
        channel: txData.channel,
        payer_email: txData.customer?.email || null,
      },
    });

    const result = await fulfillPurchase(item, uid, {
      gateway: "paystack",
      amount: txData.amount / 100,
      orderId: order.insertId,
    });
    if (!result.success) return res.json({ success: false, msg: result.msg });

    res.json({
      success: true,
      msg: successMessage(item),
      product_type: item.productType,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Paystack verification failed",
    });
  }
});

// ── helper: get MercadoPago client ────────────────────────────────────────────
async function getMercadoPagoClient() {
  const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
  if (!data.length) throw new Error("No settings found");
  const { pay_mercadopago_access_token, mercadopago_active } = data[0];
  if (!mercadopago_active) throw new Error("Mercado Pago is not enabled");
  if (!pay_mercadopago_access_token)
    throw new Error("Mercado Pago access token not configured");

  const client = new MercadoPagoConfig({
    accessToken: pay_mercadopago_access_token,
  });

  return client;
}

// ── POST /api/payment/mercadopago/create-order ────────────────────────────────
router.post("/mercadopago/create-order", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const item = await getPurchaseItem(getPurchaseInput(req.body));

    const users = await query(`SELECT * FROM user WHERE uid = ? LIMIT 1`, [
      uid,
    ]);
    if (!users.length)
      return res.json({ success: false, msg: "User not found" });
    const user = users[0];

    const client = await getMercadoPagoClient();
    const { symbol, code, rate } = await getCurrency(req); // ← currency
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";
    const preference = new Preference(client);

    const localAmount = toLocalAmount(item.price, rate);

    const response = await preference.create({
      body: {
        items: [
          {
            id: String(item.planId || item.packageId),
            title: item.title,
            description: item.description,
            quantity: 1,
            unit_price: localAmount, // ← converted
            currency_id: code.toUpperCase(), // ← dynamic
          },
        ],
        payer: { email: user.email },
        metadata: getPurchaseMetadata(item, uid),
        external_reference: `mp_${uid}_${item.productType}_${item.planId || item.packageId}_${Date.now()}`,
        back_urls: {
          success: `${appUrl}/checkout/success?gateway=mercadopago`,
          failure: `${appUrl}${getCancelPath(item)}?cancelled=true`,
          pending: `${appUrl}/checkout/success?gateway=mercadopago&pending=true`,
        },
        auto_return: "approved",
      },
    });

    res.json({
      success: true,
      url: response.init_point,
      preferenceId: response.id,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Mercado Pago order creation failed",
    });
  }
});

router.post("/mercadopago/create-subscription", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const { plan_id, billing_interval } = req.body;
    const { plan, billingInterval, amount } = await getSubscriptionPlan({
      planId: plan_id,
      billingInterval: billing_interval,
    });
    const users = await query(`SELECT * FROM user WHERE uid = ? LIMIT 1`, [
      uid,
    ]);
    if (!users.length) return res.json({ success: false, msg: "User not found" });
    const user = users[0];
    const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
    if (!data.length || !data[0].mercadopago_active) {
      throw new Error("Mercado Pago is not enabled");
    }
    const accessToken = data[0].pay_mercadopago_access_token;
    if (!accessToken) throw new Error("Mercado Pago access token not configured");
    const { code, rate } = await getCurrency(req);
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";
    const localAmount = toLocalAmount(amount, rate);
    const externalReference = `mp_sub_${uid}_${plan.id}_${billingInterval}_${Date.now()}`;

    const preapprovalRes = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: `${plan.title} ${billingInterval}`,
          external_reference: externalReference,
          payer_email: user.email,
          back_url: `${appUrl}/checkout/success?gateway=mercadopago&mode=subscription`,
          auto_recurring: {
            frequency: 1,
            frequency_type: billingInterval === "yearly" ? "years" : "months",
            transaction_amount: localAmount,
            currency_id: code.toUpperCase(),
          },
          metadata: {
            uid: String(uid),
            plan_id: String(plan.id),
            billing_interval: billingInterval,
          },
        }),
      },
    );
    const preapproval = await preapprovalRes.json();
    if (!preapprovalRes.ok) {
      throw new Error(preapproval.message || "Mercado Pago preapproval failed");
    }

    await saveSubscription({
      uid,
      planId: plan.id,
      billingInterval,
      amount,
      gateway: "mercadopago",
      gatewaySubscriptionId: preapproval.id,
      status: "pending",
      meta: { external_reference: externalReference },
    });

    res.json({
      success: true,
      url: preapproval.init_point,
      subscriptionId: preapproval.id,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Mercado Pago subscription creation failed",
    });
  }
});

// ── POST /api/payment/mercadopago/verify-order ────────────────────────────────
router.post("/mercadopago/verify-order", userValidator, async (req, res) => {
  try {
    // Mercado Pago appends ?payment_id=xxx&status=approved&external_reference=xxx to success URL
    const { payment_id, external_reference } = req.body;
    const uid = req.decode.uid;

    const client = await getMercadoPagoClient();
    const payment = new Payment(client);

    const paymentData = await payment.get({ id: payment_id });

    // must be approved
    if (paymentData.status !== "approved") {
      return res.json({
        success: false,
        msg: `Payment status: ${paymentData.status}`,
      });
    }

    // security: uid must match metadata
    if (String(paymentData.metadata?.uid) !== String(uid)) {
      return res.json({ success: false, msg: "Unauthorized" });
    }

    const item = await getPurchaseItem({
      productType: paymentData.metadata?.product_type || "plan",
      productId:
        paymentData.metadata?.product_type === "credit_package"
          ? paymentData.metadata?.package_id
          : paymentData.metadata?.plan_id,
    });

    // ── idempotency ───────────────────────────────────────────────────────────
    const existing = await query(
      `SELECT id FROM orders WHERE gateway = 'mercadopago' AND JSON_EXTRACT(meta, '$.payment_id') = ? LIMIT 1`,
      [String(payment_id)],
    );
    if (existing.length) {
      return res.json({
        success: true,
        msg: "Plan already activated",
        alreadyDone: true,
      });
    }

    // ── save order ────────────────────────────────────────────────────────────
    const order = await savePaidOrder({
      uid,
      item,
      amount: paymentData.transaction_amount,
      gateway: "mercadopago",
      meta: {
        payment_id: String(payment_id),
        external_reference: external_reference,
        payment_type: paymentData.payment_type_id,
        payer_email: paymentData.payer?.email || null,
      },
    });

    const result = await fulfillPurchase(item, uid, {
      gateway: "mercadopago",
      amount: paymentData.transaction_amount,
      orderId: order.insertId,
    });
    if (!result.success) return res.json({ success: false, msg: result.msg });

    res.json({
      success: true,
      msg: successMessage(item),
      product_type: item.productType,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "Mercado Pago verification failed",
    });
  }
});

// ── GET /api/payment/currency ─────────────────────────────────────────────────
router.get("/currency", async (req, res) => {
  try {
    const currency = await getCurrency(req);
    res.json({ success: true, data: currency });
  } catch (err) {
    res.json({ success: false, msg: err.message });
  }
});

router.post("/get_free_trial", userValidator, async (req, res) => {
  try {
    const { id } = req.body;
    const uid = req.decode.uid;

    // ── validate plan ─────────────────────────────────────────────────────
    const [plan] = await query(`SELECT * FROM plan WHERE id = ?`, [id]);
    if (!plan) {
      return res.json({ success: false, msg: "Invalid plan id found" });
    }

    if (parseInt(plan?.price) > 0) {
      return res.json({
        success: false,
        msg: "This plan is not on Free Trial",
      });
    }

    if (parseInt(req.decode?.user?.trial_used) > 0) {
      return res.json({
        success: false,
        msg: "You already have used the Trial. Please buy a plan now.",
      });
    }

    // ── activate plan ─────────────────────────────────────────────────────
    const d = await updateUserPlan({
      planId: id,
      uid: uid,
      trial: true,
    });

    if (!d?.success) {
      return res.json(d);
    }

    // ── record the order ──────────────────────────────────────────────────
    // ── record the order ──────────────────────────────────────────────────────
    await query(
      `INSERT INTO orders (uid, plan_id, package_id, product_type, amount, gateway, meta, status, created_at)
     VALUES (?, ?, NULL, 'plan', ?, 'free_trial', ?, 'paid', NOW())`, // ← was 'stripe', now 'free_trial'
      [
        uid,
        id,
        0,
        JSON.stringify({
          type: "free_trial",
          order_id: `FREE_TRIAL_${uid}_${Date.now()}`,
        }),
      ],
    );

    res.json({ success: true, msg: "Plan activated successfully!" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message });
  }
});

// ── GET /api/payment/orders ───────────────────────────────────────────────────
router.get("/orders", adminValidator, async (req, res) => {
  try {
    const orders = await query(
      `SELECT o.*, 
        p.title as plan_title, p.credits as plan_credits, p.expiry_days,
        cp.title as package_title, cp.credits as package_credits,
        u.email as user_email, u.name as user_name
       FROM orders o
       LEFT JOIN plan p ON p.id = o.plan_id
       LEFT JOIN credit_packages cp ON cp.id = o.package_id
       LEFT JOIN user u ON u.uid = o.uid
       ORDER BY o.created_at DESC`,
      [],
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message });
  }
});

// ── DELETE /api/payment/orders/:id ───────────────────────────────────────────
router.delete("/orders/:id", adminValidator, async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM orders WHERE id = ?`, [id]);
    res.json({ success: true, msg: "Order deleted successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message });
  }
});

// ── GET /api/payment/offline-details ─────────────────────────────────────────
router.get("/offline-details", async (req, res) => {
  try {
    const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
    if (!data.length)
      return res.json({ success: true, active: false, html: "" });

    res.json({
      success: true,
      active: !!data[0].offline_payment_active,
      html: data[0].offline_payment_html || "",
    });
  } catch (err) {
    res.json({ success: false, msg: err.message });
  }
});

module.exports = router;

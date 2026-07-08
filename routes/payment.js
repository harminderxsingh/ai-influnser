const express = require("express");
const router = express.Router();
const { query } = require("../database/connection.js");
const adminValidator = require("../middlewares/admin.js");
const userValidator = require("../middlewares/user.js");
const Stripe = require("stripe");
const { updateUserPlan, addUserCredits, getEnv } = require("../utils/common.js");
const paypal = require("@paypal/checkout-server-sdk");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const payuCallbackParser = express.urlencoded({ extended: false, type: "*/*" });

// Prices are stored, displayed, and charged in USD.
async function getCurrency(req = null) {
  return {
    symbol: "$",
    code: "USD",
    rate: 1,
    base: "USD",
    country: "US",
  };
}

// ── helper: convert USD price → smallest unit ─────────────────────────────────
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

function getPayUUsdToInrRate() {
  const configuredRate = parseFloat(process.env.PAYU_USD_TO_INR_RATE || "");
  return Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 85;
}

function getPayUInrAmount(usdPrice) {
  return toLocalAmount(usdPrice, getPayUUsdToInrRate());
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
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
    description: `${plan.credits} credits · lifetime access`,
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

function getPurchaseBillingInterval(item, billingInterval) {
  return null;
}

function getPurchaseAmount(item, billingInterval = null) {
  return item.price;
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

function createRazorpayReceipt() {
  return `rcpt_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function createPaymentReference(prefix) {
  return `${prefix}${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
}

function getConfiguredAppUrl() {
  const env = getEnv();
  return (
    process.env.APP_URL ||
    env.backendUrl ||
    env.frontendUrl ||
    "http://localhost:8001"
  ).replace(/\/$/, "");
}

function getPayUPhone(user = {}) {
  const raw = String(user.mobile || user.phone || user.whatsapp || "").replace(
    /\D/g,
    "",
  );
  if (raw.length >= 10) return raw.slice(-10);
  return "9999999999";
}

function sanitizePayUField(value, fallback = "") {
  return String(value || fallback)
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
      paypal_mode,
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
      payu_key,
      payu_salt,
      payu_mode,
      payu_active,
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
        paypal_mode: paypal_mode === "sandbox" ? "sandbox" : "live",
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
        payu_key,
        payu_salt,
        payu_mode,
        payu_active,
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
      paypal_mode,
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
      payu_key,
      payu_salt,
      payu_mode,
      payu_active,
      offline_payment_html,
      offline_payment_active,
    } = req.body;

    await query(
      `UPDATE web_private SET
        pay_stripe_id = ?, pay_stripe_key = ?, stripe_active = ?,
        pay_paypal_id = ?, pay_paypal_key = ?, paypal_mode = ?, paypal_active = ?,
        rz_id = ?, rz_key = ?, rz_active = ?,
        pay_paystack_id = ?, pay_paystack_key = ?, paystack_active = ?,
        pay_mercadopago_access_token = ?, pay_mercadopago_public_key = ?, mercadopago_active = ?,
        payu_key = ?, payu_salt = ?, payu_mode = ?, payu_active = ?,
        offline_payment_html = ?, offline_payment_active = ?`,
      [
        pay_stripe_id || null,
        pay_stripe_key || null,
        stripe_active || 0,
        pay_paypal_id || null,
        pay_paypal_key || null,
        paypal_mode === "sandbox" ? "sandbox" : "live",
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
        payu_key || null,
        payu_salt || null,
        payu_mode === "live" ? "live" : "test",
        payu_active || 0,
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
        paypal: {
          active: !!d.paypal_active,
          clientId: d.pay_paypal_id,
          mode: d.paypal_mode === "sandbox" ? "sandbox" : "live",
        },
        razorpay: { active: !!d.rz_active, keyId: d.rz_id },
        paystack: { active: !!d.paystack_active, publicKey: d.pay_paystack_id },
        mercadopago: {
          active: !!d.mercadopago_active,
          publicKey: d.pay_mercadopago_public_key,
        },
        payu: {
          active: !!d.payu_active,
          mode: d.payu_mode === "live" ? "live" : "test",
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
    const billingInterval = getPurchaseBillingInterval(
      item,
      req.body.billing_interval,
    );
    const amount = getPurchaseAmount(item, billingInterval);

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
            unit_amount: toSmallestUnit(amount, rate, code), // ← converted
            product_data: {
              name: item.title,
              description: billingInterval
                ? `${item.credits} credits · ${billingInterval}`
                : item.description,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/checkout/success?gateway=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${getCancelPath(item)}?cancelled=true`,
      metadata: {
        ...getPurchaseMetadata(item, uid),
        ...(billingInterval ? { billing_interval: billingInterval } : {}),
      },
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
        ...(session.metadata?.billing_interval
          ? { billing_interval: session.metadata.billing_interval }
          : {}),
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
  const { pay_paypal_id, pay_paypal_key, paypal_mode, paypal_active } = data[0];
  if (!paypal_active) throw new Error("PayPal is not enabled");
  if (!pay_paypal_id) throw new Error("PayPal client ID not configured");
  if (!pay_paypal_key) throw new Error("PayPal secret not configured");

  const Environment =
    paypal_mode === "sandbox"
      ? paypal.core.SandboxEnvironment
      : paypal.core.LiveEnvironment;
  const environment = new Environment(pay_paypal_id, pay_paypal_key);

  return new paypal.core.PayPalHttpClient(environment);
}

// ── POST /api/payment/paypal/create-order ─────────────────────────────────────
router.post("/paypal/create-order", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const item = await getPurchaseItem(getPurchaseInput(req.body));
    const billingInterval = getPurchaseBillingInterval(
      item,
      req.body.billing_interval,
    );
    const amount = getPurchaseAmount(item, billingInterval);

    // ✅ FIX: no destructuring
    const client = await getPayPalClient();

    const { code, rate } = await getCurrency(req);
    const appUrl = process.env.APP_URL || "https://myavatarlab.com";

    const localAmount = toLocalAmount(amount, rate);
    const metadata = {
      ...getPurchaseMetadata(item, uid),
      ...(billingInterval ? { billing_interval: billingInterval } : {}),
    };

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
          description: `${item.title} — ${
            billingInterval
              ? `${item.credits} credits · ${billingInterval}`
              : item.description
          }`,
          custom_id: JSON.stringify(metadata),
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
        ...(parsed.billing_interval
          ? { billing_interval: parsed.billing_interval }
          : {}),
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
    const billingInterval = getPurchaseBillingInterval(
      item,
      req.body.billing_interval,
    );
    const amount = getPurchaseAmount(item, billingInterval);

    const { instance, rz_id } = await getRazorpayInstance();
    const { symbol, code, rate } = await getCurrency(req); // ← currency

    const order = await instance.orders.create({
      amount: toSmallestUnit(amount, rate, code), // ← converted
      currency: code.toUpperCase(), // ← dynamic
      receipt: createRazorpayReceipt(),
      notes: {
        ...getPurchaseMetadata(item, uid),
        ...(billingInterval ? { billing_interval: billingInterval } : {}),
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: rz_id,
      plan: {
        title: item.title,
        description: billingInterval
          ? `${item.credits} credits · ${billingInterval}`
          : item.description,
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
      billing_interval,
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
    const billingInterval = getPurchaseBillingInterval(item, billing_interval);
    const amount = parseFloat(getPurchaseAmount(item, billingInterval));

    const order = await savePaidOrder({
      uid,
      item,
      amount,
      gateway: "razorpay",
      meta: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        ...(billingInterval ? { billing_interval: billingInterval } : {}),
      },
    });

    const result = await fulfillPurchase(item, uid, {
      gateway: "razorpay",
      amount,
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
    const billingInterval = getPurchaseBillingInterval(
      item,
      req.body.billing_interval,
    );
    const amount = getPurchaseAmount(item, billingInterval);

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

    const paystackRes = await fetchWithTimeout(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: toSmallestUnit(amount, rate, code), // ← converted
          currency: code.toUpperCase(), // ← dynamic
          reference: reference,
          metadata: {
            ...getPurchaseMetadata(item, uid),
            ...(billingInterval ? { billing_interval: billingInterval } : {}),
            product_title: item.title,
          },
          callback_url: `${appUrl}/checkout/success?gateway=paystack`,
        }),
      },
      15000,
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

// ── POST /api/payment/paystack/verify-order ───────────────────────────────────
router.post("/paystack/verify-order", userValidator, async (req, res) => {
  try {
    const { reference } = req.body;
    const uid = req.decode.uid;

    const { secretKey } = await getPaystackKeys();

    // verify with Paystack
    const verifyRes = await fetchWithTimeout(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
      15000,
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
        ...(txData.metadata?.billing_interval
          ? { billing_interval: txData.metadata.billing_interval }
          : {}),
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

// ── helper: get PayU keys ─────────────────────────────────────────────────────
async function getPayUConfig() {
  const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
  if (!data.length) throw new Error("No settings found");
  const { payu_key, payu_salt, payu_mode, payu_active } = data[0];
  if (!payu_active) throw new Error("PayU is not enabled");
  if (!payu_key) throw new Error("PayU merchant key not configured");
  if (!payu_salt) throw new Error("PayU salt not configured");
  return {
    key: payu_key,
    salt: payu_salt,
    mode: payu_mode === "live" ? "live" : "test",
    paymentUrl:
      payu_mode === "live"
        ? "https://secure.payu.in/_payment"
        : "https://test.payu.in/_payment",
  };
}

function getPayURequestHash({ key, salt, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5 }) {
  const hashString = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 || "",
    udf2 || "",
    udf3 || "",
    udf4 || "",
    udf5 || "",
    "",
    "",
    "",
    "",
    "",
    salt,
  ].join("|");
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

function getPayUResponseHash(data, salt) {
  const base = [
    salt,
    data.status || "",
    "",
    "",
    "",
    "",
    "",
    data.udf5 || "",
    data.udf4 || "",
    data.udf3 || "",
    data.udf2 || "",
    data.udf1 || "",
    data.email || "",
    data.firstname || "",
    data.productinfo || "",
    data.amount || "",
    data.txnid || "",
    data.key || "",
  ].join("|");
  const hashString = data.additionalCharges
    ? `${data.additionalCharges}|${base}`
    : base;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

function decodePayUMetadata(value) {
  try {
    if (!value) return {};
    return JSON.parse(Buffer.from(String(value), "base64").toString("utf8"));
  } catch {
    return {};
  }
}

// ── POST /api/payment/payu/create-order ───────────────────────────────────────
router.post("/payu/create-order", userValidator, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const item = await getPurchaseItem(getPurchaseInput(req.body));
    const billingInterval = getPurchaseBillingInterval(
      item,
      req.body.billing_interval,
    );
    const amount = getPurchaseAmount(item, billingInterval);

    const users = await query(`SELECT * FROM user WHERE uid = ? LIMIT 1`, [
      uid,
    ]);
    if (!users.length)
      return res.json({ success: false, msg: "User not found" });
    const user = users[0];
    if (!user.email)
      return res.json({ success: false, msg: "User email is required" });

    const payu = await getPayUConfig();
    const appUrl = getConfiguredAppUrl();
    const txnid = createPaymentReference("payu");
    const payuExchangeRate = getPayUUsdToInrRate();
    const payuAmount = getPayUInrAmount(amount).toFixed(2);
    if (!Number.isFinite(parseFloat(payuAmount)) || parseFloat(payuAmount) <= 0) {
      return res.json({ success: false, msg: "Invalid PayU amount" });
    }
    const productinfo = sanitizePayUField(item.title, "Purchase");
    const firstname = sanitizePayUField(
      user.name || user.email.split("@")[0],
      "Customer",
    );
    const productId = String(item.packageId || item.planId);
    const metadata = {
      ...getPurchaseMetadata(item, uid),
      ...(billingInterval ? { billing_interval: billingInterval } : {}),
      usd_amount: amount,
      payu_amount: payuAmount,
      payu_currency: "INR",
      payu_usd_to_inr_rate: payuExchangeRate,
    };

    const fields = {
      key: payu.key,
      txnid,
      amount: payuAmount,
      currency: "INR",
      productinfo,
      firstname,
      email: user.email,
      phone: getPayUPhone(user),
      surl: `${appUrl}/api/payment/payu/success`,
      furl: `${appUrl}/api/payment/payu/failure`,
      service_provider: "payu_paisa",
      udf1: String(uid),
      udf2: item.productType,
      udf3: productId,
      udf4: billingInterval || "",
      udf5: Buffer.from(JSON.stringify(metadata)).toString("base64"),
    };
    fields.hash = getPayURequestHash({ ...fields, salt: payu.salt });

    res.json({
      success: true,
      url: payu.paymentUrl,
      fields,
      txnid,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: err.message || "PayU order creation failed",
    });
  }
});

async function handlePayUCallback(req, res, failed = false) {
  try {
    const payu = await getPayUConfig();
    const body = { ...(req.query || {}), ...(req.body || {}) };
    const appUrl = getConfiguredAppUrl();
    const txnid = body.txnid;
    const status = String(body.status || "").toLowerCase();
    const productType = body.udf2 || "plan";
    const productId = body.udf3;
    const billingInterval = body.udf4 || null;
    const uid = body.udf1;

    if (!txnid || !body.hash) {
      console.log("PayU callback missing data:", {
        method: req.method,
        contentType: req.headers["content-type"],
        bodyKeys: Object.keys(req.body || {}),
        queryKeys: Object.keys(req.query || {}),
      });
      return res.redirect(
        `${appUrl}/checkout/success?gateway=payu&verified=0&error=missing_payment_data`,
      );
    }

    const expectedHash = getPayUResponseHash(body, payu.salt);
    if (expectedHash !== body.hash) {
      return res.redirect(
        `${appUrl}/checkout/success?gateway=payu&verified=0&error=invalid_hash`,
      );
    }

    if (failed || status !== "success") {
      return res.redirect(
        `${appUrl}/checkout/success?gateway=payu&verified=0&error=payment_failed`,
      );
    }

    const item = await getPurchaseItem({ productType, productId });
    const normalizedBillingInterval = getPurchaseBillingInterval(
      item,
      billingInterval,
    );
    const requestMetadata = decodePayUMetadata(body.udf5);
    const orderAmountUsd = parseFloat(
      requestMetadata.usd_amount || getPurchaseAmount(item, normalizedBillingInterval),
    );
    const paidAmount = parseFloat(body.amount || 0);

    const existing = await query(
      `SELECT id FROM orders WHERE gateway = 'payu' AND JSON_EXTRACT(meta, '$.txnid') = ? LIMIT 1`,
      [txnid],
    );
    if (!existing.length) {
      const order = await savePaidOrder({
        uid,
        item,
        amount: orderAmountUsd,
        gateway: "payu",
        meta: {
          txnid,
          mihpayid: body.mihpayid || null,
          mode: body.mode || null,
          status: body.status || null,
          paid_amount: paidAmount,
          paid_currency: "INR",
          usd_amount: orderAmountUsd,
          payu_usd_to_inr_rate: requestMetadata.payu_usd_to_inr_rate || null,
          ...(normalizedBillingInterval
            ? { billing_interval: normalizedBillingInterval }
            : {}),
        },
      });

      const result = await fulfillPurchase(item, uid, {
        gateway: "payu",
        amount: orderAmountUsd,
        orderId: order.insertId,
      });
      if (!result.success) {
        return res.redirect(
          `${appUrl}/checkout/success?gateway=payu&verified=0&error=fulfillment_failed`,
        );
      }
    }

    return res.redirect(
      `${appUrl}/checkout/success?gateway=payu&verified=1&product_type=${item.productType}&txnid=${encodeURIComponent(txnid)}`,
    );
  } catch (err) {
    console.log(err);
    const appUrl = getConfiguredAppUrl();
    return res.redirect(
      `${appUrl}/checkout/success?gateway=payu&verified=0&error=verification_failed`,
    );
  }
}

router.post("/payu/success", payuCallbackParser, (req, res) =>
  handlePayUCallback(req, res),
);
router.post("/payu/failure", payuCallbackParser, (req, res) =>
  handlePayUCallback(req, res, true),
);
router.get("/payu/success", (req, res) => handlePayUCallback(req, res));
router.get("/payu/failure", (req, res) =>
  handlePayUCallback(req, res, true),
);

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
    const billingInterval = getPurchaseBillingInterval(
      item,
      req.body.billing_interval,
    );
    const amount = getPurchaseAmount(item, billingInterval);

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

    const localAmount = toLocalAmount(amount, rate);

    const response = await preference.create({
      body: {
        items: [
          {
            id: String(item.planId || item.packageId),
            title: item.title,
            description: billingInterval
              ? `${item.credits} credits · ${billingInterval}`
              : item.description,
            quantity: 1,
            unit_price: localAmount, // ← converted
            currency_id: code.toUpperCase(), // ← dynamic
          },
        ],
        payer: { email: user.email },
        metadata: {
          ...getPurchaseMetadata(item, uid),
          ...(billingInterval ? { billing_interval: billingInterval } : {}),
        },
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
        ...(paymentData.metadata?.billing_interval
          ? { billing_interval: paymentData.metadata.billing_interval }
          : {}),
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

const express = require("express");
const router = express.Router();
const { query } = require("../database/connection.js");
const adminValidator = require("../middlewares/admin.js");
const userValidator = require("../middlewares/user.js");
const { updateUserPlan, addUserCredits, getEnv } = require("../utils/common.js");
const paypal = require("@paypal/checkout-server-sdk");
const Razorpay = require("razorpay");
const crypto = require("crypto");

function detectCountry(req = null) {
  const rawCountry =
    req?.body?.country ||
    req?.query?.country ||
    req?.headers?.["x-country-code"] ||
    req?.headers?.["cf-ipcountry"] ||
    req?.headers?.["x-vercel-ip-country"] ||
    "US";

  return String(rawCountry).trim().toUpperCase();
}

function getUsdToInrRateFallback() {
  const configuredRate = parseFloat(process.env.USD_TO_INR_RATE || "");
  return Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 95;
}

async function getUsdToInrRate() {
  try {
    const [row] = await query(
      `SELECT currency_exchange_rate FROM web_public LIMIT 1`,
      [],
    );
    const rate = parseFloat(row?.currency_exchange_rate);
    if (Number.isFinite(rate) && rate > 1) return rate;
  } catch (_) {
    // fall through to env/default
  }
  return getUsdToInrRateFallback();
}

async function getCurrency(req = null) {
  const country = detectCountry(req);
  if (country === "IN" || country === "INDIA") {
    return {
      symbol: "₹",
      code: "INR",
      rate: await getUsdToInrRate(),
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

async function getRazorpayCurrency() {
  return {
    symbol: "₹",
    code: "INR",
    rate: await getUsdToInrRate(),
    base: "USD",
    country: "IN",
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

// ── GET /api/payment/get ─────────────────────────────────────────────────────
router.get("/get", adminValidator, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM web_private LIMIT 1`, []);
    if (data.length < 1)
      return res.json({ success: false, msg: "No settings found" });

    const {
      pay_paypal_id,
      pay_paypal_key,
      paypal_mode,
      paypal_active,
      rz_id,
      rz_key,
      rz_active,
    } = data[0];

    res.json({
      success: true,
      data: {
        pay_paypal_id,
        pay_paypal_key,
        paypal_mode: paypal_mode === "sandbox" ? "sandbox" : "live",
        paypal_active,
        rz_id,
        rz_key,
        rz_active,
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
      pay_paypal_id,
      pay_paypal_key,
      paypal_mode,
      paypal_active,
      rz_id,
      rz_key,
      rz_active,
    } = req.body;

    await query(
      `UPDATE web_private SET
        pay_paypal_id = ?, pay_paypal_key = ?, paypal_mode = ?, paypal_active = ?,
        rz_id = ?, rz_key = ?, rz_active = ?`,
      [
        pay_paypal_id || null,
        pay_paypal_key || null,
        paypal_mode === "sandbox" ? "sandbox" : "live",
        paypal_active || 0,
        rz_id || null,
        rz_key || null,
        rz_active || 0,
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
        paypal: {
          active: !!d.paypal_active,
          clientId: d.pay_paypal_id,
          mode: d.paypal_mode === "sandbox" ? "sandbox" : "live",
        },
        razorpay: { active: !!d.rz_active, keyId: d.rz_id },
      },
    });
  } catch (err) {
    res.json({ err, success: false, message: "Something went wrong" });
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
    const { code, rate } = await getRazorpayCurrency();

    const order = await instance.orders.create({
      amount: toSmallestUnit(amount, rate, code),
      currency: "INR",
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
      isTestMode: String(rz_id || "").startsWith("rzp_test_"),
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
    const { rate } = await getRazorpayCurrency();
    const amount = toLocalAmount(getPurchaseAmount(item, billingInterval), rate);

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

module.exports = router;

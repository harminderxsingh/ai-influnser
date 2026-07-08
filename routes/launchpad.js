const router = require("express").Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const randomstring = require("randomstring");
const { query } = require("../database/connection");
const adminValidator = require("../middlewares/admin");
const { updateUserPlan, sendEmail, getEnv } = require("../utils/common");

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanSlug(value) {
  return String(value || "launchpad")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "launchpad";
}

function cleanPagePath(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((part) => cleanSlug(part))
    .filter(Boolean)
    .join("/");
}

async function generateReferralCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = randomstring
      .generate({ length: 8, charset: "alphanumeric", capitalization: "uppercase" })
      .toUpperCase();
    const existing = await query(`SELECT uid FROM user WHERE referral_code = ?`, [
      code,
    ]);
    if (!existing.length) return code;
  }
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

async function getSettings() {
  const [settings] = await query(
    `SELECT launchpad_active, launchpad_page_slug, launchpad_embed_html, launchpad_webhook_secret
     FROM web_private LIMIT 1`,
    [],
  );
  return {
    active: Number(settings?.launchpad_active || 0) === 1,
    page_slug: cleanSlug(settings?.launchpad_page_slug || "launchpad"),
    embed_html: settings?.launchpad_embed_html || "",
    webhook_secret: settings?.launchpad_webhook_secret || "",
  };
}

function getWebhookUrl(req) {
  const env = getEnv();
  const baseUrl = (
    process.env.APP_URL ||
    env.backendUrl ||
    env.frontendUrl ||
    `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
  return `${baseUrl}/api/launchpad/webhook`;
}

function getPublicUrl(req, slug) {
  const env = getEnv();
  const baseUrl = (
    env.frontendUrl ||
    process.env.APP_URL ||
    `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
  const clean = cleanSlug(slug);
  return clean === "launchpad" ? `${baseUrl}/launchpad` : `${baseUrl}/launchpad/${clean}`;
}

function getPagePublicUrl(req, pagePath) {
  const env = getEnv();
  const baseUrl = (
    env.frontendUrl ||
    process.env.APP_URL ||
    `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
  return `${baseUrl}/${cleanPagePath(pagePath)}`;
}

async function getLaunchpadPages(req) {
  const pages = await query(
    `SELECT lp.*, p.title AS plan_title
     FROM launchpad_pages lp
     LEFT JOIN plan p ON p.id = lp.plan_id
     ORDER BY lp.page_path ASC`,
    [],
  );
  return pages.map((page) => ({
    ...page,
    public_url: getPagePublicUrl(req, page.page_path),
  }));
}

async function findPlanByProductName(productName) {
  const normalizedProduct = normalizeText(productName);
  if (!normalizedProduct) return null;

  const [mappedPage] = await query(
    `SELECT lp.plan_id, p.*
     FROM launchpad_pages lp
     LEFT JOIN plan p ON p.id = lp.plan_id
     WHERE LOWER(lp.product_name) = LOWER(?) AND lp.plan_id IS NOT NULL
     LIMIT 1`,
    [productName],
  );
  if (mappedPage?.id) return mappedPage;

  const plans = await query(`SELECT * FROM plan`, []);
  const exact = plans.find((plan) => normalizeText(plan.title) === normalizedProduct);
  if (exact) return exact;

  const looseMatches = plans.filter((plan) => {
    const normalizedPlan = normalizeText(plan.title);
    return (
      normalizedPlan &&
      (normalizedProduct.includes(normalizedPlan) ||
        normalizedPlan.includes(normalizedProduct))
    );
  });

  return looseMatches.length === 1 ? looseMatches[0] : null;
}

async function getOrCreateUser({ email, name }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const [existing] = await query(`SELECT * FROM user WHERE email = ? LIMIT 1`, [
    cleanEmail,
  ]);
  if (existing) {
    if (!existing.name && name) {
      await query(`UPDATE user SET name = ? WHERE uid = ?`, [name, existing.uid]);
      existing.name = name;
    }
    return { user: existing, created: false, password: null };
  }

  const uid = randomstring.generate();
  const password = crypto.randomBytes(9).toString("base64url");
  const hash = await bcrypt.hash(password, 10);
  const tokenVersion = crypto.randomUUID();
  const referralCode = await generateReferralCode();

  await query(
    `INSERT INTO user (name, uid, email, password, token_version, referral_code)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name || cleanEmail, uid, cleanEmail, hash, tokenVersion, referralCode],
  );

  return {
    user: { uid, email: cleanEmail, name: name || cleanEmail },
    created: true,
    password,
  };
}

async function maybeSendLaunchpadWelcome({ email, name, password, planTitle }) {
  if (!password) return;
  const env = getEnv();
  const loginUrl = `${(env.frontendUrl || process.env.APP_URL || "").replace(/\/$/, "")}/user/login`;
  await sendEmail({
    to: email,
    subject: "Your account has been created",
    html: `
      <p>Hello ${name || email},</p>
      <p>Your ${planTitle} plan has been activated.</p>
      <p><strong>Login:</strong> ${email}<br/>
      <strong>Password:</strong> ${password}</p>
      <p><a href="${loginUrl}">Login here</a></p>
    `,
  });
}

router.get("/settings", adminValidator, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      data: {
        active: settings.active,
        page_slug: settings.page_slug,
        embed_html: settings.embed_html,
        webhook_secret: settings.webhook_secret,
        webhook_url: getWebhookUrl(req),
        public_url: getPublicUrl(req, settings.page_slug),
        pages: await getLaunchpadPages(req),
      },
    });
  } catch (err) {
    res.json({ success: false, msg: err.message || "Unable to load settings" });
  }
});

router.post("/settings", adminValidator, async (req, res) => {
  try {
    const active = req.body.active ? 1 : 0;
    const pageSlug = cleanSlug(req.body.page_slug || "launchpad");
    const embedHtml = String(req.body.embed_html || "");
    const webhookSecret = String(req.body.webhook_secret || "").trim();

    await query(
      `UPDATE web_private
       SET launchpad_active = ?, launchpad_page_slug = ?, launchpad_embed_html = ?, launchpad_webhook_secret = ?`,
      [active, pageSlug, embedHtml, webhookSecret || null],
    );

    res.json({
      success: true,
      msg: "Launchpad settings saved",
      data: {
        active: !!active,
        page_slug: pageSlug,
        embed_html: embedHtml,
        webhook_secret: webhookSecret,
        webhook_url: getWebhookUrl(req),
        public_url: getPublicUrl(req, pageSlug),
        pages: await getLaunchpadPages(req),
      },
    });
  } catch (err) {
    res.json({ success: false, msg: err.message || "Unable to save settings" });
  }
});

router.post("/pages", adminValidator, async (req, res) => {
  try {
    const pagePath = cleanPagePath(req.body.page_path);
    if (!pagePath) {
      return res.json({ success: false, msg: "Page path is required" });
    }

    const id = req.body.id || null;
    const productName = String(req.body.product_name || "").trim();
    const planId = req.body.plan_id || null;
    const embedHtml = String(req.body.embed_html || "");
    const active = req.body.active ? 1 : 0;

    if (id) {
      await query(
        `UPDATE launchpad_pages
         SET page_path = ?, product_name = ?, plan_id = ?, embed_html = ?, active = ?
         WHERE id = ?`,
        [pagePath, productName || null, planId || null, embedHtml, active, id],
      );
    } else {
      await query(
        `INSERT INTO launchpad_pages (page_path, product_name, plan_id, embed_html, active)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), plan_id = VALUES(plan_id), embed_html = VALUES(embed_html), active = VALUES(active)`,
        [pagePath, productName || null, planId || null, embedHtml, active],
      );
    }

    res.json({
      success: true,
      msg: "Launchpad page saved",
      data: await getLaunchpadPages(req),
    });
  } catch (err) {
    res.json({ success: false, msg: err.message || "Unable to save page" });
  }
});

router.post("/pages/delete", adminValidator, async (req, res) => {
  try {
    if (!req.body.id) {
      return res.json({ success: false, msg: "Page ID is required" });
    }
    await query(`DELETE FROM launchpad_pages WHERE id = ?`, [req.body.id]);
    res.json({
      success: true,
      msg: "Launchpad page deleted",
      data: await getLaunchpadPages(req),
    });
  } catch (err) {
    res.json({ success: false, msg: err.message || "Unable to delete page" });
  }
});

router.get("/public-settings", async (req, res) => {
  try {
    const settings = await getSettings();
    const requestedPath = cleanPagePath(req.query.path || "");
    if (requestedPath) {
      const [page] = await query(
        `SELECT * FROM launchpad_pages WHERE page_path = ? AND active = 1 LIMIT 1`,
        [requestedPath],
      );
      return res.json({
        success: true,
        data: {
          active: settings.active && !!page,
          page_slug: requestedPath,
          embed_html: page?.embed_html || "",
          product_name: page?.product_name || "",
        },
      });
    }

    res.json({
      success: true,
      data: {
        active: settings.active,
        page_slug: settings.page_slug,
        embed_html: settings.embed_html,
      },
    });
  } catch (err) {
    res.json({ success: false, msg: err.message || "Unable to load page" });
  }
});

router.post("/webhook", async (req, res) => {
  const payload = req.body || {};
  const transactionId = String(payload.transaction_id || payload.id || "").trim();
  const email = String(
    payload.checkout_email || payload.user?.email || payload.email || "",
  )
    .trim()
    .toLowerCase();
  const name = String(payload.checkout_name || payload.user?.name || email || "").trim();
  const productName = String(payload.product?.name || payload.product_name || "").trim();

  try {
    const settings = await getSettings();
    const incomingSecret =
      req.get("x-launchpad-secret") || req.query.secret || payload.webhook_secret || "";
    if (settings.webhook_secret && incomingSecret !== settings.webhook_secret) {
      return res.status(401).json({ success: false, msg: "Invalid webhook secret" });
    }

    if (String(payload.status || "").toLowerCase() !== "success") {
      return res.json({ success: true, skipped: true, msg: "Non-success payment ignored" });
    }
    if (payload.action && String(payload.action).toUpperCase() !== "SALE") {
      return res.json({ success: true, skipped: true, msg: "Non-sale action ignored" });
    }
    if (!transactionId || !email || !productName) {
      return res.status(400).json({
        success: false,
        msg: "transaction_id, checkout_email, and product.name are required",
      });
    }

    const [existingEvent] = await query(
      `SELECT id, status FROM launchpad_webhook_events WHERE transaction_id = ? LIMIT 1`,
      [transactionId],
    );
    if (existingEvent?.status === "processed") {
      return res.json({ success: true, duplicate: true, msg: "Already processed" });
    }

    const plan = await findPlanByProductName(productName);
    if (!plan) {
      await query(
        `INSERT INTO launchpad_webhook_events (transaction_id, email, product_name, status, payload, error)
         VALUES (?, ?, ?, 'failed', ?, ?)
         ON DUPLICATE KEY UPDATE status = 'failed', payload = VALUES(payload), error = VALUES(error)`,
        [
          transactionId,
          email,
          productName,
          JSON.stringify(payload),
          `No matching plan found for product: ${productName}`,
        ],
      );
      return res.status(404).json({
        success: false,
        msg: `No matching plan found for product: ${productName}`,
      });
    }

    const { user, created, password } = await getOrCreateUser({ email, name });
    const planResult = await updateUserPlan({ planId: plan.id, uid: user.uid });
    if (!planResult.success) {
      throw new Error(planResult.msg || "Plan activation failed");
    }

    await query(
      `INSERT INTO orders (uid, plan_id, package_id, product_type, amount, gateway, meta, status, created_at)
       VALUES (?, ?, NULL, 'plan', ?, 'launchpad', ?, 'paid', NOW())`,
      [
        user.uid,
        plan.id,
        parseFloat(payload.total_amount || 0) || parseFloat(plan.price || 0) || 0,
        JSON.stringify({ transaction_id: transactionId, payload }),
      ],
    );

    await query(
      `INSERT INTO launchpad_webhook_events (transaction_id, email, product_name, plan_id, uid, status, payload)
       VALUES (?, ?, ?, ?, ?, 'processed', ?)
       ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), uid = VALUES(uid), status = 'processed', payload = VALUES(payload), error = NULL`,
      [transactionId, email, productName, plan.id, user.uid, JSON.stringify(payload)],
    );

    await maybeSendLaunchpadWelcome({
      email,
      name,
      password,
      planTitle: plan.title,
    });

    res.json({
      success: true,
      msg: "Launchpad sale processed",
      created_user: created,
      uid: user.uid,
      plan_id: plan.id,
      plan_title: plan.title,
    });
  } catch (err) {
    if (transactionId) {
      await query(
        `INSERT INTO launchpad_webhook_events (transaction_id, email, product_name, status, payload, error)
         VALUES (?, ?, ?, 'failed', ?, ?)
         ON DUPLICATE KEY UPDATE status = 'failed', payload = VALUES(payload), error = VALUES(error)`,
        [transactionId, email, productName, JSON.stringify(payload), err.message],
      );
    }
    res.status(500).json({ success: false, msg: err.message || "Webhook failed" });
  }
});

module.exports = router;

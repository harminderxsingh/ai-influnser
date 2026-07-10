const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const bcrypt = require("bcrypt");
const { getEnv, getResetEmailHtml } = require("../utils/common");
const { validateEmail, sendEmail, logUsage } = require("../utils/common");
const randomstring = require("randomstring");
const { sign } = require("jsonwebtoken");
const validateUser = require("../middlewares/user");
const crypto = require("crypto");

const DEFAULT_EMAIL_VERIFICATION_TEMPLATE = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
  <div style="background:#4f46e5;padding:28px 32px;">
    <h2 style="color:#fff;margin:0;font-size:22px;">Verify your email</h2>
  </div>
  <div style="padding:28px 32px;background:#ffffff;">
    <p style="color:#374151;font-size:15px;margin:0 0 16px;">Please verify your email address before accessing your account.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;width:40%;">Email</td>
        <td style="padding:8px 12px;color:#111827;">{{user_email}}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Date</td>
        <td style="padding:8px 12px;color:#111827;">{{date}}</td>
      </tr>
    </table>
    <a href="{{verify_link}}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Verify Email</a>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e0e0e0;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">If you did not create this account, you can ignore this email.</p>
  </div>
</div>`;

function renderTemplate(html, variables = {}) {
  return String(html || "").replace(/{{\s*([^}]+)\s*}}/g, (match, key) =>
    variables[key] !== undefined ? variables[key] : match,
  );
}

function getFrontendBaseUrl(req) {
  const env = getEnv();
  return String(env?.frontendUrl || req.get("origin") || "").replace(/\/$/, "");
}

async function sendVerificationEmail({ req, email, token }) {
  const verifyLink = `${getFrontendBaseUrl(req)}/verify-email?token=${token}`;
  const [templateRow] = await query(
    `SELECT email_template_email_verification FROM web_private LIMIT 1`,
    [],
  );
  const html = renderTemplate(
    templateRow?.email_template_email_verification ||
      DEFAULT_EMAIL_VERIFICATION_TEMPLATE,
    {
      user_email: email,
      verify_link: verifyLink,
      date: new Date().toLocaleDateString(),
    },
  );

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    html,
  });
}

async function createAndSendVerificationEmail(req, user) {
  const token = crypto.randomBytes(32).toString("hex");
  await query(
    `UPDATE user
     SET email_verify_token = ?, email_verify_sent_at = NOW()
     WHERE uid = ?`,
    [token, user.uid],
  );
  return sendVerificationEmail({ req, email: user.email, token });
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

async function getReferralSettings() {
  const [settings] = await query(
    `SELECT referral_enabled, referral_signup_credits, referral_referrer_credits FROM web_public LIMIT 1`,
    [],
  );
  return {
    enabled: Number(settings?.referral_enabled ?? 1) === 1,
    signupCredits: parseInt(settings?.referral_signup_credits || 0, 10),
    referrerCredits: parseInt(settings?.referral_referrer_credits || 0, 10),
  };
}

async function applyReferralCredits({ uid, referralCode }) {
  const settings = await getReferralSettings();
  const cleanCode = String(referralCode || "").trim().toUpperCase();
  let referrer = null;

  if (settings.enabled && cleanCode) {
    const [found] = await query(
      `SELECT uid, referral_code FROM user WHERE referral_code = ? AND uid != ? LIMIT 1`,
      [cleanCode, uid],
    );
    referrer = found || null;
  }

  if (settings.signupCredits > 0) {
    await query(
      `UPDATE user SET credits = CAST(COALESCE(credits, '0') AS SIGNED) + ? WHERE uid = ?`,
      [settings.signupCredits, uid],
    );
    await logUsage({
      uid,
      task: "referral_signup_bonus",
      credits: settings.signupCredits,
      status: "success",
      des: JSON.stringify({
        type: "referral_signup_bonus",
        message: `${settings.signupCredits} signup credits added`,
        referral_code: cleanCode || null,
      }),
    });
  }

  if (referrer && settings.referrerCredits > 0) {
    await query(
      `UPDATE user SET credits = CAST(COALESCE(credits, '0') AS SIGNED) + ? WHERE uid = ?`,
      [settings.referrerCredits, referrer.uid],
    );
    await query(`UPDATE user SET referred_by = ? WHERE uid = ?`, [
      referrer.uid,
      uid,
    ]);
    await logUsage({
      uid: referrer.uid,
      task: "referral_reward",
      credits: settings.referrerCredits,
      status: "success",
      des: JSON.stringify({
        type: "referral_reward",
        message: `${settings.referrerCredits} referral credits added`,
        referred_uid: uid,
        referral_code: referrer.referral_code,
      }),
    });
  }

  if (settings.signupCredits > 0 || referrer) {
    await query(
      `INSERT INTO referral_events (referrer_uid, referred_uid, referral_code, signup_credits, referrer_credits, status, meta)
       VALUES (?, ?, ?, ?, ?, 'success', ?)`,
      [
        referrer?.uid || null,
        uid,
        cleanCode || null,
        settings.signupCredits || 0,
        referrer ? settings.referrerCredits || 0 : 0,
        JSON.stringify({ referral_applied: !!referrer }),
      ],
    );
  }

  return { referrer };
}

// ─────────────────────────────────────────────
// Login / Signup
// ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email: emailBefore, password, referral_code } = req.body;
    const env = getEnv();

    if (!emailBefore || !password) {
      return res.json({
        msg: "Email and password is required",
        success: false,
      });
    }

    const email = emailBefore?.toLowerCase();

    if (!validateEmail(email)) {
      return res.json({ msg: "Please enter a valid email", success: false });
    }

    const [user] = await query(`SELECT * FROM user WHERE email = ?`, [email]);

    if (!user) {
      // ── New User Signup ──
      const haspass = await bcrypt.hash(password, 10);
      const uid = randomstring.generate();
      const token_version = crypto.randomUUID();
      const referralCode = await generateReferralCode();

      const verifyToken = crypto.randomBytes(32).toString("hex");
      await query(
        `INSERT INTO user
         (uid, email, password, token_version, referral_code, email_verified, email_verify_token, email_verify_sent_at)
         VALUES (?,?,?,?,?,0,?,NOW())`,
        [uid, email, haspass, token_version, referralCode, verifyToken],
      );
      await applyReferralCredits({ uid, referralCode: referral_code });
      const sendResult = await sendVerificationEmail({
        req,
        email,
        token: verifyToken,
      });

      return res.json({
        success: true,
        emailVerificationRequired: true,
        email,
        msg: sendResult?.success
          ? "Please verify your email. We sent a verification link to your inbox."
          : `Account created, but verification email could not be sent: ${sendResult?.msg}`,
      });
    } else {
      // ── Existing User Login ──
      const compare = await bcrypt.compare(password, user?.password);
      if (!compare) {
        return res.json({ msg: "Invalid credentials" });
      }

      if (Number(user.email_verified ?? 1) !== 1) {
        const sendResult = await createAndSendVerificationEmail(req, user);
        return res.json({
          success: false,
          emailVerificationRequired: true,
          email: user.email,
          msg: sendResult?.success
            ? "Please verify your email. We sent a new verification link."
            : `Please verify your email. Could not send email: ${sendResult?.msg}`,
        });
      }

      const token_version = crypto.randomUUID();
      await query(`UPDATE user SET token_version = ? WHERE uid = ?`, [
        token_version,
        user.uid,
      ]);

      const token = sign(
        { uid: user.uid, role: "user", email: user.email, token_version },
        env?.jwt,
        {},
      );
      return res.json({ success: true, token });
    }
  } catch (err) {
    console.log(err);
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

router.post("/verify_email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.json({ success: false, msg: "Verification token is required" });
    }

    const [user] = await query(
      `SELECT uid, email FROM user WHERE email_verify_token = ? LIMIT 1`,
      [token],
    );

    if (!user) {
      return res.json({
        success: false,
        msg: "Invalid or expired verification link",
      });
    }

    await query(
      `UPDATE user
       SET email_verified = 1,
           email_verify_token = NULL,
           email_verify_sent_at = NULL
       WHERE uid = ?`,
      [user.uid],
    );

    const [templateRow] = await query(
      `SELECT email_template_welcome FROM web_private LIMIT 1`,
      [],
    );
    if (templateRow?.email_template_welcome) {
      const html = renderTemplate(templateRow.email_template_welcome, {
        user_email: user.email,
        login_url: `${getFrontendBaseUrl(req)}/user/login`,
        date: new Date().toLocaleDateString(),
      });
      await sendEmail({
        to: user.email,
        subject: "Welcome! Your account has been verified",
        html,
      });
    }

    return res.json({
      success: true,
      msg: "Email verified successfully. You can login now.",
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: "Something went wrong", err });
  }
});

router.post("/resend_verification_email", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !validateEmail(email)) {
      return res.json({ success: false, msg: "Please enter a valid email" });
    }

    const [user] = await query(`SELECT * FROM user WHERE email = ? LIMIT 1`, [
      email,
    ]);

    if (!user) {
      return res.json({
        success: true,
        msg: "If this email is registered and unverified, a verification link will be sent.",
      });
    }

    if (Number(user.email_verified ?? 1) === 1) {
      return res.json({
        success: true,
        alreadyVerified: true,
        msg: "Email is already verified. Please login.",
      });
    }

    const sendResult = await createAndSendVerificationEmail(req, user);
    if (!sendResult?.success) {
      return res.json({ success: false, msg: sendResult?.msg });
    }

    return res.json({
      success: true,
      msg: "Verification link sent. Please check your inbox.",
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: "Something went wrong", err });
  }
});

// get videos with pagination
router.get("/get_t_video", validateUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    // Build search query
    let searchQuery = "";
    let params = [];

    if (search) {
      searchQuery = `WHERE tv.des LIKE ? OR tc.name LIKE ?`;
      params = [`%${search}%`, `%${search}%`];
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM templates_video tv
      LEFT JOIN templates_category tc ON tv.cate_id = tc.cate_id
      ${searchQuery}
    `;

    let totalResult;
    try {
      totalResult = await query(countQuery, params);
    } catch (joinErr) {
      // If cate_id doesn't exist in templates_category, try with id
      const countQueryAlt = `
        SELECT COUNT(*) as total 
        FROM templates_video tv
        LEFT JOIN templates_category tc ON tv.cate_id = tc.id
        ${searchQuery}
      `;
      totalResult = await query(countQueryAlt, params);
    }

    const [{ total }] = totalResult;

    // Get videos with category info
    const dataQuery = `
      SELECT 
        tv.*,
        tc.name as category_name,
        tc.color as category_color
      FROM templates_video tv
      LEFT JOIN templates_category tc ON tv.cate_id = tc.id
      ${searchQuery}
      ORDER BY tv.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const data = await query(dataQuery, [...params, limit, offset]);

    res.json({
      data,
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: "Something went wrong",
      err: err.message,
    });
  }
});

router.get("/get_me", validateUser, async (req, res) => {
  try {
    let [data] = await query(`SELECT * FROM user WHERE uid = ?`, [
      req.decode.uid,
    ]);
    data = {
      ...data,
      email_notification:
        typeof data?.email_notification === "string"
          ? JSON.parse(data.email_notification)
          : data?.email_notification || {},
    };
    res.json({ success: true, data });
  } catch (err) {
    res.json({ msg: "something went wrong", err });
    console.log(err);
  }
});

router.get("/referral_info", validateUser, async (req, res) => {
  try {
    const uid = req.decode.uid;
    let [user] = await query(
      `SELECT uid, referral_code, credits FROM user WHERE uid = ? LIMIT 1`,
      [uid],
    );
    if (!user) return res.json({ success: false, msg: "User not found" });
    if (!user.referral_code) {
      const referralCode = await generateReferralCode();
      await query(`UPDATE user SET referral_code = ? WHERE uid = ?`, [
        referralCode,
        uid,
      ]);
      user.referral_code = referralCode;
    }

    const [settings] = await query(
      `SELECT referral_enabled, referral_signup_credits, referral_referrer_credits FROM web_public LIMIT 1`,
      [],
    );
    const [stats] = await query(
      `SELECT COUNT(*) AS total_referrals, COALESCE(SUM(referrer_credits), 0) AS total_earned
       FROM referral_events WHERE referrer_uid = ?`,
      [uid],
    );
    const referrals = await query(
      `SELECT re.*, u.email AS referred_email, u.createdAt AS referred_at
       FROM referral_events re
       LEFT JOIN user u ON u.uid = re.referred_uid
       WHERE re.referrer_uid = ?
       ORDER BY re.createdAt DESC
       LIMIT 20`,
      [uid],
    );
    const baseUrl = req.get("origin") || process.env.FRONTEND_URL || "https://myavatarlab.com";

    res.json({
      success: true,
      data: {
        referral_code: user.referral_code,
        referral_link: `${String(baseUrl).replace(/\/$/, "")}/user/login?ref=${user.referral_code}`,
        enabled: Number(settings?.referral_enabled ?? 1) === 1,
        signup_credits: Number(settings?.referral_signup_credits || 0),
        referrer_credits: Number(settings?.referral_referrer_credits || 0),
        stats,
        referrals,
      },
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

router.post("/update_email", validateUser, async (req, res) => {
  try {
    const { json } = req.body;

    await query(`UPDATE user SET email_notification = ? WHERE uid = ?`, [
      JSON.stringify(json),
      req.decode.uid,
    ]);

    res.json({ success: true, msg: "Email prefrence updated" });
  } catch (err) {
    res.json({ msg: "something went wrong", err });
    console.log(err);
  }
});

router.get("/get_usage_logs", validateUser, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Total count for "has more" check
    const [{ total }] = await query(
      `SELECT COUNT(*) as total FROM usage_log WHERE uid = ?`,
      [req.decode.uid],
    );

    // Newest first via ORDER BY createdAt DESC
    const data = await query(
      `SELECT * FROM usage_log WHERE uid = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [req.decode.uid, limit, offset],
    );

    res.json({ data, total, success: true });
  } catch (err) {
    res.json({ msg: "something went wrong", err });
    console.log(err);
  }
});

router.post("/update_profile", validateUser, async (req, res) => {
  try {
    const { newPassword, email, name } = req.body;
    if (!name || !email) {
      return res.json({ msg: "Name, Email are required fields" });
    }

    const userFromToken = req.decode.user;
    const emailChanged = userFromToken?.email !== email;

    if (emailChanged) {
      const [checkUser] = await query(`SELECT * FROM user WHERE email = ?`, [
        email,
      ]);
      if (checkUser) {
        return res.json({ msg: "This email is already reserved" });
      }
    }

    if (newPassword) {
      const hashPass = await bcrypt.hash(newPassword, 10);
      const token_version = crypto.randomUUID(); // ← rotate on password change
      const env = getEnv();

      if (emailChanged) {
        const verifyToken = crypto.randomBytes(32).toString("hex");
        await query(
          `UPDATE user
           SET name = ?,
               email = ?,
               password = ?,
               token_version = ?,
               email_verified = 0,
               email_verify_token = ?,
               email_verify_sent_at = NOW()
           WHERE uid = ?`,
          [name, email, hashPass, token_version, verifyToken, req.decode.uid],
        );
        await sendVerificationEmail({ req, email, token: verifyToken });
        return res.json({
          success: true,
          emailVerificationRequired: true,
          email,
          msg: "Profile updated. Please verify your new email before continuing.",
        });
      }

      await query(
        `UPDATE user SET name = ?, email = ?, password = ?, token_version = ? WHERE uid = ?`,
        [name, email, hashPass, token_version, req.decode.uid],
      );

      // ── Return a fresh token so current session stays alive ──
      const newToken = sign(
        { uid: req.decode.uid, role: "user", email, token_version },
        env?.jwt,
        {},
      );
      return res.json({
        success: true,
        msg: "Profile was updated",
        token: newToken,
      });
    } else {
      if (emailChanged) {
        const verifyToken = crypto.randomBytes(32).toString("hex");
        await query(
          `UPDATE user
           SET name = ?,
               email = ?,
               email_verified = 0,
               email_verify_token = ?,
               email_verify_sent_at = NOW()
           WHERE uid = ?`,
          [name, email, verifyToken, req.decode.uid],
        );
        await sendVerificationEmail({ req, email, token: verifyToken });
        return res.json({
          success: true,
          emailVerificationRequired: true,
          email,
          msg: "Profile updated. Please verify your new email before continuing.",
        });
      }

      await query(`UPDATE user SET name = ?, email = ? WHERE uid = ?`, [
        name,
        email,
        req.decode.uid,
      ]);
      return res.json({ success: true, msg: "Profile was updated" });
    }
  } catch (err) {
    res.json({ msg: "something went wrong", err });
    console.log(err);
  }
});

router.get("/get_dashboard", validateUser, async (req, res) => {
  try {
    const uid = req.decode.uid;

    // ── 1. User info ──────────────────────────────────────
    const userRows = await query(
      `SELECT id, uid, name, email, credits, plan, plan_ending, status, createdAt
       FROM user WHERE uid = ? LIMIT 1`,
      [uid],
    );
    if (!userRows.length) {
      return res.json({ success: false, msg: "User not found" });
    }
    const user = userRows[0];

    // ── 2. Influencers ────────────────────────────────────
    const [{ total_influencers }] = await query(
      `SELECT COUNT(*) AS total_influencers FROM influencers WHERE uid = ?`,
      [uid],
    );
    const [{ active_influencers }] = await query(
      `SELECT COUNT(*) AS active_influencers FROM influencers WHERE uid = ? AND status = 'active'`,
      [uid],
    );

    // ── 3. Gallery ────────────────────────────────────────
    const [{ total_gallery }] = await query(
      `SELECT COUNT(*) AS total_gallery FROM gallery WHERE uid = ?`,
      [uid],
    );
    const [{ success_gallery }] = await query(
      `SELECT COUNT(*) AS success_gallery FROM gallery WHERE uid = ? AND status = 'success'`,
      [uid],
    );

    // ── 4. Content videos ─────────────────────────────────
    const [{ total_content }] = await query(
      `SELECT COUNT(*) AS total_content FROM content WHERE uid = ?`,
      [uid],
    );
    const [{ success_content }] = await query(
      `SELECT COUNT(*) AS success_content FROM content WHERE uid = ? AND status = 'success'`,
      [uid],
    );

    // ── 5. Product showcase ───────────────────────────────
    const [{ total_showcase }] = await query(
      `SELECT COUNT(*) AS total_showcase FROM product_content WHERE uid = ?`,
      [uid],
    );
    const [{ success_showcase }] = await query(
      `SELECT COUNT(*) AS success_showcase FROM product_content WHERE uid = ? AND status = 'active'`,
      [uid],
    );

    // ── 6. Recent usage logs ──────────────────────────────
    const usageLogs = await query(
      `SELECT task, credits, status, date, des, createdAt
       FROM usage_log
       WHERE uid = ?
       ORDER BY createdAt DESC
       LIMIT 10`,
      [uid],
    );

    // ── 7. Credits spent per day (last 7 days) ────────────
    const creditChart = await query(
      `SELECT date, SUM(CAST(credits AS UNSIGNED)) AS credits_spent
       FROM usage_log
       WHERE uid = ?
         AND status = 'success'
         AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY date
       ORDER BY date ASC`,
      [uid],
    );

    // ── 8. Task breakdown ─────────────────────────────────
    const taskBreakdown = await query(
      `SELECT task, COUNT(*) AS count, SUM(CAST(credits AS UNSIGNED)) AS total_credits
       FROM usage_log
       WHERE uid = ? AND status = 'success'
       GROUP BY task`,
      [uid],
    );

    // ── 9. Recent influencers ─────────────────────────────
    const recentInfluencers = await query(
      `SELECT id, name, photo_url, status, created_at
       FROM influencers
       WHERE uid = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [uid],
    );

    return res.json({
      success: true,
      data: {
        user,
        stats: {
          influencers: { total: total_influencers, active: active_influencers },
          gallery: { total: total_gallery, success: success_gallery },
          content: { total: total_content, success: success_content },
          showcase: { total: total_showcase, success: success_showcase },
        },
        credit_chart: creditChart,
        task_breakdown: taskBreakdown,
        recent_influencers: recentInfluencers,
        usage_logs: usageLogs,
      },
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// ── Send Recovery Email ────────────────────────────────────────────────────
router.post("/send_recovery_email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, msg: "Please fill the email" });
    }

    const [user] = await query(`SELECT * FROM user WHERE email = ?`, [email]);

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");

      await query(`UPDATE user SET forget_token = ? WHERE email = ?`, [
        token,
        email,
      ]);

      const env = getEnv();
      const resetLink = env?.frontendUrl + "/password-recovery?token=" + token;

      // ── Fetch template from DB ─────────────────────────────
      const [templateRow] = await query(
        `SELECT email_template_pass_recovery FROM web_private LIMIT 1`,
        [],
      );

      let html = templateRow?.email_template_pass_recovery || "";

      // ── Replace variables ──────────────────────────────────
      html = html
        .replace(/\{\{user_email\}\}/g, email)
        .replace(/\{\{reset_link\}\}/g, resetLink)
        .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());

      const sendEm = await sendEmail({
        to: email,
        subject: "Reset your password",
        html,
      });

      if (!sendEm?.success) {
        return res.json({ success: false, msg: sendEm?.msg });
      }
    }

    res.json({
      success: true,
      msg: "If this email is registered, you will receive a reset link shortly.",
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

router.post("/reset_password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.json({
        success: false,
        msg: "Token and password are required",
      });
    }

    const [user] = await query(`SELECT * FROM user WHERE forget_token = ?`, [
      token,
    ]);
    if (!user) {
      return res.json({ success: false, msg: "Invalid or expired reset link" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const token_version = crypto.randomUUID(); // ← invalidates all old sessions

    await query(
      `UPDATE user SET password = ?, forget_token = NULL, token_version = ? WHERE forget_token = ?`,
      [hashed, token_version, token],
    );

    res.json({ success: true, msg: "Password reset successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

module.exports = router;

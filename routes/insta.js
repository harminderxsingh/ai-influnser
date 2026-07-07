const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const { getEnv } = require("../utils/common");
const validateUser = require("../middlewares/user");
const {
  exchangeShortToken,
  exchangeLongToken,
  fetchInstaProfile,
  getInstaCallbackUri,
  subscribeInstaWebhook,
} = require("../utils/insta");
const { checkPlan } = require("../middlewares/common");

const pageStyle = `
  font-family:sans-serif;display:flex;flex-direction:column;
  align-items:center;justify-content:center;min-height:100vh;
  background:linear-gradient(135deg,#f09433,#dc2743,#bc1888);
  color:#fff;margin:0;padding:20px;box-sizing:border-box;text-align:center
`;

// ─── Get Auth URL ─────────────────────────────────────────
router.get("/auth-url", validateUser, checkPlan, async (req, res) => {
  try {
    const [apiKeys] = await query(
      `SELECT insta_app_id, insta_app_secret FROM web_private`,
      [],
    );

    const instaCallbackUri = await getInstaCallbackUri();

    if (!apiKeys?.insta_app_id || !instaCallbackUri) {
      return res.json({
        success: false,
        msg: "Instagram app not configured. Please contact admin.",
      });
    }

    const SCOPES =
      "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish";

    const params = new URLSearchParams({
      client_id: apiKeys.insta_app_id,
      redirect_uri: instaCallbackUri,
      scope: SCOPES,
      response_type: "code",
      state: req.decode.uid,
    });

    const url = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
    return res.json({ success: true, url });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ─── OAuth Callback ──────────────────────────────────────
router.get("/callback", async (req, res) => {
  const { code, error, state: uid } = req.query;

  if (error || !code || !uid) {
    return res.send(`<html><body style="${pageStyle}">
      <h2>❌ Error: ${error || "Missing parameters"}</h2>
      <script>setTimeout(() => window.close(), 3000);</script>
    </body></html>`);
  }

  try {
    const [apiKeys] = await query(
      `SELECT insta_app_id, insta_app_secret FROM web_private`,
      [],
    );

    const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
    const plan = user?.plan ? JSON.parse(user.plan) : null;
    if (!plan) {
      return res.send(`<html><body style="${pageStyle}">
        <h2>❌ Error: No active plan</h2>
        <p>Please subscribe to a plan to connect your Instagram account.</p>
        <script>setTimeout(() => window.close(), 4000);</script>
      </body></html>`);
    }

    const instaCallbackUri = await getInstaCallbackUri();

    if (!apiKeys?.insta_app_id || !apiKeys?.insta_app_secret) {
      throw new Error("Instagram credentials not configured.");
    }

    if (!instaCallbackUri) {
      throw new Error("Instagram callback URL not configured.");
    }

    // Short-lived token
    const tokenData = await exchangeShortToken({
      appId: apiKeys.insta_app_id,
      appSecret: apiKeys.insta_app_secret,
      redirectUri: instaCallbackUri,
      code,
    });

    if (!tokenData.access_token) {
      throw new Error("Token exchange failed: " + JSON.stringify(tokenData));
    }

    // Long-lived token
    const longData = await exchangeLongToken({
      appSecret: apiKeys.insta_app_secret,
      shortToken: tokenData.access_token,
    });

    const finalToken = longData.access_token || tokenData.access_token;

    // Fetch profile
    const profile = await fetchInstaProfile(finalToken);
    if (!profile?.username) {
      throw new Error("Could not fetch Instagram profile.");
    }

    const igBusinessId = String(profile.user_id || profile.id);
    const igGraphId = String(profile.id);

    // ── Delete from ANY uid first (no duplicates across users) ────────────
    await query(`DELETE FROM instagram_accounts WHERE webhook_id = ?`, [
      igBusinessId,
    ]);

    // ── Fresh insert for current uid ──────────────────────────────────────
    await query(
      `INSERT INTO instagram_accounts
        (uid, webhook_id, ig_graph_id, user_id, page_id,
         username, name, profile_pic, access_token,
         token_type, expires_in, connected_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uid,
        igBusinessId,
        igGraphId,
        igBusinessId,
        String(tokenData.user_id || ""),
        profile.username,
        profile.name || "",
        profile.profile_picture_url || "",
        finalToken,
        longData.token_type || "bearer",
        longData.expires_in || null,
        new Date(),
      ],
    );

    await subscribeInstaWebhook(finalToken);

    return res.send(`<html><body style="${pageStyle}">
      <h2>✅ Connected @${profile.username}</h2>
      ${
        profile.profile_picture_url
          ? `<img src="${profile.profile_picture_url}" style="width:80px;height:80px;border-radius:50%;margin:12px 0"/>`
          : ""
      }
      <p>${profile.name || ""}</p>
      <p style="opacity:0.7;font-size:0.85rem">Closing in 2 seconds...</p>
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: "INSTA_CONNECTED" }, "*");
        }
        setTimeout(() => window.close(), 2000);
      </script>
    </body></html>`);
  } catch (err) {
    console.log(err);
    return res.send(`<html><body style="${pageStyle}">
      <h2>❌ Error</h2>
      <pre style="font-size:0.8rem;opacity:0.8">${err.message}</pre>
      <script>setTimeout(() => window.close(), 4000);</script>
    </body></html>`);
  }
});

// ─── Get all accounts for logged-in user ─────────────────
router.get("/accounts", validateUser, checkPlan, async (req, res) => {
  try {
    const accounts = await query(
      `SELECT id, uid, webhook_id, ig_graph_id, user_id,
              username, name, profile_pic, token_type,
              expires_in, connected_at, createdAt
              FROM instagram_accounts WHERE uid = ?`,
      [req.decode.uid],
    );
    res.json({ success: true, accounts });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ─── Delete an account ────────────────────────────────────
router.post("/delete-account", validateUser, checkPlan, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM instagram_accounts WHERE id = ?`, [id]);
    res.json({ success: true, msg: "Account disconnected" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

router.get("/webhook/:uid", (req, res) => {
  const VERIFY_TOKEN = req.params.uid;
  const {
    "hub.mode": mode,
    "hub.verify_token": token,
    "hub.challenge": challenge,
  } = req.query;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified for:", VERIFY_TOKEN);
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: "Forbidden" });
});

// ─── Fetch Instagram Profile + Reels (live from Instagram) ───────────────────
router.get("/profile/:accountId", validateUser, checkPlan, async (req, res) => {
  try {
    const { accountId } = req.params;

    const [account] = await query(
      `SELECT * FROM instagram_accounts WHERE id = ? AND uid = ?`,
      [accountId, req.decode.uid],
    );

    if (!account) {
      return res.json({ success: false, msg: "Account not found" });
    }

    const token = account.access_token;
    const { API_VERSION } = require("../utils/insta");

    // Fetch profile
    const profileRes = await fetch(
      `https://graph.instagram.com/${API_VERSION}/me?fields=id,username,name,profile_picture_url,biography,followers_count,media_count,website&access_token=${token}`,
    );
    const profile = await profileRes.json();

    // Fetch media (reels + posts)
    const mediaRes = await fetch(
      `https://graph.instagram.com/${API_VERSION}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=24&access_token=${token}`,
    );
    const mediaData = await mediaRes.json();

    if (profile.error) {
      return res.json({ success: false, msg: profile.error.message });
    }

    return res.json({
      success: true,
      profile,
      media: mediaData.data || [],
      paging: mediaData.paging || null,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ─── Load more media (pagination) ────────────────────────────────────────────
router.get(
  "/profile/:accountId/media",
  validateUser,
  checkPlan,
  async (req, res) => {
    try {
      const { accountId } = req.params;
      const { cursor } = req.query;

      const [account] = await query(
        `SELECT access_token FROM instagram_accounts WHERE id = ? AND uid = ?`,
        [accountId, req.decode.uid],
      );

      if (!account)
        return res.json({ success: false, msg: "Account not found" });

      const { API_VERSION } = require("../utils/insta");

      const mediaRes = await fetch(
        `https://graph.instagram.com/${API_VERSION}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=24&after=${cursor}&access_token=${account.access_token}`,
      );
      const mediaData = await mediaRes.json();

      return res.json({
        success: true,
        media: mediaData.data || [],
        paging: mediaData.paging || null,
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, msg: "Something went wrong" });
    }
  },
);

module.exports = router;

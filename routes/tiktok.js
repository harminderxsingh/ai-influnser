const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const { getEnv } = require("../utils/common");
const fetch = require("../utils/fetch");
const validateUser = require("../middlewares/user");
const {
  exchangeTiktokToken,
  fetchTiktokProfile,
  getTiktokCallbackUri,
  subscribeTiktokWebhook,
  TIKTOK_API_VERSION,
} = require("../utils/tiktok");
const { checkPlan } = require("../middlewares/common");

const pageStyle = `
  font-family:sans-serif;display:flex;flex-direction:column;
  align-items:center;justify-content:center;min-height:100vh;
  background:linear-gradient(135deg,#010101,#69C9D0,#EE1D52);
  color:#fff;margin:0;padding:20px;box-sizing:border-box;text-align:center
`;

// ─── Get Auth URL ─────────────────────────────────────────
router.get("/auth-url", validateUser, checkPlan, async (req, res) => {
  try {
    const [apiKeys] = await query(
      `SELECT tiktok_client_key, tiktok_client_secret FROM web_private`,
      [],
    );

    const tiktokCallbackUri = await getTiktokCallbackUri();

    if (!apiKeys?.tiktok_client_key || !tiktokCallbackUri) {
      return res.json({
        success: false,
        msg: "TikTok app not configured. Please contact admin.",
      });
    }

    const SCOPES = [
      "user.info.basic",
      "user.info.profile",
      "user.info.stats",
      "video.list",
    ].join(",");

    const params = new URLSearchParams({
      client_key: apiKeys.tiktok_client_key,
      redirect_uri: tiktokCallbackUri,
      scope: SCOPES,
      response_type: "code",
      state: req.decode.uid,
    });

    const url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    return res.json({ success: true, url });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ─── OAuth Callback ───────────────────────────────────────
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
      `SELECT tiktok_client_key, tiktok_client_secret FROM web_private`,
      [],
    );

    const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
    const plan = user?.plan ? JSON.parse(user.plan) : null;
    if (!plan) {
      return res.send(`<html><body style="${pageStyle}">
        <h2>❌ Error: No active plan</h2>
        <p>Please subscribe to a plan to connect your TikTok account.</p>
        <script>setTimeout(() => window.close(), 4000);</script>
      </body></html>`);
    }

    const tiktokCallbackUri = await getTiktokCallbackUri();

    if (!apiKeys?.tiktok_client_key || !apiKeys?.tiktok_client_secret) {
      throw new Error("TikTok credentials not configured.");
    }

    if (!tiktokCallbackUri) {
      throw new Error("TikTok callback URL not configured.");
    }

    // Exchange code for token
    const tokenData = await exchangeTiktokToken({
      clientKey: apiKeys.tiktok_client_key,
      clientSecret: apiKeys.tiktok_client_secret,
      redirectUri: tiktokCallbackUri,
      code,
    });

    if (!tokenData.access_token) {
      throw new Error("Token exchange failed: " + JSON.stringify(tokenData));
    }

    // Fetch profile
    const profile = await fetchTiktokProfile(tokenData.access_token);
    if (!profile?.open_id) {
      throw new Error("Could not fetch TikTok profile.");
    }

    const openId = String(profile.open_id);

    // ── Delete from ANY uid first (no duplicates across users) ────────────
    await query(`DELETE FROM tiktok_accounts WHERE open_id = ?`, [openId]);

    // ── Fresh insert for current uid ──────────────────────────────────────
    await query(
      `INSERT INTO tiktok_accounts
        (uid, open_id, union_id, display_name, username,
         avatar_url, access_token, refresh_token,
         token_type, expires_in, refresh_expires_in, connected_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uid,
        openId,
        profile.union_id || "",
        profile.display_name || "",
        profile.username || "",
        profile.avatar_url || "",
        tokenData.access_token,
        tokenData.refresh_token || "",
        tokenData.token_type || "Bearer",
        tokenData.expires_in || null,
        tokenData.refresh_expires_in || null,
        new Date(),
      ],
    );

    await subscribeTiktokWebhook(tokenData.access_token);

    return res.send(`<html><body style="${pageStyle}">
      <h2>✅ Connected @${profile.username || profile.display_name}</h2>
      ${
        profile.avatar_url
          ? `<img src="${profile.avatar_url}" style="width:80px;height:80px;border-radius:50%;margin:12px 0"/>`
          : ""
      }
      <p>${profile.display_name || ""}</p>
      <p style="opacity:0.7;font-size:0.85rem">Closing in 2 seconds...</p>
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: "TIKTOK_CONNECTED" }, "*");
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
      `SELECT id, uid, open_id, union_id, display_name, username,
              avatar_url, token_type, expires_in,
              refresh_expires_in, connected_at, createdAt
       FROM tiktok_accounts WHERE uid = ?`,
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
    await query(`DELETE FROM tiktok_accounts WHERE id = ? AND uid = ?`, [
      id,
      req.decode.uid,
    ]);
    res.json({ success: true, msg: "TikTok account disconnected" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ─── Webhook Verification ─────────────────────────────────
router.get("/webhook/:uid", (req, res) => {
  const VERIFY_TOKEN = req.params.uid;
  const {
    "hub.mode": mode,
    "hub.verify_token": token,
    "hub.challenge": challenge,
  } = req.query;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ TikTok Webhook verified for:", VERIFY_TOKEN);
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: "Forbidden" });
});

// ─── Fetch TikTok Profile + Videos ───────────────────────
router.get("/profile/:accountId", validateUser, checkPlan, async (req, res) => {
  try {
    const { accountId } = req.params;

    const [account] = await query(
      `SELECT * FROM tiktok_accounts WHERE id = ? AND uid = ?`,
      [accountId, req.decode.uid],
    );

    if (!account) {
      return res.json({ success: false, msg: "Account not found" });
    }

    const token = account.access_token;

    // Fetch profile
    const profileRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const profileData = await profileRes.json();

    // Fetch videos
    const videoRes = await fetch(
      "https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,video_description,duration,height,width,like_count,comment_count,share_count,view_count,create_time",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ max_count: 20 }),
      },
    );
    const videoData = await videoRes.json();

    if (profileData.error?.code !== "ok") {
      return res.json({
        success: false,
        msg: profileData.error?.message || "Failed to fetch profile",
      });
    }

    return res.json({
      success: true,
      profile: profileData?.data?.user || {},
      videos: videoData?.data?.videos || [],
      cursor: videoData?.data?.cursor || null,
      hasMore: videoData?.data?.has_more || false,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ─── Load more videos (pagination) ───────────────────────
router.post(
  "/profile/:accountId/videos",
  validateUser,
  checkPlan,
  async (req, res) => {
    try {
      const { accountId } = req.params;
      const { cursor } = req.body;

      const [account] = await query(
        `SELECT access_token FROM tiktok_accounts WHERE id = ? AND uid = ?`,
        [accountId, req.decode.uid],
      );

      if (!account)
        return res.json({ success: false, msg: "Account not found" });

      const videoRes = await fetch(
        "https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,video_description,duration,like_count,comment_count,share_count,view_count,create_time",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ max_count: 20, cursor }),
        },
      );
      const videoData = await videoRes.json();

      return res.json({
        success: true,
        videos: videoData?.data?.videos || [],
        cursor: videoData?.data?.cursor || null,
        hasMore: videoData?.data?.has_more || false,
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, msg: "Something went wrong" });
    }
  },
);

module.exports = router;

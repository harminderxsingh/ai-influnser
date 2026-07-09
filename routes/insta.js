const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const { getEnv } = require("../utils/common");
const fetch = require("../utils/fetch");
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

function maskToken(token = "") {
  if (!token) return "";
  if (token.length <= 12) return "****";
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

async function callInstagramGraph({ pathName, accessToken, params = {}, method = "GET" }) {
  const { API_VERSION } = require("../utils/insta");
  const url = new URL(`https://graph.instagram.com/${API_VERSION}/${pathName}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString(), { method });
  const body = await response.json();

  return {
    ok: response.ok && !body?.error,
    status: response.status,
    endpoint: `${url.origin}${url.pathname}`,
    body,
    error: body?.error?.message || null,
  };
}

// ─── Test linked Instagram account token against Meta Graph API ───────────────
router.get("/test-account/:accountId", validateUser, checkPlan, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { publish_test_image_url, publish_test_caption } = req.query;

    const [account] = await query(
      `SELECT id, uid, webhook_id, ig_graph_id, user_id, page_id,
              username, name, profile_pic, access_token, token_type,
              expires_in, connected_at, createdAt
       FROM instagram_accounts
       WHERE id = ? AND uid = ?`,
      [accountId, req.decode.uid],
    );

    if (!account) {
      return res.json({ success: false, msg: "Instagram account not found" });
    }

    if (!account.access_token) {
      return res.json({ success: false, msg: "Instagram access token missing" });
    }

    const checks = {};
    checks.basic_profile = await callInstagramGraph({
      pathName: "me",
      accessToken: account.access_token,
      params: {
        fields:
          "id,user_id,username,name,profile_picture_url,biography,followers_count,media_count,website",
      },
    });

    checks.media_list = await callInstagramGraph({
      pathName: "me/media",
      accessToken: account.access_token,
      params: {
        fields:
          "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
        limit: 1,
      },
    });

    const firstMediaId = checks.media_list.body?.data?.[0]?.id;
    checks.comments = firstMediaId
      ? await callInstagramGraph({
          pathName: `${firstMediaId}/comments`,
          accessToken: account.access_token,
          params: { fields: "id,text,username,timestamp", limit: 1 },
        })
      : {
          ok: true,
          skipped: true,
          msg: "No media found to test comments endpoint",
        };

    checks.conversations = await callInstagramGraph({
      pathName: "me/conversations",
      accessToken: account.access_token,
      params: { platform: "instagram", limit: 1 },
    });

    checks.subscribed_apps = await callInstagramGraph({
      pathName: "me/subscribed_apps",
      accessToken: account.access_token,
      params: { fields: "subscribed_fields" },
    });

    if (publish_test_image_url) {
      checks.content_publish_container = await callInstagramGraph({
        pathName: `${account.ig_graph_id || "me"}/media`,
        accessToken: account.access_token,
        method: "POST",
        params: {
          image_url: publish_test_image_url,
          caption: publish_test_caption || "Instagram API connection test",
        },
      });
      checks.content_publish_container.note =
        "Container created only. It was not published to Instagram.";
    } else {
      checks.content_publish_container = {
        ok: true,
        skipped: true,
        msg: "Pass ?publish_test_image_url=<public-image-url> to test content publish container creation without publishing.",
      };
    }

    const failedChecks = Object.entries(checks).filter(([, check]) => !check.ok);

    return res.json({
      success: failedChecks.length === 0,
      msg:
        failedChecks.length === 0
          ? "Instagram token test passed"
          : "Instagram token test completed with failures",
      account: {
        id: account.id,
        username: account.username,
        ig_graph_id: account.ig_graph_id,
        webhook_id: account.webhook_id,
        token_type: account.token_type,
        access_token: maskToken(account.access_token),
        connected_at: account.connected_at,
      },
      checks,
      failedChecks: failedChecks.map(([name, check]) => ({
        name,
        status: check.status,
        error: check.error || check.msg || "Unknown error",
      })),
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err: err.message });
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

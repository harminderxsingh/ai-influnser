const fetch = require("./fetch");
const { query } = require("../database/connection");
const { getEnv } = require("./common");

const TIKTOK_API_VERSION = "v2";

// ─── Generate Webhook URL ─────────────────────────────────
async function genTiktokWebhook() {
  try {
    const env = getEnv();
    const [admin] = await query(`SELECT * FROM admin LIMIT 1`, []);
    const webhook = `${env.backendUrl}/api/tiktok/webhook/${admin?.uid}`;
    return webhook;
  } catch (err) {
    console.log(err);
    return null;
  }
}

// ─── Generate OAuth Callback URI ──────────────────────────
async function getTiktokCallbackUri() {
  try {
    const env = getEnv();
    const callBackUri = `${env.backendUrl}/api/tiktok/callback`;
    return callBackUri;
  } catch (err) {
    console.log(err);
    return null;
  }
}

// ─── Exchange Auth Code for Access Token ──────────────────
async function exchangeTiktokToken({
  clientKey,
  clientSecret,
  redirectUri,
  code,
}) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  return res.json();
}

// ─── Refresh Access Token ─────────────────────────────────
async function refreshTiktokToken({ clientKey, clientSecret, refreshToken }) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  return res.json();
}

// ─── Fetch TikTok User Profile ────────────────────────────
async function fetchTiktokProfile(accessToken) {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const data = await res.json();
  // TikTok wraps response in data.data.user
  return data?.data?.user || null;
}

// ─── Subscribe to TikTok Webhook ──────────────────────────
async function subscribeTiktokWebhook(accessToken) {
  try {
    // TikTok webhook subscriptions are configured in the
    // developer portal — no programmatic subscribe endpoint.
    // This is a placeholder for any post-connect setup you need.
    console.log(
      "[TikTok] Webhook subscription: configure in TikTok Developer Portal.",
    );
    return { success: true };
  } catch (err) {
    console.error("[TikTok] subscribeTiktokWebhook error:", err.message);
    return null;
  }
}

module.exports = {
  TIKTOK_API_VERSION,
  genTiktokWebhook,
  getTiktokCallbackUri,
  exchangeTiktokToken,
  refreshTiktokToken,
  fetchTiktokProfile,
  subscribeTiktokWebhook,
};

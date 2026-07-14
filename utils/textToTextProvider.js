const { query } = require("../database/connection");
const { getActiveProvider, getProviderByKey } = require("./aiProvider");

const API_KEY_PLACEHOLDERS = new Set(["", "YOUR_API_KEY", "YOUR_VSK_KEY"]);

function isPlaceholderKey(apiKey) {
  return API_KEY_PLACEHOLDERS.has(String(apiKey || "").trim());
}

function pickTxt2txtKey(provider) {
  if (!provider) return "";
  const key = String(provider.txt2txt_api_key || "").trim();
  if (!isPlaceholderKey(key)) return key;
  for (const prefix of ["txt2img", "showcase", "img2img", "reel", "talking"]) {
    const k = String(provider[`${prefix}_api_key`] || "").trim();
    if (!isPlaceholderKey(k)) return k;
  }
  return "";
}

function parsePayload(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Ordered list of txt2txt providers with real API keys.
 * Default/active first — respects Admin "Use this provider".
 */
async function listTextToTextProviders() {
  const seen = new Set();
  const list = [];

  const push = (row) => {
    if (!row?.id || seen.has(row.id)) return;
    if (!row.txt2txt_enabled || !pickTxt2txtKey(row)) return;
    seen.add(row.id);
    list.push(row);
  };

  try {
    const [def] = await query(
      `SELECT * FROM ai_providers
       WHERE is_active = 1 AND is_default = 1 AND txt2txt_enabled = 1
       ORDER BY id ASC LIMIT 1`,
    );
    push(def);
  } catch {
    // continue
  }

  try {
    push(await getActiveProvider("txt2txt"));
  } catch {
    // continue
  }

  try {
    const activeRows = await query(
      `SELECT * FROM ai_providers
       WHERE is_active = 1 AND txt2txt_enabled = 1
       ORDER BY is_default DESC, id ASC`,
    );
    for (const row of activeRows || []) push(row);
  } catch {
    // continue
  }

  for (const key of ["xai_grok", "google", "google_gemini", "google_veo"]) {
    try {
      const row = await getProviderByKey(key);
      if (row?.is_active) push(row);
    } catch {
      // continue
    }
  }

  try {
    const anyRows = await query(
      `SELECT * FROM ai_providers
       WHERE txt2txt_enabled = 1
       ORDER BY is_default DESC, is_active DESC, id ASC`,
    );
    for (const row of anyRows || []) push(row);
  } catch {
    // ignore
  }

  return list;
}

async function getTextToTextProvider() {
  const list = await listTextToTextProviders();
  return list[0] || null;
}

function describeTextEngine(provider) {
  const key = String(provider?.provider_key || "").toLowerCase();
  const payload = parsePayload(provider?.txt2txt_create_payload);
  const baseUrl = String(provider?.txt2txt_base_url || "").replace(/\/+$/, "");
  const endpoint = String(provider?.txt2txt_create_endpoint || "");

  if (
    key.includes("google") ||
    baseUrl.includes("generativelanguage.googleapis.com")
  ) {
    const modelMatch = endpoint.match(/models\/([^/:]+)/);
    return {
      engine: "google",
      model: modelMatch?.[1] || payload.model || "gemini-2.0-flash",
      baseUrl,
      endpoint,
    };
  }

  let chatBase = baseUrl;
  if (
    chatBase &&
    !/\/v1$/i.test(chatBase) &&
    !chatBase.includes("compatible-mode")
  ) {
    if (
      chatBase.includes("api.openai.com") ||
      chatBase.includes("api.groq.com") ||
      chatBase.includes("api.x.ai")
    ) {
      chatBase = chatBase.endsWith("/v1") ? chatBase : `${chatBase}/v1`;
    }
  }

  let model = payload.model || "gpt-4o-mini";
  if (key.includes("groq")) model = payload.model || "llama-3.1-8b-instant";
  if (key.includes("xai") || key.includes("grok"))
    model = payload.model || "grok-3-mini";
  if (key.includes("alibaba") || key.includes("dashscope"))
    model = payload.model || "qwen-plus";

  return {
    engine: "openai_compatible",
    model,
    baseUrl: chatBase,
    endpoint: endpoint || "/chat/completions",
  };
}

function isQuotaOrRateLimitError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  const status = err?.response?.status;
  return (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

module.exports = {
  getTextToTextProvider,
  listTextToTextProviders,
  pickTxt2txtKey,
  describeTextEngine,
  isPlaceholderKey,
  parsePayload,
  isQuotaOrRateLimitError,
};

const axios = require("axios");
const path = require("path");

// ============================================
// UTILITY: Deep get value from object by dot-path
// Supports:
//   "data.taskId"
//   "data.resultJson.resultUrls[0]"
//   "JSON.stringify(data.response).resultUrls[0]"  ← NEW
// ============================================

function getByPath(obj, path) {
  // ── SPECIAL SYNTAX: JSON.stringify(some.path).rest[0] ──────────────
  // Means: navigate to "some.path", force JSON.parse if string, then
  // continue traversal with "rest[0]"
  const jsonParseMatch = path.match(/^JSON\.stringify\(([^)]+)\)\.(.+)$/);
  if (jsonParseMatch) {
    const innerPath = jsonParseMatch[1]; // e.g. "data.response"
    const restPath = jsonParseMatch[2]; // e.g. "resultUrls[0]"

    let inner = getByPath(obj, innerPath);

    // Force-parse if it came back as a string
    if (typeof inner === "string") {
      try {
        inner = JSON.parse(inner);
      } catch {
        return undefined;
      }
    }

    if (inner === null || inner === undefined) return undefined;

    // Continue traversal on the parsed node
    return getByPath(inner, restPath);
  }

  // ── NORMAL DOT-PATH TRAVERSAL ──────────────────────────────────────
  return path.split(".").reduce((current, key) => {
    if (current === null || current === undefined) return undefined;

    // Auto-parse if current level is a JSON string
    if (typeof current === "string") {
      try {
        current = JSON.parse(current);
      } catch {
        return undefined;
      }
    }

    // Handle array index notation e.g. resultUrls[0]
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrKey = arrayMatch[1];
      const arrIndex = parseInt(arrayMatch[2]);
      let arrValue = current[arrKey];

      // Parse once if string
      if (typeof arrValue === "string") {
        try {
          arrValue = JSON.parse(arrValue);
        } catch {
          return undefined;
        }
      }
      // Parse again — some APIs double-encode
      if (typeof arrValue === "string") {
        try {
          arrValue = JSON.parse(arrValue);
        } catch {
          return undefined;
        }
      }

      return Array.isArray(arrValue) ? arrValue[arrIndex] : undefined;
    }

    // Auto-parse nested JSON strings before going deeper
    const val = current[key];
    if (
      typeof val === "string" &&
      (val.startsWith("{") || val.startsWith("["))
    ) {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }

    return val;
  }, obj);
}

// ============================================
// UTILITY: Replace {{placeholders}} in string
// ============================================

function interpolate(template, variables) {
  return template.replace(/"?\{\{(\w+)\}\}"?/g, (match, key) => {
    if (variables[key] === undefined) {
      throw new Error(`Missing variable "{{${key}}}" in template`);
    }

    const value = variables[key];
    const isQuoted = match.startsWith('"') && match.endsWith('"');

    // Quoted placeholder → produce a valid JSON string value
    if (isQuoted) {
      return JSON.stringify(String(value));
    }

    // Not quoted → inject raw (numbers, booleans, pre-built arrays)
    return value;
  });
}

// ============================================
// UTILITY: Build auth headers/query/body
// ============================================

function normalizeAuthType(authType) {
  switch (authType) {
    case "custom_header":
    case "header":
      return "header";
    case "query_param":
    case "query":
      return "query";
    case "body":
      return "body";
    case "none":
    case "no_auth":
      return "none";
    case "basic":
      return "basic";
    case "bearer":
    default:
      return "bearer";
  }
}

function isPlaceholderKey(value) {
  return new Set(["YOUR_API_KEY", "YOUR_VSK_KEY", ""]).has(
    String(value || "").trim(),
  );
}

function resolveApiKey(provider, prefix) {
  return String(provider[`${prefix}_api_key`] || "").trim();
}

function assertApiKey(provider, prefix, apiKey) {
  if (isPlaceholderKey(apiKey)) {
    throw new Error(
      `Provider "${provider.name}" ${prefix} API key is empty. Add a valid API key in Admin > AI Providers.`,
    );
  }
}

function buildAuth(provider, prefix) {
  const authType = normalizeAuthType(provider[`${prefix}_auth_type`]);
  const apiKey = resolveApiKey(provider, prefix);
  const headerKey = String(
    provider[`${prefix}_auth_header_key`] || "Authorization",
  ).trim();
  const headerPrefix = String(
    provider[`${prefix}_auth_header_prefix`] ||
      (authType === "bearer" ? "Bearer" : ""),
  ).trim();
  const bodyKey = String(provider[`${prefix}_auth_body_key`] || "").trim();
  const queryKey = String(provider[`${prefix}_auth_query_key`] || "").trim();

  const headers = {};
  const queryParams = {};
  const bodyParams = {};

  if (authType === "none") {
    return { headers, queryParams, bodyParams };
  }

  assertApiKey(provider, prefix, apiKey);

  // D-ID etc.: paste key as username:password → Authorization: Basic base64(...)
  if (authType === "basic") {
    const encoded = Buffer.from(apiKey, "utf8").toString("base64");
    headers[headerKey || "Authorization"] = `Basic ${encoded}`;
  }

  if (authType === "bearer" || authType === "header") {
    const value = headerPrefix ? `${headerPrefix} ${apiKey}` : apiKey;
    headers[headerKey] = value;
  }

  if (authType === "query" && queryKey) {
    queryParams[queryKey] = apiKey;
  }

  if (authType === "body" && bodyKey) {
    bodyParams[bodyKey] = apiKey;
  }

  return { headers, queryParams, bodyParams };
}

function encodeTaskIdForUrl(taskId) {
  // Preserve path separators for Google-style operation names:
  // models/veo-.../operations/abc123
  return String(taskId)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function extractResultValue(responseData, resultPath) {
  if (!resultPath) return undefined;

  const b64Match = String(resultPath).match(/^@b64data\((.+)\)$/);
  if (b64Match) {
    const b64 = getByPath(responseData, b64Match[1]);
    if (!b64) return undefined;
    return `data:image/png;base64,${b64}`;
  }

  const fetchMatch = String(resultPath).match(/^@fetch\(([^)]+)\)\.(.+)$/);
  if (fetchMatch) {
    return { __needsFetch: true, endpoint: fetchMatch[1], path: fetchMatch[2] };
  }

  return getByPath(responseData, resultPath);
}

function toSyncTaskId(resultValue) {
  return `sync:${Buffer.from(String(resultValue), "utf8").toString("base64url")}`;
}

function fromSyncTaskId(taskId) {
  if (!String(taskId).startsWith("sync:")) return null;
  try {
    return Buffer.from(String(taskId).slice(5), "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function appendGoogleApiKeyIfNeeded(url, apiKey) {
  const value = String(url || "");
  if (
    !value.includes("generativelanguage.googleapis.com") ||
    value.includes("key=") ||
    !apiKey
  ) {
    return value;
  }
  return `${value}${value.includes("?") ? "&" : "?"}key=${encodeURIComponent(apiKey)}`;
}

async function resolveUrlToBase64Fields(node) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = await resolveUrlToBase64Fields(node[i]);
    }
    return node;
  }

  if (node && typeof node === "object") {
    for (const key of Object.keys(node)) {
      node[key] = await resolveUrlToBase64Fields(node[key]);
    }
    return node;
  }

  if (typeof node === "string" && node.startsWith("@url_to_b64:")) {
    const mediaUrl = node.slice("@url_to_b64:".length);

    // Already a data URI — extract base64 payload
    if (mediaUrl.startsWith("data:")) {
      const match = mediaUrl.match(/^data:[^;]+;base64,(.+)$/s);
      if (!match) {
        throw new Error("Invalid data URI for @url_to_b64");
      }
      return match[1];
    }

    const response = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
    });
    return Buffer.from(response.data).toString("base64");
  }

  return node;
}

// ============================================
// CORE: Create a job task
// ============================================

async function createJob(provider, type, variables = {}) {
  const baseUrl = provider[`${type}_base_url`];
  const endpoint = provider[`${type}_create_endpoint`];
  const method = (provider[`${type}_create_method`] || "POST").toLowerCase();
  let payloadTemplate = provider[`${type}_create_payload`];
  const jobIdPath = provider[`${type}_job_id_path`];
  const statusEndpoint = provider[`${type}_status_endpoint`];
  const resultPath = provider[`${type}_result_path`];

  // ✅ FIX: if DB returned an object instead of a raw string, stringify it first
  if (payloadTemplate && typeof payloadTemplate === "object") {
    payloadTemplate = JSON.stringify(payloadTemplate);
  }

  if (!baseUrl || !endpoint) {
    return {
      status: "error",
      msg: `Provider "${provider.name}" has no ${type} config`,
    };
  }

  let payload = {};
  let extraHeaders = {};
  if (payloadTemplate) {
    try {
      const interpolated = interpolate(payloadTemplate, variables);
      payload = JSON.parse(interpolated);
      if (payload && typeof payload === "object" && payload.__headers) {
        extraHeaders = payload.__headers || {};
        delete payload.__headers;
      }
    } catch (err) {
      return {
        status: "error",
        msg: `Failed to build payload: ${err.message}`,
      };
    }
  }

  let auth;
  try {
    auth = buildAuth(provider, type);
  } catch (err) {
    return {
      status: "error",
      msg: err.message,
    };
  }

  const { headers, queryParams, bodyParams } = auth;

  if (Object.keys(bodyParams).length > 0) {
    payload = { ...payload, ...bodyParams };
  }

  try {
    payload = await resolveUrlToBase64Fields(payload);
  } catch (err) {
    return {
      status: "error",
      msg: `Failed to resolve media for payload: ${normalizeError(err).message}`,
    };
  }

  let resolvedEndpoint = String(endpoint);
  try {
    resolvedEndpoint = interpolate(resolvedEndpoint, {
      ...variables,
      prompt:
        variables.prompt !== undefined
          ? encodeURIComponent(String(variables.prompt))
          : variables.prompt,
    });
  } catch (err) {
    return {
      status: "error",
      msg: `Failed to build endpoint: ${err.message}`,
    };
  }

  const url = `${String(baseUrl).replace(/\/+$/, "")}${resolvedEndpoint}`;

  console.log(
    `[createJob] ${type} → ${provider.provider_key || provider.name} ${method.toUpperCase()} ${url}`,
  );

  try {
    // Pollinations-style: GET returns raw image; result is the request URL itself
    const usesSelfUrl =
      String(resultPath || "") === "__self_url" ||
      String(jobIdPath || "") === "__self_url";

    const response = await axios({
      method,
      url,
      headers: {
        ...(method !== "get" ? { "Content-Type": "application/json" } : {}),
        ...headers,
        ...extraHeaders,
      },
      params: queryParams,
      data: method !== "get" ? payload : undefined,
      timeout: 120000,
      responseType: usesSelfUrl ? "arraybuffer" : "json",
      validateStatus: (s) => s >= 200 && s < 400,
    });

    if (usesSelfUrl) {
      const finalUrl = url;
      return { status: "success", taskId: toSyncTaskId(finalUrl) };
    }

    // Some APIs return HTTP 200 but error code inside body
    const bodyCode = response.data?.code;
    if (bodyCode !== undefined && bodyCode !== 200 && bodyCode !== "200") {
      return {
        status: "error",
        msg:
          response.data?.message ||
          response.data?.msg ||
          `API returned code ${bodyCode}`,
      };
    }

    // Sync providers (e.g. xAI image, Google Imagen, OpenAI DALL·E): no status endpoint
    if (!String(statusEndpoint || "").trim()) {
      let resultValue = extractResultValue(response.data, resultPath);
      if (resultValue && typeof resultValue === "object" && resultValue.__needsFetch) {
        return {
          status: "error",
          msg: "Sync create cannot use @fetch result paths",
        };
      }
      if (!resultValue) {
        return {
          status: "error",
          msg: `Sync job succeeded but result not found at path "${resultPath}". Response: ${safeStringify(response.data)}`,
        };
      }
      resultValue = appendGoogleApiKeyIfNeeded(
        resultValue,
        resolveApiKey(provider, type),
      );
      return { status: "success", taskId: toSyncTaskId(resultValue) };
    }

    const taskId = getByPath(response.data, jobIdPath);

    if (!taskId) {
      return {
        status: "error",
        msg: `Job created but taskId not found at path "${jobIdPath}". Response: ${safeStringify(response.data)}`,
      };
    }

    return { status: "success", taskId };
  } catch (err) {
    return {
      status: "error",
      msg: normalizeError(err).message,
    };
  }
}

// ============================================
// CORE: Fetch job status
// Returns: { status: 'pending' | 'success' | 'error', data?, msg? }
// ============================================

async function fetchJobStatus(provider, type, taskId) {
  // Sync jobs encode the final URL/data-URI in the taskId
  const syncResult = fromSyncTaskId(taskId);
  if (syncResult !== null) {
    return { status: "success", data: syncResult };
  }

  const baseUrl = provider[`${type}_base_url`];
  const endpointTemplate = provider[`${type}_status_endpoint`];
  const method = (provider[`${type}_status_method`] || "GET").toLowerCase();
  const statePath = provider[`${type}_state_path`];
  const successState = provider[`${type}_success_state`];
  const failedState = provider[`${type}_failed_state`];
  const resultPath = provider[`${type}_result_path`];

  if (!baseUrl || !endpointTemplate) {
    return {
      status: "error",
      msg: `Provider "${provider.name}" has no ${type} status config`,
    };
  }

  // Build endpoint — replace {{taskId}} placeholder (keep / for Google ops)
  const endpoint = endpointTemplate.replace(
    "{{taskId}}",
    encodeTaskIdForUrl(taskId),
  );

  let auth;
  try {
    auth = buildAuth(provider, type);
  } catch (err) {
    return {
      status: "error",
      msg: err.message,
    };
  }

  const { headers, queryParams } = auth;
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await axios({
      method,
      url,
      headers: { "Content-Type": "application/json", ...headers },
      params: queryParams,
      timeout: 30000,
    });

    const responseData = response.data;

    // Some APIs return HTTP 200 but error code inside body
    const bodyCode = responseData?.code;
    if (bodyCode !== undefined && bodyCode !== 200 && bodyCode !== "200") {
      return {
        status: "error",
        msg:
          responseData?.message ||
          responseData?.msg ||
          `API returned code ${bodyCode}`,
      };
    }

    const state = getByPath(responseData, statePath);

    if (state === undefined || state === null) {
      return {
        status: "error",
        msg: `Could not read state from path "${statePath}". Response: ${safeStringify(responseData)}`,
      };
    }

    // Normalize to string — handles integer 1 vs string "1", boolean true, etc.
    const stateStr = String(state);
    const successStr = String(successState);

    // ── SUCCESS ──────────────────────────────────────────────────────
    if (stateStr === successStr) {
      // Google LRO can be done:true with an error object
      const lroError = getByPath(responseData, "error");
      if (lroError) {
        return {
          status: "error",
          msg:
            typeof lroError === "object"
              ? lroError.message || safeStringify(lroError)
              : String(lroError),
        };
      }

      let resultValue;

      // Special syntax for providers (e.g. fal.ai) that need a second
      // request after success: @fetch(/path/{{taskId}}).images[0].url
      const fetchMatch = String(resultPath || "").match(
        /^@fetch\(([^)]+)\)\.(.+)$/,
      );

      if (fetchMatch) {
        const fetchEndpoint = fetchMatch[1].replace(
          "{{taskId}}",
          encodeTaskIdForUrl(taskId),
        );
        const fetchResultPath = fetchMatch[2];
        const fetchUrl = `${baseUrl}${fetchEndpoint}`;

        try {
          const resultResponse = await axios({
            method: "get",
            url: fetchUrl,
            headers: { "Content-Type": "application/json", ...headers },
            params: queryParams,
            timeout: 30000,
          });
          resultValue = extractResultValue(
            resultResponse.data,
            fetchResultPath.startsWith("@b64data(")
              ? fetchResultPath
              : fetchResultPath,
          );
          if (
            resultValue &&
            typeof resultValue === "object" &&
            resultValue.__needsFetch
          ) {
            resultValue = undefined;
          }

          if (!resultValue) {
            return {
              status: "error",
              msg: `Job succeeded but result not found at path "${fetchResultPath}" after @fetch. Response: ${safeStringify(resultResponse.data)}`,
            };
          }
        } catch (fetchErr) {
          return {
            status: "error",
            msg: `Job succeeded but result fetch failed: ${normalizeError(fetchErr).message}`,
          };
        }
      } else {
        resultValue = extractResultValue(responseData, resultPath);
        if (
          resultValue &&
          typeof resultValue === "object" &&
          resultValue.__needsFetch
        ) {
          resultValue = undefined;
        }

        if (!resultValue) {
          return {
            status: "error",
            msg: `Job succeeded but result not found at path "${resultPath}". Response: ${safeStringify(responseData)}`,
          };
        }
      }

      resultValue = appendGoogleApiKeyIfNeeded(
        resultValue,
        resolveApiKey(provider, type),
      );

      return { status: "success", data: resultValue };
    }

    // ── FAILED state matched ──────────────────────────────────────────
    // Support multiple failed values: "failed", "failed,expired", etc.
    const failedStates = String(failedState || "failed")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (failedStates.includes(stateStr)) {
      const errorMsg =
        getByPath(responseData, "error.message") ||
        getByPath(responseData, "error.description") ||
        getByPath(responseData, "description") ||
        getByPath(responseData, "data.errorMessage") ||
        getByPath(responseData, "data.failMsg") ||
        getByPath(responseData, "data.error") ||
        getByPath(responseData, "output.message") ||
        getByPath(responseData, "message") ||
        getByPath(responseData, "msg") ||
        getByPath(responseData, "error");

      return {
        status: "error",
        msg:
          typeof errorMsg === "object"
            ? safeStringify(errorMsg)
            : String(errorMsg || `Job failed (state: ${state})`),
      };
    }

    // ── Neither success nor failed → still pending ────────────────────
    return { status: "pending" };
  } catch (err) {
    return {
      status: "error",
      msg: normalizeError(err).message,
    };
  }
}

function safeParseJsonText(value) {
  if (!value || typeof value !== "string") return null;

  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function loadImageBytes(imageInput) {
  // string URL (legacy) | { buffer, mimeType } | { filePath }
  if (imageInput && typeof imageInput === "object" && !Buffer.isBuffer(imageInput)) {
    if (Buffer.isBuffer(imageInput.buffer)) {
      return {
        buffer: imageInput.buffer,
        mimeType: String(imageInput.mimeType || "image/jpeg").split(";")[0],
      };
    }
    if (imageInput.filePath) {
      const fs = require("fs");
      const buffer = fs.readFileSync(imageInput.filePath);
      const ext = path.extname(imageInput.filePath).toLowerCase();
      const mimeType =
        imageInput.mimeType ||
        (ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg");
      return { buffer, mimeType };
    }
  }

  const imageUrl = String(imageInput || "");
  const imageResponse = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  });
  const mimeType =
    String(imageResponse.headers["content-type"] || "image/jpeg").split(
      ";",
    )[0] || "image/jpeg";
  return { buffer: Buffer.from(imageResponse.data), mimeType };
}

const PRODUCT_VISION_PROMPT = `You are a product marketing analyst for UGC / influencer ads.
Analyze the product photo carefully. Return ONLY valid JSON (no markdown) with these keys:
{
  "product_type": "short category e.g. skincare serum, wireless earbuds, protein powder",
  "product_name": "best guess brand/product name from packaging text, else generic name",
  "product_description": "1-2 sentences: what it is, color, packaging, visible features",
  "key_features": ["feature1", "feature2", "feature3"],
  "key_benefits": ["benefit1", "benefit2"],
  "target_audience": "who buys this",
  "use_cases": ["when/how people use it"],
  "visual_style": "colors, packaging style, premium/mass-market look",
  "best_ad_angles": ["demo angle ideas that fit this product"],
  "influencer_prompt": "photorealistic influencer description suited to promote THIS product",
  "ad_prompt": "8-second vertical product showcase: influencer naturally presents THIS exact product, sharp packaging, accurate colors, clear CTA"
}`;

async function analyzeWithGoogleVision(apiKey, buffer, mimeType) {
  const imageBase64 = buffer.toString("base64");
  const response = await axios({
    method: "post",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    timeout: 60000,
    data: {
      contents: [
        {
          role: "user",
          parts: [
            { text: PRODUCT_VISION_PROMPT },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.2 },
    },
  });

  const content =
    response.data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("\n") || "";
  return safeParseJsonText(content);
}

async function analyzeWithGrokVision(apiKey, buffer, mimeType) {
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  // Prefer current vision-capable chat models; older *-vision-* IDs are retired
  const models = ["grok-4.5", "grok-4", "grok-2-vision-latest"];
  let lastErr = null;

  for (const model of models) {
    try {
      const response = await axios({
        method: "post",
        url: "https://api.x.ai/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60000,
        data: {
          model,
          temperature: 0.2,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: PRODUCT_VISION_PROMPT },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        },
      });

      const content = response.data?.choices?.[0]?.message?.content || "";
      const parsed = safeParseJsonText(content);
      if (parsed) return parsed;
      lastErr = new Error(`Vision (${model}) returned invalid JSON`);
    } catch (err) {
      lastErr = err;
      const msg = normalizeError(err).message || "";
      // Try next model only when this one is missing / invalid
      if (/model not found|invalid.?model|does not exist/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }

  throw lastErr || new Error("Grok vision analysis failed");
}

function pickProviderApiKey(row, features = ["txt2txt", "txt2img", "showcase", "img2img"]) {
  for (const feature of features) {
    try {
      const key = resolveApiKey(row, feature);
      assertApiKey(row, feature, key);
      return key;
    } catch {
      // try next
    }
  }
  return "";
}

async function analyzeProductImage(provider, imageInput) {
  const { buffer, mimeType } = await loadImageBytes(imageInput);

  const candidates = [];
  const { getProviderByKey, getActiveProvider } = require("../utils/aiProvider");

  for (const key of ["google", "google_gemini", "google_veo"]) {
    const row = await getProviderByKey(key);
    if (!row) continue;
    const apiKey = pickProviderApiKey(row);
    if (apiKey) candidates.push({ engine: "google", apiKey, name: row.name });
  }

  const grok =
    (await getProviderByKey("xai_grok")) ||
    (provider?.provider_key === "xai_grok" ? provider : null) ||
    (await getActiveProvider());
  if (grok) {
    const apiKey = pickProviderApiKey(grok);
    if (apiKey) {
      if (String(grok.provider_key || "").includes("xai") || String(grok.txt2img_base_url || "").includes("x.ai")) {
        candidates.push({ engine: "grok", apiKey, name: grok.name });
      } else if (!candidates.length) {
        // last resort: try Google-format key from active provider
        candidates.push({ engine: "google", apiKey, name: grok.name });
      }
    }
  }

  if (provider) {
    const apiKey = pickProviderApiKey(provider);
    if (apiKey) {
      const isGrok =
        String(provider.provider_key || "").includes("xai") ||
        String(provider.txt2img_base_url || "").includes("x.ai");
      candidates.push({
        engine: isGrok ? "grok" : "google",
        apiKey,
        name: provider.name,
      });
    }
  }

  // de-dupe by engine+key
  const seen = new Set();
  const unique = [];
  for (const c of candidates) {
    const id = `${c.engine}:${c.apiKey.slice(0, 12)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(c);
  }

  if (!unique.length) {
    return {
      status: "error",
      msg: "No vision-capable API key found. Enable Google AI or xAI Grok with a valid key.",
    };
  }

  let lastError = null;
  for (const candidate of unique) {
    try {
      const parsed =
        candidate.engine === "grok"
          ? await analyzeWithGrokVision(candidate.apiKey, buffer, mimeType)
          : await analyzeWithGoogleVision(candidate.apiKey, buffer, mimeType);

      if (!parsed) {
        lastError = new Error(
          `Vision (${candidate.name}) returned invalid JSON`,
        );
        continue;
      }

      return {
        status: "success",
        data: parsed,
        provider: candidate.name,
        engine: candidate.engine,
      };
    } catch (err) {
      lastError = err;
      console.warn(
        `[vision] ${candidate.engine}/${candidate.name} failed:`,
        normalizeError(err).message.slice(0, 200),
      );
    }
  }

  return {
    status: "error",
    msg: normalizeError(lastError || new Error("Vision analysis failed")).message,
  };
}

function buildTextPrompts(opts = {}) {
  // Direct chat / custom prompts (skip content-writer templates)
  if (opts.systemPrompt && opts.userPrompt) {
    const topic = String(opts.topic || opts.userPrompt || "").trim();
    return {
      topic,
      contentType: "chat",
      systemPrompt: String(opts.systemPrompt),
      userPrompt: String(opts.userPrompt),
    };
  }

  const topic = String(opts.topic || "").trim();
  const contentType = String(opts.contentType || "caption").trim();
  const tone = String(opts.tone || "engaging").trim();
  const language = String(opts.language || "English").trim();
  const extra = String(opts.extra || "").trim();

  const typeGuides = {
    caption:
      "Write a social media caption (Instagram/Facebook). Include a hook, value, soft CTA, and 5–8 relevant hashtags.",
    reel_script:
      "Write a short vertical video / Reel / TikTok script (15–30 seconds). Include scene beats, spoken lines, and on-screen text cues.",
    blog: "Write a clear blog-style article with a title, short intro, 3–5 sections with subheadings, and a conclusion CTA.",
    product_desc:
      "Write a persuasive product description with benefits, features, and a short CTA. Keep it scannable.",
    email:
      "Write a marketing email with subject line, preview text, body, and CTA.",
    ad_copy:
      "Write short ad copy variants (3 options): headline + primary text + CTA. Keep each under 80 words.",
    youtube:
      "Write a YouTube video description with title suggestion, summary, timestamps placeholder, and CTA + hashtags.",
    talking_script:
      "Write a natural talking-head video script the influencer can speak aloud (30–60 seconds). Conversational, no stage directions unless needed.",
  };

  const guide =
    typeGuides[contentType] ||
    "Write helpful marketing content based on the user's topic.";

  const systemPrompt = `You are an expert content writer for creators and brands.
Content type: ${contentType}
Instructions: ${guide}
Tone: ${tone}
Language: ${language}
Return only the final content — no meta commentary, no markdown fences unless useful for structure.`;

  const userPrompt = [
    `Topic / user brief:\n${topic}`,
    extra ? `Extra notes:\n${extra}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { topic, contentType, systemPrompt, userPrompt };
}

async function generateTextViaGoogle(apiKey, systemPrompt, userPrompt, model) {
  const modelId = model || "gemini-2.0-flash";
  const response = await axios({
    method: "post",
    url: `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    timeout: 60000,
    data: {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: { temperature: 0.7 },
    },
  });

  return (
    response.data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("\n")
      ?.trim() || ""
  );
}

async function generateTextViaOpenAICompatible({
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  userPrompt,
}) {
  const root = String(baseUrl || "").replace(/\/+$/, "");
  const response = await axios({
    method: "post",
    url: `${root}/chat/completions`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 60000,
    data: {
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
  });

  return String(response.data?.choices?.[0]?.message?.content || "").trim();
}

async function runTextCandidate(candidate, systemPrompt, userPrompt) {
  if (candidate.engine === "google") {
    return generateTextViaGoogle(
      candidate.apiKey,
      systemPrompt,
      userPrompt,
      candidate.model,
    );
  }

  return generateTextViaOpenAICompatible({
    apiKey: candidate.apiKey,
    baseUrl: candidate.baseUrl,
    model: candidate.model,
    systemPrompt,
    userPrompt,
  });
}

/**
 * Sync text-to-text using providers that have Text-to-Text (txt2txt) enabled.
 * Users still pay app credits.
 * Tries default/active provider first; on quota/429 falls back to the next configured provider (e.g. Grok).
 */
async function generateTextContent(_ignoredProvider, opts = {}) {
  const { topic, systemPrompt, userPrompt } = buildTextPrompts(opts);
  if (!topic) {
    return { status: "error", msg: "Topic or prompt is required" };
  }

  try {
    const {
      listTextToTextProviders,
      pickTxt2txtKey,
      describeTextEngine,
      isQuotaOrRateLimitError,
    } = require("../utils/textToTextProvider");

    const providers = await listTextToTextProviders();
    if (!providers.length) {
      return {
        status: "error",
        msg: "No Text-to-Text provider configured. Enable Text-to-Text on Google or Grok in Admin > AI Providers and add an API key.",
      };
    }

    let lastError = null;

    for (const provider of providers) {
      const apiKey = pickTxt2txtKey(provider);
      if (!apiKey) continue;

      const engine = describeTextEngine(provider);
      try {
        const content = await runTextCandidate(
          {
            engine: engine.engine,
            model: engine.model,
            baseUrl: engine.baseUrl,
            apiKey,
          },
          systemPrompt,
          userPrompt,
        );

        if (!content) {
          lastError = new Error(
            `Empty text response from "${provider.name}"`,
          );
          continue;
        }

        return {
          status: "success",
          data: {
            content,
            provider: provider.name,
            provider_key: provider.provider_key,
            model: engine.model,
          },
        };
      } catch (err) {
        lastError = err;
        const normalized = normalizeError(err);
        console.warn(
          `[txt2txt] ${provider.provider_key} failed:`,
          normalized.message.slice(0, 200),
        );
        // Quota / rate-limit → try next provider (e.g. Google free tier → Grok)
        if (isQuotaOrRateLimitError(err) || isQuotaOrRateLimitError(normalized)) {
          continue;
        }
        // Other errors: still try next provider if available
        continue;
      }
    }

    return {
      status: "error",
      msg: normalizeError(lastError || new Error("All text providers failed"))
        .message,
    };
  } catch (err) {
    return {
      status: "error",
      msg: normalizeError(err).message,
    };
  }
}

// ============================================
// UTILITY: Normalize any error to readable string
// ============================================

function normalizeError(err) {
  if (err.response) {
    const body = err.response.data;
    const bodyStr =
      typeof body === "object"
        ? JSON.stringify(body, null, 2)
        : String(body ?? "");
    return new Error(
      `HTTP ${err.response.status} ${err.response.statusText} — ${bodyStr}`,
    );
  }

  if (err.request) {
    return new Error(`No response received: ${err.message}`);
  }

  return new Error(err.message || String(err));
}

// ============================================
// UTILITY: Safe JSON stringify (handles circular)
// ============================================

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  createJob,
  fetchJobStatus,
  analyzeProductImage,
  generateTextContent,
  getByPath,
  interpolate,
  fromSyncTaskId,
  toSyncTaskId,
  buildAuth,
};

const axios = require("axios");

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

function isKieProvider(provider, prefix) {
  const name = String(provider.name || "").toLowerCase();
  const baseUrl = String(provider[`${prefix}_base_url`] || "").toLowerCase();

  return name.includes("kie") || baseUrl.includes("api.kie.ai");
}

function resolveApiKey(provider, prefix) {
  const featureKey = String(provider[`${prefix}_api_key`] || "").trim();
  if (!isPlaceholderKey(featureKey)) return featureKey;

  const providerKey = String(provider.provider_key || "").trim();
  if (isKieProvider(provider, prefix) && !isPlaceholderKey(providerKey)) {
    return providerKey;
  }

  return featureKey;
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

  assertApiKey(provider, prefix, apiKey);

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

// ============================================
// CORE: Create a job task
// ============================================

async function createJob(provider, type, variables = {}) {
  const baseUrl = provider[`${type}_base_url`];
  const endpoint = provider[`${type}_create_endpoint`];
  const method = (provider[`${type}_create_method`] || "POST").toLowerCase();
  let payloadTemplate = provider[`${type}_create_payload`];
  const jobIdPath = provider[`${type}_job_id_path`];

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
  if (payloadTemplate) {
    try {
      const interpolated = interpolate(payloadTemplate, variables);
      payload = JSON.parse(interpolated);
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

  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await axios({
      method,
      url,
      headers: { "Content-Type": "application/json", ...headers },
      params: queryParams,
      data: method !== "get" ? payload : undefined,
      timeout: 30000,
    });

    // Some APIs return HTTP 200 but error code inside body
    const bodyCode = response.data?.code;
    if (bodyCode !== undefined && bodyCode !== 200) {
      return {
        status: "error",
        msg: response.data?.msg || `API returned code ${bodyCode}`,
      };
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

  // Build endpoint — replace {{taskId}} placeholder
  const endpoint = endpointTemplate.replace(
    "{{taskId}}",
    encodeURIComponent(taskId),
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
    if (bodyCode !== undefined && bodyCode !== 200) {
      return {
        status: "error",
        msg: responseData?.msg || `API returned code ${bodyCode}`,
      };
    }

    const state = getByPath(responseData, statePath);

    if (state === undefined || state === null) {
      return {
        status: "error",
        msg: `Could not read state from path "${statePath}". Response: ${safeStringify(responseData)}`,
      };
    }

    // Normalize to string — handles integer 1 vs string "1", etc.
    const stateStr = String(state);
    const successStr = String(successState);
    const failedStr = String(failedState);

    // ── SUCCESS ──────────────────────────────────────────────────────
    if (stateStr === successStr) {
      const resultValue = getByPath(responseData, resultPath);

      if (!resultValue) {
        return {
          status: "error",
          msg: `Job succeeded but result not found at path "${resultPath}". Response: ${safeStringify(responseData)}`,
        };
      }

      return { status: "success", data: resultValue };
    }

    // ── FAILED state matched ──────────────────────────────────────────
    if (stateStr === failedStr) {
      if (type === "showcase") {
        const errorCode = getByPath(responseData, "data.errorCode");
        const errorMsg =
          getByPath(responseData, "data.errorMessage") ||
          getByPath(responseData, "data.failMsg") ||
          getByPath(responseData, "data.error") ||
          getByPath(responseData, "message") ||
          getByPath(responseData, "msg");

        if (errorCode !== null && errorCode !== undefined) {
          return {
            status: "error",
            msg:
              typeof errorMsg === "object"
                ? safeStringify(errorMsg)
                : String(errorMsg || `Job failed (state: ${state})`),
          };
        }
        return { status: "pending" };
      }

      // All other types (reel, txt2img, img2img) → real failure
      const errorMsg =
        getByPath(responseData, "data.errorMessage") ||
        getByPath(responseData, "data.failMsg") ||
        getByPath(responseData, "data.error") ||
        getByPath(responseData, "message") ||
        getByPath(responseData, "msg");

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

async function analyzeProductImage(provider, imageUrl) {
  let apiKey;
  try {
    apiKey = resolveApiKey(provider, "showcase");
    assertApiKey(provider, "showcase", apiKey);
  } catch {
    apiKey = resolveApiKey(provider, "txt2img");
    assertApiKey(provider, "txt2img", apiKey);
  }

  try {
    const response = await axios({
      method: "post",
      url: "https://api.kie.ai/gemini-2.5-pro/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 45000,
      data: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Analyze this product image for an AI UGC ad. Return only valid JSON with keys: product_type, product_name, product_description, target_audience, influencer_prompt, ad_prompt. The influencer_prompt must describe a photorealistic human influencer suitable for promoting the product. The ad_prompt must describe an 8 second product showcase ad where the influencer naturally presents the exact product with sharp packaging and accurate colors.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      },
    });

    const content =
      response.data?.choices?.[0]?.message?.content ||
      response.data?.choices?.[0]?.delta?.content ||
      response.data?.data?.choices?.[0]?.message?.content;
    const parsed = safeParseJsonText(content);

    if (!parsed) {
      return {
        status: "error",
        msg: `Vision response was not valid JSON: ${safeStringify(response.data)}`,
      };
    }

    return { status: "success", data: parsed };
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
  getByPath,
  interpolate,
};

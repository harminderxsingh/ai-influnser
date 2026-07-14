const { query } = require("../database/connection");

function isTruthyFlag(value) {
  return value === 1 || value === true || value === "1";
}

/**
 * Load an active AI provider for an optional feature.
 * Prefers is_default among providers that have the feature enabled.
 */
async function getActiveProvider(feature = null) {
  try {
    let sql = `SELECT * FROM ai_providers WHERE is_active = 1`;
    const params = [];

    if (feature) {
      // Only providers that actually have this feature ON
      sql += ` AND ${feature}_enabled = 1`;
    }

    // Images: prefer Grok (fast sync). Talking: prefer D-ID lip-sync (seconds, not minutes).
    const imageFeature = feature === "txt2img" || feature === "img2img";
    const talkingFeature = feature === "talking";
    sql += ` ORDER BY ${
      imageFeature
        ? `CASE WHEN provider_key = 'xai_grok' THEN 0 ELSE 1 END, is_default DESC`
        : talkingFeature
          ? `CASE
        WHEN provider_key = 'd_id' THEN 0
        WHEN provider_key = 'xai_grok' THEN 1
        WHEN provider_key = 'google' THEN 3
        ELSE 2
      END, is_default DESC`
          : `is_default DESC,
      CASE
        WHEN provider_key = 'xai_grok' THEN 0
        WHEN provider_key = 'google' THEN 2
        ELSE 1
      END`
    },
      id ASC
      LIMIT 1`;

    const rows = await query(sql, params);
    const data = Array.isArray(rows) ? rows[0] : rows;
    if (!data) return null;

    if (feature && !isTruthyFlag(data[`${feature}_enabled`])) {
      return null;
    }

    return data;
  } catch (err) {
    console.warn("getActiveProvider failed:", err.message);
    return null;
  }
}

async function getProviderByKey(providerKey) {
  try {
    const rows = await query(
      `SELECT * FROM ai_providers WHERE provider_key = ? LIMIT 1`,
      [providerKey],
    );
    return (Array.isArray(rows) ? rows[0] : rows) || null;
  } catch {
    return null;
  }
}

function isFeatureEnabled(provider, feature) {
  if (!provider || !feature) return false;
  return isTruthyFlag(provider[`${feature}_enabled`]);
}

module.exports = {
  getActiveProvider,
  getProviderByKey,
  isFeatureEnabled,
  isTruthyFlag,
};

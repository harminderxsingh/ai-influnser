const router = require("express").Router();
const { query } = require("../database/connection.js");
const adminValidator = require("../middlewares/admin.js");

const FEATURES = ["txt2img", "img2img", "reel", "showcase", "talking", "txt2txt"];
const API_KEY_PLACEHOLDERS = new Set(["", "YOUR_API_KEY", "YOUR_VSK_KEY"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function isMissingApiKey(value) {
  return API_KEY_PLACEHOLDERS.has(String(value || "").trim());
}

function validateEnabledFeatures(body, { forUpdate = false, existing = null } = {}) {
  for (const f of FEATURES) {
    if (!body[`${f}_enabled`]) continue;

    if (!cleanString(body[`${f}_base_url`])) {
      return `${f} Base URL is required`;
    }

    if (isMissingApiKey(body[`${f}_api_key`])) {
      const authType = cleanString(body[`${f}_auth_type`]) || "bearer";
      // No-auth providers (e.g. Pollinations free image)
      if (authType !== "none" && authType !== "no_auth") {
        // On update, empty key means "keep existing" — only fail if DB also has none
        const existingKey = existing?.[`${f}_api_key`];
        if (!(forUpdate && !isMissingApiKey(existingKey))) {
          return `${f} API Key is required`;
        }
      }
    }

    if (!cleanString(body[`${f}_create_endpoint`])) {
      return `${f} create endpoint is required`;
    }
  }

  return null;
}

function buildFeatureFields(body, forUpdate = false) {
  const cols = [];
  const vals = [];

  FEATURES.forEach((f) => {
    const fields = [
      [`${f}_enabled`, body[`${f}_enabled`] ? 1 : 0],
      [`${f}_base_url`, cleanString(body[`${f}_base_url`]) || null],
      [`${f}_api_key`, cleanString(body[`${f}_api_key`]) || null],
      [`${f}_auth_type`, cleanString(body[`${f}_auth_type`]) || "bearer"],
      [
        `${f}_auth_header_key`,
        cleanString(body[`${f}_auth_header_key`]) || "Authorization",
      ],
      [
        `${f}_auth_header_prefix`,
        cleanString(body[`${f}_auth_header_prefix`]) || "Bearer",
      ],
      [`${f}_auth_body_key`, cleanString(body[`${f}_auth_body_key`]) || null],
      [`${f}_auth_query_key`, cleanString(body[`${f}_auth_query_key`]) || null],
      [`${f}_create_endpoint`, cleanString(body[`${f}_create_endpoint`]) || null],
      [`${f}_create_method`, cleanString(body[`${f}_create_method`]) || "POST"],
      [
        `${f}_create_payload`,
        body[`${f}_create_payload`]
          ? JSON.stringify(body[`${f}_create_payload`])
          : null,
      ],
      [`${f}_job_id_path`, body[`${f}_job_id_path`] || "data.taskId"],
      [`${f}_status_endpoint`, body[`${f}_status_endpoint`] || null],
      [`${f}_status_method`, body[`${f}_status_method`] || "GET"],
      [`${f}_state_path`, body[`${f}_state_path`] || "data.state"],
      [`${f}_success_state`, body[`${f}_success_state`] || "success"],
      [`${f}_failed_state`, body[`${f}_failed_state`] || "fail"],
      [`${f}_result_path`, body[`${f}_result_path`] || null],
    ];

    fields.forEach(([col, val]) => {
      // On update, skip empty API keys so existing secrets are preserved
      if (
        forUpdate &&
        col === `${f}_api_key` &&
        isMissingApiKey(body[`${f}_api_key`])
      ) {
        return;
      }
      forUpdate ? cols.push(`${col} = ?`) : cols.push(col);
      vals.push(val);
    });
  });

  return { cols, vals };
}

// ── GET ALL ──
router.get("/get_providers", adminValidator, async (req, res) => {
  try {
    const providers = await query(
      `SELECT * FROM ai_providers ORDER BY created_at DESC`,
      [],
    );
    res.json({ success: true, data: providers });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", data: [] });
  }
});

// ── GET ONE ──
router.get("/get_provider/:id", adminValidator, async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM ai_providers WHERE id = ?`, [
      req.params.id,
    ]);
    if (!rows.length)
      return res.json({ success: false, msg: "Provider not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ── ADD ──
router.post("/add_provider", adminValidator, async (req, res) => {
  try {
    const { name, provider_key, is_default } = req.body;

    if (!name?.trim())
      return res.json({ success: false, msg: "Provider Name is required" });
    if (!provider_key?.trim())
      return res.json({ success: false, msg: "Provider Key is required" });

    // at least one feature must be enabled with base_url + api_key
    const hasFeature = FEATURES.some((f) => req.body[`${f}_enabled`]);
    if (!hasFeature) {
      return res.json({
        success: false,
        msg: "Enable and configure at least one feature",
      });
    }

    if (!/^[a-z0-9_]+$/.test(provider_key)) {
      const looksLikeApiKey =
        provider_key.length > 24 ||
        /^(xai-|sk-|AIza|Bearer\s)/i.test(provider_key);

      return res.json({
        success: false,
        msg: looksLikeApiKey
          ? "That looks like an API key. Provider Key is only a short ID (e.g. xai_grok). Paste your API key in each feature's API Key field below."
          : "Provider Key must be lowercase letters, numbers and underscores only (e.g. xai_grok)",
      });
    }

    const validationError = validateEnabledFeatures(req.body);
    if (validationError) {
      return res.json({ success: false, msg: validationError });
    }

    const existing = await query(
      `SELECT id FROM ai_providers WHERE provider_key = ?`,
      [provider_key],
    );
    if (existing.length) {
      return res.json({
        success: false,
        msg: `Provider key "${provider_key}" already exists`,
      });
    }

    if (is_default) {
      await query(`UPDATE ai_providers SET is_default = 0`, []);
    }

    const { cols, vals } = buildFeatureFields(req.body);

    const baseCols = ["name", "provider_key", "is_default"];
    const baseVals = [name.trim(), provider_key.trim(), is_default ? 1 : 0];

    const allCols = [...baseCols, ...cols];
    const allVals = [...baseVals, ...vals];
    const placeholders = allCols.map(() => "?").join(", ");

    await query(
      `INSERT INTO ai_providers (${allCols.join(", ")}) VALUES (${placeholders})`,
      allVals,
    );

    res.json({ success: true, msg: "Provider added successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ── UPDATE ──
router.post("/update_provider", adminValidator, async (req, res) => {
  try {
    const { id, name, is_active, is_default } = req.body;

    if (!id)
      return res.json({ success: false, msg: "Provider ID is required" });
    if (!name?.trim())
      return res.json({ success: false, msg: "Provider Name is required" });

    const existing = await query(`SELECT * FROM ai_providers WHERE id = ?`, [
      id,
    ]);
    if (!existing.length)
      return res.json({ success: false, msg: "Provider not found" });

    const validationError = validateEnabledFeatures(req.body, {
      forUpdate: true,
      existing: existing[0],
    });
    if (validationError) {
      return res.json({ success: false, msg: validationError });
    }

    if (is_default) {
      await query(`UPDATE ai_providers SET is_default = 0`, []);
    }

    const { cols, vals } = buildFeatureFields(req.body, true);

    const baseCols = ["name = ?", "is_active = ?", "is_default = ?"];
    const baseVals = [name.trim(), is_active ? 1 : 0, is_default ? 1 : 0];

    const allSets = [...baseCols, ...cols];
    const allVals = [...baseVals, ...vals, id];

    await query(
      `UPDATE ai_providers SET ${allSets.join(", ")} WHERE id = ?`,
      allVals,
    );

    res.json({ success: true, msg: "Provider updated successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});
// ── DELETE ──
router.post("/delete_provider", adminValidator, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.json({
        success: false,
        msg: "Provider ID is required",
      });
    }

    const existing = await query(
      `SELECT id, provider_key FROM ai_providers WHERE id = ?`,
      [id],
    );

    if (!existing.length) {
      return res.json({
        success: false,
        msg: "Provider not found",
      });
    }

    const providerKey = existing[0]?.provider_key;

    // protected seeded providers
    if (providerKey === "google" || providerKey === "xai_grok") {
      return res.json({
        success: false,
        msg: "This provider cannot be deleted",
      });
    }

    await query(`DELETE FROM ai_providers WHERE id = ?`, [id]);

    res.json({
      success: true,
      msg: "Provider deleted successfully",
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,
      msg: "Something went wrong",
    });
  }
});

// ── TOGGLE ACTIVE ──
router.post("/toggle_provider", adminValidator, async (req, res) => {
  try {
    const { id, is_active } = req.body;
    if (!id)
      return res.json({ success: false, msg: "Provider ID is required" });

    const existing = await query(
      `SELECT id, name FROM ai_providers WHERE id = ?`,
      [id],
    );
    if (!existing.length)
      return res.json({ success: false, msg: "Provider not found" });

    if (is_active) {
      // Activating a provider also makes it the default so jobs use it
      await query(`UPDATE ai_providers SET is_default = 0`);
      await query(
        `UPDATE ai_providers SET is_active = 1, is_default = 1 WHERE id = ?`,
        [id],
      );
    } else {
      await query(
        `UPDATE ai_providers SET is_active = 0, is_default = 0 WHERE id = ?`,
        [id],
      );
    }

    res.json({
      success: true,
      msg: is_active
        ? `"${existing[0].name}" is now active and default`
        : "Status updated successfully",
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ── SWITCH / USE THIS PROVIDER (activate + set default) ──
router.post("/switch_provider", adminValidator, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id)
      return res.json({ success: false, msg: "Provider ID is required" });

    const existing = await query(`SELECT id, name FROM ai_providers WHERE id = ?`, [
      id,
    ]);
    if (!existing.length)
      return res.json({ success: false, msg: "Provider not found" });

    await query(`UPDATE ai_providers SET is_default = 0`, []);
    await query(
      `UPDATE ai_providers SET is_active = 1, is_default = 1 WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      msg: `"${existing[0].name}" is now the active default provider`,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

module.exports = router;

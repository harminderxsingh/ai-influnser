const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");

// ── POST /api/talking/add_new_task ────────────────────────────
router.post("/add_new_task", validateUser, checkPlan, async (req, res) => {
  try {
    const {
      selectedModel,
      text,
      voice = "en-US-AriaNeural",
      lang = "en-US",
      gender = "female",
      voice_style = "general",
      project_style = "close_up",
      aspect_ratio = "9:16",
      character_style = "realistic",
    } = req.body;

    if (!selectedModel?.photo_url) {
      return res.json({ success: false, msg: "Please select an influencer" });
    }
    if (!text?.trim()) {
      return res.json({ success: false, msg: "Please enter a script/text" });
    }

    const imageUrl = selectedModel.photo_url;

    await query(
      `INSERT INTO talking_content 
        (uid, model, image_url, text, voice, lang, gender, voice_style, project_style, aspect_ratio, character_style, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.decode.uid,
        JSON.stringify(selectedModel),
        imageUrl,
        text.trim(),
        voice,
        lang,
        gender,
        voice_style,
        project_style,
        aspect_ratio,
        character_style,
        "processing",
      ],
    );

    res.json({ success: true, msg: "Your talking video is being generated!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ── GET /api/talking/get_all ──────────────────────────────────
router.get("/get_all", validateUser, checkPlan, async (req, res) => {
  try {
    const data = await query(
      `SELECT * FROM talking_content WHERE uid = ? ORDER BY created_at DESC`,
      [req.decode.uid],
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ── POST /api/talking/del_one ─────────────────────────────────
router.post("/del_one", validateUser, checkPlan, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM talking_content WHERE id = ? AND uid = ?`, [
      id,
      req.decode.uid,
    ]);
    res.json({ success: true, msg: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ── GET /api/talking/tts/languages ────────────────────────────
router.get("/tts/languages", validateUser, async (req, res) => {
  try {
    const axios = require("axios");

    // Get the Usevelix provider API key from your ai_providers table
    const providers = await query(
      `SELECT * FROM ai_providers WHERE provider_key = ? LIMIT 1`,
      ["usevelix"],
    );

    if (!providers.length) {
      return res.json({
        success: false,
        error: "Usevelix provider not configured",
        languages: [],
      });
    }

    const apiKey = providers[0].talking_api_key;

    if (!apiKey) {
      return res.json({
        success: false,
        error: "No API key found for Usevelix",
        languages: [],
      });
    }

    // Hit Usevelix external server
    const response = await axios.get(
      "https://usevelix.com/api/v1/tts/languages",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        timeout: 15000,
      },
    );

    // Response is already {success, total, languages:[{code,name}]}
    // Just pass languages straight through — no mapping needed
    return res.json({
      success: true,
      languages: response.data.languages || [],
    });
  } catch (err) {
    console.error("[TTS Languages Error]", err.message);
    return res.json({ success: false, error: err.message, languages: [] });
  }
});

// ── GET /api/talking/tts/voices?lang=en-US&gender=female ──────
router.get("/tts/voices", validateUser, async (req, res) => {
  try {
    const axios = require("axios");
    const { lang, gender } = req.query;

    if (!lang) {
      return res.json({
        success: false,
        error: "lang param is required",
        voices: [],
      });
    }

    const providers = await query(
      `SELECT * FROM ai_providers WHERE provider_key = 'usevelix' LIMIT 1`,
    );

    if (!providers.length) {
      return res.json({
        success: false,
        error: "Usevelix provider not configured",
        voices: [],
      });
    }

    const apiKey =
      providers[0].talking_api_key ||
      providers[0].txt2img_api_key ||
      providers[0].api_key;

    if (!apiKey) {
      return res.json({
        success: false,
        error: "No API key found for Usevelix",
        voices: [],
      });
    }

    // Build params — pass gender only if not "all"
    const params = new URLSearchParams({ lang });
    if (gender && gender !== "all") params.append("gender", gender);

    // Hit Usevelix external server
    const response = await axios.get(
      `https://usevelix.com/api/v1/tts/voices?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        timeout: 15000,
      },
    );

    // Response is already {success, lang, gender, total, voices:[...]}
    // Pass voices straight through — no mapping needed
    return res.json({
      success: true,
      voices: response.data.voices || [],
    });
  } catch (err) {
    console.error("[TTS Voices Error]", err.message);
    return res.json({ success: false, error: err.message, voices: [] });
  }
});

module.exports = router;

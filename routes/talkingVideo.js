const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const { normalizeSubmissionKey } = require("../utils/submissionKey");

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
      submission_key,
    } = req.body;
    const submissionKey = normalizeSubmissionKey(submission_key);
    const uid = req.decode.uid;

    if (!selectedModel?.photo_url) {
      return res.json({ success: false, msg: "Please select an influencer" });
    }
    if (!text?.trim()) {
      return res.json({ success: false, msg: "Please enter a script/text" });
    }

    const imageUrl = selectedModel.photo_url;
    const modelJson = JSON.stringify(selectedModel);
    const trimmedText = text.trim();

    if (submissionKey) {
      const [existing] = await query(
        `SELECT id FROM talking_content WHERE uid = ? AND submission_key = ?`,
        [uid, submissionKey],
      );

      if (existing) {
        return res.json({
          success: true,
          msg: "Your talking video is already being generated!",
          id: existing.id,
        });
      }
    }

    const [recentDuplicate] = await query(
      `SELECT id FROM talking_content
       WHERE uid = ?
         AND model = ?
         AND text = ?
         AND status IN ('processing', 'submitting')
         AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
       ORDER BY id DESC
       LIMIT 1`,
      [uid, modelJson, trimmedText],
    );

    if (recentDuplicate) {
      return res.json({
        success: true,
        msg: "Your talking video is already being generated!",
        id: recentDuplicate.id,
      });
    }

    try {
      const insertResult = await query(
        `INSERT INTO talking_content 
        (uid, model, image_url, text, voice, lang, gender, voice_style, project_style, aspect_ratio, character_style, status, submission_key)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          uid,
          modelJson,
          imageUrl,
          trimmedText,
          voice,
          lang,
          gender,
          voice_style,
          project_style,
          aspect_ratio,
          character_style,
          "processing",
          submissionKey,
        ],
      );

      const newId = insertResult.insertId;
      const { triggerTalkingVideo } = require("../loops/talkingVideo");
      // Fire-and-forget start so reply begins immediately (don't block response too long)
      let triggerResult = null;
      try {
        triggerResult = await triggerTalkingVideo(newId);
      } catch (err) {
        console.warn("triggerTalkingVideo:", err.message);
      }

      return res.json({
        success: true,
        msg: "Your talking reply is being generated!",
        id: newId,
        status: triggerResult?.status || "processing",
        job_id: triggerResult?.job_id || null,
        data: {
          id: newId,
          uid,
          model: modelJson,
          image_url: imageUrl,
          text: trimmedText,
          status: "processing",
          generated_video: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    } catch (insertErr) {
      if (insertErr.code === "ER_DUP_ENTRY") {
        const [existing] = await query(
          `SELECT id FROM talking_content WHERE uid = ? AND submission_key = ?`,
          [uid, submissionKey],
        );

        return res.json({
          success: true,
          msg: "Your talking video is already being generated!",
          id: existing?.id,
        });
      }

      throw insertErr;
    }
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
    const { getActiveProvider } = require("../utils/aiProvider");

    const provider = await getActiveProvider("talking");
    if (!provider) {
      return res.json({
        success: false,
        error: "No active talking provider configured",
        languages: [],
      });
    }

    const apiKey = provider.talking_api_key;
    const baseUrl = String(provider.talking_base_url || "").replace(/\/$/, "");

    if (!apiKey || !baseUrl) {
      return res.json({
        success: false,
        error: "Talking provider API key / base URL missing",
        languages: [],
      });
    }

    const response = await axios.get(`${baseUrl}/api/v1/tts/languages`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      timeout: 15000,
    });

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
    const { getActiveProvider } = require("../utils/aiProvider");
    const { lang, gender } = req.query;

    if (!lang) {
      return res.json({
        success: false,
        error: "lang param is required",
        voices: [],
      });
    }

    const provider = await getActiveProvider("talking");
    if (!provider) {
      return res.json({
        success: false,
        error: "No active talking provider configured",
        voices: [],
      });
    }

    const apiKey =
      provider.talking_api_key ||
      provider.txt2img_api_key ||
      provider.api_key;
    const baseUrl = String(provider.talking_base_url || "").replace(/\/$/, "");

    if (!apiKey || !baseUrl) {
      return res.json({
        success: false,
        error: "Talking provider API key / base URL missing",
        voices: [],
      });
    }

    const params = new URLSearchParams({ lang });
    if (gender && gender !== "all") params.append("gender", gender);

    const response = await axios.get(
      `${baseUrl}/api/v1/tts/voices?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        timeout: 15000,
      },
    );

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

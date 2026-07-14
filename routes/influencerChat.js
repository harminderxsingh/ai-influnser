const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const { generateTextContent } = require("../loops/api");

const MAX_MESSAGE = 500;
const HISTORY_LIMIT = 16;

function mediaSrc(photo) {
  if (!photo) return "";
  if (String(photo).startsWith("http") || String(photo).startsWith("data:")) {
    return photo;
  }
  return `/media/${photo}`;
}

function buildPersonaPrompt(inf) {
  const name = inf.name || "Influencer";
  const desc = String(inf.description || "").trim();
  const look = String(inf.prompt || "").trim().slice(0, 400);

  return `You are ${name}, a social-media influencer chatting privately with a fan.
Stay fully in character as ${name} — first person, warm, natural, short replies (1–4 sentences).
Do not write scripts, stage directions, or video descriptions.
Do not say you are an AI unless the user asks directly.
${desc ? `Bio: ${desc}` : ""}
${look ? `Appearance / vibe: ${look}` : ""}
Match the user's language (Hindi, English, Hinglish, etc.).`;
}

// ── GET /api/inf-chat/messages?influencer_id= ─────────────────
router.get("/messages", validateUser, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const influencerId = parseInt(req.query.influencer_id, 10);
    if (!influencerId) {
      return res.json({ success: false, msg: "influencer_id required" });
    }

    const [inf] = await query(
      `SELECT id FROM influencers WHERE id = ? AND uid = ? LIMIT 1`,
      [influencerId, uid],
    );
    if (!inf) {
      return res.json({ success: false, msg: "Influencer not found" });
    }

    const rows = await query(
      `SELECT id, role, message, created_at
       FROM influencer_chat_messages
       WHERE uid = ? AND influencer_id = ?
       ORDER BY id ASC
       LIMIT 200`,
      [uid, influencerId],
    );

    return res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.error("inf-chat messages:", err.message);
    return res.json({ success: false, msg: err.message });
  }
});

// ── POST /api/inf-chat/send ──────────────────────────────────
router.post("/send", validateUser, checkPlan, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const influencerId = parseInt(req.body.influencer_id, 10);
    const text = String(req.body.message || "").trim();

    if (!influencerId) {
      return res.json({ success: false, msg: "Select an influencer first" });
    }
    if (!text) {
      return res.json({ success: false, msg: "Type a message" });
    }
    if (text.length > MAX_MESSAGE) {
      return res.json({
        success: false,
        msg: `Keep messages under ${MAX_MESSAGE} characters`,
      });
    }

    const [inf] = await query(
      `SELECT id, name, description, prompt, photo_url, status
       FROM influencers WHERE id = ? AND uid = ? LIMIT 1`,
      [influencerId, uid],
    );

    if (!inf || inf.status !== "active") {
      return res.json({
        success: false,
        msg: "Influencer not ready — pick an active one",
      });
    }

    const userInsert = await query(
      `INSERT INTO influencer_chat_messages (uid, influencer_id, role, message)
       VALUES (?,?, 'user', ?)`,
      [uid, influencerId, text],
    );

    const history = await query(
      `SELECT role, message FROM influencer_chat_messages
       WHERE uid = ? AND influencer_id = ?
       ORDER BY id DESC
       LIMIT ${HISTORY_LIMIT}`,
      [uid, influencerId],
    );

    const chronological = (history || []).slice().reverse();
    const transcript = chronological
      .map((m) => `${m.role === "user" ? "Fan" : inf.name}: ${m.message}`)
      .join("\n");

    const result = await generateTextContent(null, {
      topic: text,
      systemPrompt: buildPersonaPrompt(inf),
      userPrompt: `Conversation so far:\n${transcript}\n\nReply as ${inf.name} to the fan's latest message only. No prefix like "${inf.name}:".`,
    });

    if (result.status !== "success" || !result.data?.content) {
      await query(`DELETE FROM influencer_chat_messages WHERE id = ?`, [
        userInsert.insertId,
      ]);
      return res.json({
        success: false,
        msg: result.msg || "Chat reply failed — check Text-to-Text provider",
      });
    }

    let reply = String(result.data.content).trim();
    // Strip accidental "Name:" prefix
    const namePrefix = new RegExp(`^${inf.name}\\s*:\\s*`, "i");
    reply = reply.replace(namePrefix, "").trim();

    const insert = await query(
      `INSERT INTO influencer_chat_messages (uid, influencer_id, role, message)
       VALUES (?,?, 'assistant', ?)`,
      [uid, influencerId, reply],
    );

    return res.json({
      success: true,
      data: {
        user: { role: "user", message: text },
        assistant: {
          id: insert.insertId,
          role: "assistant",
          message: reply,
          created_at: new Date().toISOString(),
        },
        influencer: {
          id: inf.id,
          name: inf.name,
          photo_url: mediaSrc(inf.photo_url),
        },
      },
    });
  } catch (err) {
    console.error("inf-chat send:", err.message);
    return res.json({ success: false, msg: err.message });
  }
});

// ── DELETE /api/inf-chat/clear ───────────────────────────────
router.post("/clear", validateUser, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const influencerId = parseInt(req.body.influencer_id, 10);
    if (!influencerId) {
      return res.json({ success: false, msg: "influencer_id required" });
    }

    await query(
      `DELETE FROM influencer_chat_messages WHERE uid = ? AND influencer_id = ?`,
      [uid, influencerId],
    );

    return res.json({ success: true, msg: "Chat cleared" });
  } catch (err) {
    return res.json({ success: false, msg: err.message });
  }
});

module.exports = router;

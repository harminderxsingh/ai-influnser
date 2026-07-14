const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const { logUsage } = require("../utils/common");
const { generateTextContent } = require("../loops/api");
const { getActiveProvider } = require("../utils/aiProvider");

const CONTENT_TYPES = [
  {
    id: "caption",
    label: "Social Caption",
    suggestions: [
      "Write an Instagram caption for a new skincare launch targeting Gen Z",
      "Create a friendly Facebook post announcing a weekend sale with urgency",
      "Caption for a lifestyle photo promoting morning coffee routine",
      "Engaging caption for a fitness transformation post with motivation",
    ],
  },
  {
    id: "reel_script",
    label: "Reel / TikTok Script",
    suggestions: [
      "15-second hook script explaining why our product is better than alternatives",
      "TikTok script: day-in-the-life using our productivity app",
      "Viral reel script with problem → solution → CTA structure for a beauty brand",
      "Before/after reveal script for a home cleaning product",
    ],
  },
  {
    id: "blog",
    label: "Blog Post",
    suggestions: [
      "Blog post: 5 tips to grow Instagram organically in 2026",
      "How-to guide for first-time online sellers setting up a store",
      "Listicle: best tools for AI content creators this year",
      "Thought leadership article on authentic UGC vs polished ads",
    ],
  },
  {
    id: "product_desc",
    label: "Product Description",
    suggestions: [
      "Product description for a wireless noise-cancelling headphone aimed at travelers",
      "E-commerce description for organic face serum with vitamin C",
      "Amazon-style listing copy for a portable blender",
      "Luxury product description for a handmade leather wallet",
    ],
  },
  {
    id: "email",
    label: "Marketing Email",
    suggestions: [
      "Welcome email for new subscribers of a fashion brand",
      "Abandoned cart email with a soft discount CTA",
      "Product launch announcement email for a new AI tool",
      "Weekly newsletter intro about creator economy trends",
    ],
  },
  {
    id: "ad_copy",
    label: "Ad Copy",
    suggestions: [
      "Facebook/Instagram ad copy for a meal kit subscription",
      "Google search ad headlines and descriptions for online tutoring",
      "Short paid ad variants for a Black Friday flash sale",
      "Retargeting ad copy for users who viewed a product but did not buy",
    ],
  },
  {
    id: "youtube",
    label: "YouTube Description",
    suggestions: [
      "YouTube description for a tutorial on editing Reels in CapCut",
      "Description + title ideas for a product unboxing video",
      "SEO-friendly YouTube description for an AI tools review",
      "Description for a vlog about building a personal brand",
    ],
  },
  {
    id: "talking_script",
    label: "Talking Video Script",
    suggestions: [
      "30-second talking script recommending a skincare routine",
      "Friendly influencer script pitching a SaaS free trial",
      "Honest review style script for wireless earbuds",
      "Motivational talking script about consistency for creators",
    ],
  },
];

async function getCreditFee() {
  const [web] = await query(`SELECT text_content_maker FROM web_private`);
  return parseInt(web?.text_content_maker || 3, 10);
}

async function reserveCredits(uid, fee) {
  const result = await query(
    `UPDATE user SET credits = credits - ? WHERE uid = ? AND credits >= ?`,
    [fee, uid, fee],
  );
  return result.affectedRows > 0;
}

async function refundCredits(uid, fee) {
  await query(`UPDATE user SET credits = credits + ? WHERE uid = ?`, [
    fee,
    uid,
  ]);
}

router.get("/suggestions", validateUser, async (req, res) => {
  try {
    const fee = await getCreditFee();
    res.json({ success: true, data: CONTENT_TYPES, credits: fee });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", data: [] });
  }
});

router.get("/get_all", validateUser, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, content_type, topic, tone, language, result, credits, status, createdAt
       FROM text_content WHERE uid = ? ORDER BY id DESC LIMIT 100`,
      [req.decode.uid],
    );
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", data: [] });
  }
});

router.post("/generate", validateUser, checkPlan, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const topic = String(req.body.topic || "").trim();
    const contentType = String(req.body.contentType || "caption").trim();
    const tone = String(req.body.tone || "engaging").trim();
    const language = String(req.body.language || "English").trim();
    const extra = String(req.body.extra || "").trim();

    if (!topic) {
      return res.json({ success: false, msg: "Please enter your topic or words" });
    }

    if (!CONTENT_TYPES.some((t) => t.id === contentType)) {
      return res.json({ success: false, msg: "Invalid content type" });
    }

    const fee = await getCreditFee();
    const reserved = await reserveCredits(uid, fee);
    if (!reserved) {
      return res.json({
        success: false,
        msg: "Not enough credits",
        creditsNeeded: fee,
      });
    }

    await logUsage({
      uid,
      task: "text_content_maker",
      credits: fee,
      status: "reserved",
      des: `Text content (${contentType})`,
    });

    const provider = await getActiveProvider("txt2txt");
    // generateTextContent picks default/active txt2txt; on Google quota 429 it falls back (e.g. Grok)
    const result = await generateTextContent(provider, {
      topic,
      contentType,
      tone,
      language,
      extra,
    });

    if (result.status !== "success") {
      await refundCredits(uid, fee);
      await logUsage({
        uid,
        task: "text_content_maker",
        credits: fee,
        status: "refunded",
        des: result.msg || "Text generation failed",
      });
      await query(
        `INSERT INTO text_content
          (uid, content_type, topic, tone, language, extra, result, credits, status, error_msg)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'error', ?)`,
        [
          uid,
          contentType,
          topic,
          tone,
          language,
          extra || null,
          null,
          fee,
          result.msg || "Generation failed",
        ],
      );
      return res.json({
        success: false,
        msg: result.msg || "Content generation failed",
      });
    }

    const insert = await query(
      `INSERT INTO text_content
        (uid, content_type, topic, tone, language, extra, result, credits, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'success')`,
      [
        uid,
        contentType,
        topic,
        tone,
        language,
        extra || null,
        result.data.content,
        fee,
      ],
    );

    await logUsage({
      uid,
      task: "text_content_maker",
      credits: fee,
      status: "success",
      des: `Text content (${contentType})`,
    });

    res.json({
      success: true,
      msg: "Content generated",
      data: {
        id: insert.insertId,
        content: result.data.content,
        contentType,
        topic,
        credits: fee,
        provider: result.data.provider || provider?.name || "Text model",
        provider_key: result.data.provider_key || provider?.provider_key || "",
        tier: result.data.tier || "",
        model: result.data.model || "",
      },
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

router.post("/delete", validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, msg: "ID required" });

    await query(`DELETE FROM text_content WHERE id = ? AND uid = ?`, [
      id,
      req.decode.uid,
    ]);
    res.json({ success: true, msg: "Deleted" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

module.exports = router;

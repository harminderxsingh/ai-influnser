const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const { logUsage } = require("../utils/common");

const VALID_TYPES = new Set(["product_showcase", "influencer"]);

async function getCreditFee() {
  const [web] = await query(`SELECT prompt_recommend_maker FROM web_private`);
  return parseInt(web?.prompt_recommend_maker || 5);
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

function cleanText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function compactPrompt(value) {
  return cleanText(value).replace(/\s+/g, " ");
}

function productShowcasePrompts(context = {}) {
  const modelName = cleanText(context.modelName, "the influencer");
  const productName = cleanText(
    context.productName,
    cleanText(context.productImageName, "the product"),
  );
  const aspectRatio = cleanText(context.aspectRatio, "9:16");
  const seed = compactPrompt(context.promptSeed);
  const seedLine = seed ? ` Keep this direction in mind: ${seed}` : "";

  return [
    {
      title: "Natural Product Demo",
      prompt: `${modelName} presents ${productName} in a natural, friendly way. Show the product clearly, highlight the main benefit, and end with a confident recommendation.${seedLine} Make the video polished, realistic, and suitable for ${aspectRatio}.`,
    },
    {
      title: "Problem Solution Hook",
      prompt: `${modelName} starts by mentioning a common customer problem, then shows how ${productName} solves it. Keep the delivery simple, trustworthy, and focused on why viewers should try it.${seedLine}`,
    },
    {
      title: "Premium Lifestyle Ad",
      prompt: `${modelName} showcases ${productName} like a premium lifestyle ad. Use confident body language, clean product framing, elegant pacing, and a clear call to action.${seedLine}`,
    },
    {
      title: "Social Proof Style",
      prompt: `${modelName} talks about ${productName} as if recommending it to a friend after using it. Mention the product naturally, explain the key advantage, and make the scene feel authentic.${seedLine}`,
    },
    {
      title: "Short Viral Pitch",
      prompt: `${modelName} gives a short viral-style pitch for ${productName}. Start with a strong hook, show the product, mention one memorable benefit, and finish with an energetic call to action.${seedLine}`,
    },
  ];
}

function influencerPrompts(context = {}) {
  const name = cleanText(context.name, "A unique AI influencer");
  const description = compactPrompt(context.description);
  const seed = compactPrompt(context.promptSeed);
  const base = description || seed || "modern, confident, and brand-friendly";

  return [
    {
      title: "Photorealistic Brand Ambassador",
      prompt: `${name}, a photorealistic AI influencer with a ${base} personality. Full body portrait, stylish outfit, natural pose, studio lighting, premium commercial look, sharp facial details, realistic skin texture, 8K quality.`,
    },
    {
      title: "Lifestyle Creator",
      prompt: `${name}, a lifestyle content creator who feels approachable and trustworthy. ${base}. Natural smile, modern clothing, clean background, social media profile photo style, realistic proportions, high-end photography.`,
    },
    {
      title: "Luxury Fashion Persona",
      prompt: `${name}, a luxury fashion influencer with confident posture and elegant styling. ${base}. Editorial photoshoot, refined clothing, soft cinematic lighting, detailed face, realistic hands, premium brand campaign style.`,
    },
    {
      title: "Friendly Product Presenter",
      prompt: `${name}, a friendly influencer designed for product promotions. ${base}. Warm expression, clean appearance, neutral background, professional lighting, realistic human features, commercial-ready portrait.`,
    },
    {
      title: "Modern Social Media Star",
      prompt: `${name}, a modern social media personality with strong visual identity. ${base}. Trendy outfit, confident expression, vibrant but clean composition, photorealistic style, high-resolution influencer portrait.`,
    },
  ];
}

function buildRecommendations(type, context) {
  if (type === "product_showcase") return productShowcasePrompts(context);
  if (type === "influencer") return influencerPrompts(context);
  return [];
}

router.post("/generate", validateUser, checkPlan, async (req, res) => {
  const uid = req.decode.uid;
  const { type, source_id, context = {} } = req.body || {};

  if (!VALID_TYPES.has(type)) {
    return res.json({
      success: false,
      msg: "Invalid recommendation type",
    });
  }

  const fee = await getCreditFee();
  if (fee < 1) {
    return res.json({
      success: false,
      msg: "Prompt recommendation fee is not configured",
    });
  }

  const reserved = await reserveCredits(uid, fee);
  if (!reserved) {
    await logUsage({
      uid,
      task: "prompt_recommend_maker",
      credits: fee,
      status: "error",
      des: `Prompt recommendation skipped for ${type} - insufficient credits`,
    });

    return res.json({
      success: false,
      msg: `Insufficient credits. You need ${fee} credits to generate prompt ideas.`,
      credits: fee,
    });
  }

  try {
    const prompts = buildRecommendations(type, context);
    if (!prompts.length) {
      throw new Error("No prompt recommendations could be generated");
    }

    const inputJson = JSON.stringify({
      type,
      source_id: source_id || null,
      context,
    });
    const promptsJson = JSON.stringify(prompts);

    const result = await query(
      `INSERT INTO prompt_recommendations
        (uid, type, source_id, input, prompts, credits, status)
       VALUES (?,?,?,?,?,?,?)`,
      [
        uid,
        type,
        source_id || null,
        inputJson,
        promptsJson,
        String(fee),
        "success",
      ],
    );

    await logUsage({
      uid,
      task: "prompt_recommend_maker",
      credits: fee,
      status: "success",
      des: `Generated ${prompts.length} ${type} prompt recommendations`,
    });

    return res.json({
      success: true,
      msg: "Prompt ideas generated",
      prompts,
      credits: fee,
      id: result.insertId,
    });
  } catch (err) {
    await refundCredits(uid, fee);
    await query(
      `INSERT INTO prompt_recommendations
        (uid, type, source_id, input, prompts, credits, status, error_message)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        uid,
        type,
        source_id || null,
        JSON.stringify({ type, source_id: source_id || null, context }),
        null,
        String(fee),
        "error",
        err.message,
      ],
    );
    await logUsage({
      uid,
      task: "prompt_recommend_maker",
      credits: fee,
      status: "refunded",
      des: `Prompt recommendation failed for ${type}; ${fee} credits refunded. Reason: ${err.message}`,
    });

    return res.json({
      success: false,
      msg: "Could not generate prompt ideas. Credits were refunded.",
      err: err.message,
    });
  }
});

module.exports = router;

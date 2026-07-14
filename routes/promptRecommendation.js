const express = require("express");
const router = express.Router();
const path = require("path");
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const { logUsage, uploadImage } = require("../utils/common");
const { analyzeProductImage, generateTextContent } = require("../loops/api");
const { loadAppConfig } = require("../utils/loadConfig");

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

function cleanProductName(value, fallback = "the product") {
  const raw = cleanText(value, fallback);
  const withoutExt = raw.replace(/\.[a-z0-9]{2,5}$/i, "");
  if (/^(image|images|img|photo|picture|product)[-_ ]?\d*$/i.test(withoutExt)) {
    return fallback;
  }
  return withoutExt.replace(/[-_]+/g, " ").trim() || fallback;
}

function listJoin(value, fallback = "") {
  if (Array.isArray(value) && value.length) {
    return value
      .map((v) => cleanText(v))
      .filter(Boolean)
      .join(", ");
  }
  return cleanText(value, fallback);
}

function productShowcasePrompts(context = {}) {
  const modelName = cleanText(context.modelName, "the influencer");
  const analysis = context.visionAnalysis || {};
  const productType = cleanText(analysis.product_type, "product");
  const productName = cleanProductName(
    context.productName,
    cleanText(
      analysis.product_name || analysis.product_type,
      cleanProductName(context.productImageName, "the product"),
    ),
  );
  const productDescription = cleanText(analysis.product_description);
  const audience = cleanText(analysis.target_audience);
  const features = listJoin(analysis.key_features);
  const benefits = listJoin(analysis.key_benefits);
  const useCases = listJoin(analysis.use_cases);
  const visualStyle = cleanText(analysis.visual_style);
  const angles = listJoin(analysis.best_ad_angles);
  const aspectRatio = cleanText(context.aspectRatio, "9:16");
  const seed = compactPrompt(context.promptSeed);
  const seedLine = seed ? ` Keep this direction in mind: ${seed}` : "";

  const detailBits = [
    productDescription ? `Looks like: ${productDescription}` : "",
    features ? `Visible features: ${features}` : "",
    benefits ? `Benefits to highlight: ${benefits}` : "",
    useCases ? `Use cases: ${useCases}` : "",
    visualStyle ? `Visual style: ${visualStyle}` : "",
    audience ? `Audience: ${audience}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const detailLine = detailBits ? ` ${detailBits}.` : "";
  const angleLine = angles ? ` Suggested camera/demo angles: ${angles}.` : "";

  const visionAd = compactPrompt(analysis.ad_prompt);
  const visionInfluencer = compactPrompt(analysis.influencer_prompt);

  const ideas = [];

  if (visionAd) {
    ideas.push({
      title: `${productType} — Vision Ad Script`,
      prompt: `${visionAd} Influencer: ${modelName}. Keep packaging accurate and suitable for ${aspectRatio}.${seedLine}`,
    });
  }

  if (visionInfluencer) {
    ideas.push({
      title: `${productType} — Matching Influencer`,
      prompt: `${modelName} matches this look: ${visionInfluencer}. Then naturally presents ${productName} (${productType}) on camera.${detailLine}${seedLine}`,
    });
  }

  ideas.push(
    {
      title: `${productType} — Natural Demo`,
      prompt: `${modelName} presents ${productName} (${productType}) in a natural, friendly UGC style. Show the product clearly in hand, highlight the main benefit, and end with a sharp packaging close-up.${detailLine}${angleLine}${seedLine} Keep the product crisp and accurate for ${aspectRatio}.`,
    },
    {
      title: `${productType} — Problem → Solution`,
      prompt: `${modelName} opens with a common customer problem for ${productType} buyers, then shows how ${productName} solves it.${detailLine}${seedLine} Keep delivery trustworthy and focused on why viewers should try it. ${aspectRatio} vertical.`,
    },
    {
      title: `${productType} — Lifestyle Flex`,
      prompt: `${modelName} showcases ${productName} like a premium lifestyle ad for ${productType}. Confident body language, clean product framing, elegant pacing, clear CTA.${detailLine}${angleLine}${seedLine}`,
    },
    {
      title: `${productType} — Friend Recommendation`,
      prompt: `${modelName} recommends ${productName} like telling a friend after using this ${productType}. Mention what stands out from the packaging/look, one key benefit, and a soft CTA.${detailLine}${seedLine}`,
    },
    {
      title: `${productType} — Viral Hook`,
      prompt: `${modelName} gives a short viral pitch for this ${productType}: strong hook → show ${productName} → one memorable benefit → energetic CTA.${detailLine}${angleLine}${seedLine} Format for ${aspectRatio}.`,
    },
  );

  // Keep top 5 unique-ish titles
  const seen = new Set();
  return ideas.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return Boolean(item.prompt);
  }).slice(0, 5);
}

function influencerPrompts(context = {}) {
  const name = cleanText(context.name, "A unique AI influencer");
  const description = compactPrompt(context.description);
  const seed = compactPrompt(context.promptSeed);
  const base = description || seed || "modern, confident, and approachable";

  const realLook =
    "Photorealistic real human, natural skin texture with visible pores and subtle imperfections, realistic eyes with catchlights, authentic facial asymmetry, real hair strands, natural fabric wrinkles. Shot on 85mm lens, f/1.8, soft natural daylight, shallow depth of field, high-end social media portrait photography, 8K detail. Not CGI, not plastic beauty filter, not over-smoothed skin.";

  return [
    {
      title: "Ultra-Real Profile Portrait",
      prompt: `${name}, ${base}. Close-up head-and-shoulders portrait of a real person looking gently at camera, soft genuine smile, clean modern casual outfit, soft gray studio background. ${realLook}`,
    },
    {
      title: "Lifestyle Creator (Real Photo)",
      prompt: `${name}, a lifestyle content creator who feels approachable and trustworthy. ${base}. Natural smile, everyday modern clothing, clean bright background, Instagram profile photo style, true-to-life body proportions. ${realLook}`,
    },
    {
      title: "Commercial Brand Face",
      prompt: `${name}, friendly brand ambassador for product ads. ${base}. Warm expression, neat appearance, neutral seamless background, professional softbox lighting, realistic hands and face, commercial catalog portrait. ${realLook}`,
    },
    {
      title: "Fashion Editorial Realism",
      prompt: `${name}, luxury fashion influencer with confident posture. ${base}. Editorial photoshoot, refined outfit, soft cinematic window light, detailed face and hands, premium campaign look. ${realLook}`,
    },
    {
      title: "Candid Street Creator",
      prompt: `${name}, modern social media personality with a strong but natural look. ${base}. Trendy casual outfit, relaxed confident pose, soft outdoor daylight, city bokeh background, candid smartphone-to-DSLR quality. ${realLook}`,
    },
  ];
}

function parsePromptIdeasJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  const text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    const ideas = parsed
      .map((item, i) => ({
        title: cleanText(item?.title, `Idea ${i + 1}`),
        prompt: compactPrompt(item?.prompt),
      }))
      .filter((item) => item.prompt.length >= 40);
    return ideas.length ? ideas.slice(0, 5) : null;
  } catch {
    return null;
  }
}

async function aiInfluencerPrompts(context = {}) {
  try {
    const name = cleanText(context.name, "Ava");
    const description =
      compactPrompt(context.description) ||
      "modern, approachable lifestyle content creator";
    const seed = compactPrompt(context.promptSeed);

    const result = await generateTextContent(null, {
      topic: `Return ONLY a JSON array of exactly 5 objects with keys "title" and "prompt". No markdown.

Each "prompt" is an IMAGE generation prompt for a photorealistic human influencer portrait (must look like a real camera photo of a real person — not CGI, plastic skin, anime, or beauty-filter face).

Always include: natural skin pores, subtle imperfections, authentic facial asymmetry, real hair strands, 85mm lens look, soft natural lighting, and "not over-smoothed skin".

Character name: ${name}
Character description / vibe: ${description}
${seed ? `Extra direction from user: ${seed}` : ""}

Vary the 5 ideas: 1) profile headshot 2) lifestyle creator 3) commercial brand face 4) fashion editorial 5) candid outdoor.
Keep each prompt under 80 words but detailed enough for realism.`,
      contentType: "product_desc",
      tone: "precise",
      language: "English",
    });

    if (result?.status !== "success") return null;
    return parsePromptIdeasJson(result?.data?.content);
  } catch (err) {
    console.warn("aiInfluencerPrompts failed:", err.message);
    return null;
  }
}

async function aiProductShowcasePrompts(context = {}) {
  try {
    const analysis = context.visionAnalysis || {};
    if (!analysis.product_type && !analysis.product_name) return null;

    const modelName = cleanText(context.modelName, "the influencer");
    const aspectRatio = cleanText(context.aspectRatio, "9:16");
    const seed = compactPrompt(context.promptSeed);

    const result = await generateTextContent(null, {
      topic: `Return ONLY a JSON array of exactly 5 objects: [{"title":"...","prompt":"..."}]. No markdown.

These are VIDEO/ad prompts for a product showcase reel (${aspectRatio}).
Influencer to feature: ${modelName}
Vision analysis of the product photo:
${JSON.stringify(analysis, null, 2)}
${seed ? `User seed direction: ${seed}` : ""}

Rules:
- Each prompt must clearly name the detected product type and what the ad should show
- Keep packaging/colors accurate to the analysis
- Vary styles: natural demo, problem-solution, lifestyle, friend rec, viral hook
- Keep each prompt under 90 words, actionable for video generation`,
      contentType: "reel_script",
      tone: "precise",
      language: "English",
    });

    if (result?.status !== "success") return null;
    return parsePromptIdeasJson(result?.data?.content);
  } catch (err) {
    console.warn("aiProductShowcasePrompts failed:", err.message);
    return null;
  }
}

async function buildRecommendations(type, context) {
  if (type === "product_showcase") {
    const aiIdeas = await aiProductShowcasePrompts(context);
    if (aiIdeas?.length) return aiIdeas;
    return productShowcasePrompts(context);
  }
  if (type === "influencer") {
    const aiIdeas = await aiInfluencerPrompts(context);
    if (aiIdeas?.length) return aiIdeas;
    return influencerPrompts(context);
  }
  return [];
}

function summarizeVision(analysis = {}) {
  if (!analysis || typeof analysis !== "object") return null;
  return {
    product_type: cleanText(analysis.product_type),
    product_name: cleanText(analysis.product_name),
    product_description: cleanText(analysis.product_description),
    target_audience: cleanText(analysis.target_audience),
    key_features: Array.isArray(analysis.key_features)
      ? analysis.key_features
      : [],
    key_benefits: Array.isArray(analysis.key_benefits)
      ? analysis.key_benefits
      : [],
    use_cases: Array.isArray(analysis.use_cases) ? analysis.use_cases : [],
    visual_style: cleanText(analysis.visual_style),
  };
}

router.post("/generate", validateUser, checkPlan, async (req, res) => {
  const uid = req.decode.uid;
  const { type, source_id } = req.body || {};
  let context = req.body?.context || {};

  if (typeof context === "string") {
    try {
      context = JSON.parse(context);
    } catch {
      context = {};
    }
  }

  if (!VALID_TYPES.has(type)) {
    return res.json({
      success: false,
      msg: "Invalid recommendation type",
    });
  }

  if (type === "product_showcase" && !req.files?.product_image) {
    return res.json({
      success: false,
      msg: "Upload a product image first — prompts are suggested from visual analysis of the product.",
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
    let visionSummary = null;

    if (type === "product_showcase" && req.files?.product_image) {
      const productFile = req.files.product_image;
      const uploadResult = await uploadImage(
        productFile,
        path.join(__dirname, "../client/public/media"),
        ["jpeg", "jpg", "png", "webp"],
        10,
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.msg || "Product image upload failed");
      }

      const mimeType =
        productFile.mimetype ||
        (String(productFile.name || "").toLowerCase().endsWith(".png")
          ? "image/png"
          : String(productFile.name || "").toLowerCase().endsWith(".webp")
            ? "image/webp"
            : "image/jpeg");

      // Analyze bytes directly (no HTTP fetch to frontendUrl — that often fails)
      const vision = await analyzeProductImage(null, {
        buffer: productFile.data,
        mimeType,
      });

      if (vision.status === "error") {
        throw new Error(`Vision analysis failed: ${vision.msg}`);
      }

      const cfg = loadAppConfig();
      const publicBase =
        cfg?.frontendUrl || cfg?.backendUrl || "http://localhost:8002";

      context = {
        ...context,
        productImageUrl: `${publicBase}/media/${uploadResult.filename}`,
        productImageName: productFile.name,
        visionAnalysis: vision.data,
      };
      visionSummary = summarizeVision(vision.data);
    }

    const prompts = await buildRecommendations(type, context);
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
      des: `Generated ${prompts.length} ${type} prompt recommendations${
        visionSummary?.product_type
          ? ` (detected: ${visionSummary.product_type})`
          : ""
      }`,
    });

    return res.json({
      success: true,
      msg: visionSummary?.product_type
        ? `Detected ${visionSummary.product_type} — prompt ideas ready`
        : "Prompt ideas generated",
      prompts,
      visionAnalysis: visionSummary,
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

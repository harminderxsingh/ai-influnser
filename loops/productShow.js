const path = require("path");
const { query } = require("../database/connection");
const {
  downloadImage,
  logUsage,
  sendUsageUpdateEmail,
} = require("../utils/common");
const { fetchJobStatus, createJob, analyzeProductImage } = require("./api");
const { frontendUrl } = require("../config.json");
const {
  buildShowcasePrompt,
  normalizeAspectRatio,
  prepareProductImageForShowcase,
} = require("../utils/showcaseMedia");

const SHOWCASE_STATUS_POLL_SECONDS = 45;

// ============================================
// HELPERS
// ============================================

async function getUser(uid) {
  const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  return user || null;
}

async function getCreditFee() {
  const [web] = await query(`SELECT * FROM web_private`);
  return parseInt(web?.product_showcase_maker || 0);
}

function getUserCredits(user) {
  try {
    return parseInt(user?.credits) || 0;
  } catch {
    return 0;
  }
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

async function setContentError(id, msg) {
  await query(
    `UPDATE product_content SET status = 'error', error_message = ?, job_id = NULL WHERE id = ?`,
    [msg, id],
  );
}

async function claimProductForSubmission(id) {
  const result = await query(
    `UPDATE product_content
     SET status = 'submitting'
     WHERE id = ?
       AND status = 'processing'
       AND (job_id IS NULL OR job_id = '')`,
    [id],
  );

  return result.affectedRows > 0;
}

async function releaseProductClaim(id) {
  await query(
    `UPDATE product_content
     SET status = 'processing'
     WHERE id = ?
       AND status = 'submitting'
       AND (job_id IS NULL OR job_id = '')`,
    [id],
  );
}

async function touchProductStatusCheck(id) {
  await query(
    `UPDATE product_content
     SET updated_at = NOW()
     WHERE id = ?
       AND status IN ('processing', 'submitting')
       AND job_id IS NOT NULL
       AND job_id <> ''`,
    [id],
  );
}

async function recoverStaleSubmissions() {
  await query(
    `UPDATE product_content
     SET status = 'processing'
     WHERE status = 'submitting'
       AND job_id IS NOT NULL
       AND job_id <> ''`,
    [],
  );

  await query(
    `UPDATE product_content
     SET status = 'processing'
     WHERE status = 'submitting'
       AND (job_id IS NULL OR job_id = '')
       AND updated_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
    [],
  );
}

async function getFreshRow(id) {
  const [row] = await query(`SELECT job_id, status FROM product_content WHERE id = ?`, [
    id,
  ]);
  return row || null;
}

async function persistJobId(id, taskId) {
  const result = await query(
    `UPDATE product_content
     SET status = 'processing', job_id = ?
     WHERE id = ?
       AND (job_id IS NULL OR job_id = '')`,
    [taskId, id],
  );

  if (result.affectedRows) return { saved: true, duplicate: false };

  const row = await getFreshRow(id);
  if (row?.job_id) {
    if (row.status === "submitting") {
      await query(
        `UPDATE product_content SET status = 'processing' WHERE id = ? AND status = 'submitting'`,
        [id],
      );
    }
    return { saved: true, duplicate: row.job_id !== taskId, existingJobId: row.job_id };
  }

  await query(
    `UPDATE product_content
     SET status = 'processing', job_id = ?
     WHERE id = ?`,
    [taskId, id],
  );

  return { saved: true, duplicate: false, forced: true };
}

function parseOther(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveOther(id, otherData, status = "processing") {
  await query(
    `UPDATE product_content
     SET other = ?, status = ?
     WHERE id = ?`,
    [JSON.stringify(otherData), status, id],
  );
}

function buildAutoInfluencerPrompt(analysis = {}) {
  const productType = analysis.product_type || "product";
  const audience = analysis.target_audience || "modern online shoppers";
  const style =
    analysis.influencer_prompt ||
    `A photorealistic lifestyle influencer suitable for promoting a ${productType}`;

  return `${style}. The influencer should look trustworthy, polished, brand-safe, and natural for ${audience}. Professional studio ad photography, detailed face, realistic hands, clean outfit, sharp focus, premium social media campaign style.`;
}

function buildAutoShowcasePrompt(analysis = {}, userPrompt = "") {
  const base = userPrompt?.trim() || analysis.ad_prompt || "";
  const productName =
    analysis.product_name || analysis.product_type || "the uploaded product";
  const description = analysis.product_description
    ? ` Product details: ${analysis.product_description}.`
    : "";

  return buildShowcasePrompt(
    `${base || `Create a realistic UGC ad where the influencer presents ${productName}.`}${description}`,
  );
}

async function notifyUser(user, { task, des, status }) {
  if (!user?.email) return;
  try {
    await sendUsageUpdateEmail({
      emailTo: user.email,
      variables: {
        user_email: user.email,
        task_name: task,
        task_description: des,
        task_status: status,
        date_time:
          new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC",
      },
    });
  } catch (err) {
    console.error("❌ notifyUser email failed:", err.message);
  }
}

// ── Build public media URL — no upload needed ─────────────────
async function uploadFileToProvider(localPath, _apiKey) {
  if (localPath.startsWith("http")) return localPath;

  const fileName = path.basename(localPath);
  const publicUrl = `${frontendUrl}/media/${fileName}`;

  console.log(`📎 Media URL → ${publicUrl}`);
  return publicUrl;
}

// ============================================
// PROCESS SINGLE PRODUCT CONTENT ITEM
// ============================================

async function processProductShowcase(item, provider, fee) {
  const { id, uid, job_id, model, ref_photo, prompt, other } = item;

  if (job_id) {
    let result;

    try {
      result = await fetchJobStatus(provider, "showcase", job_id);
    } catch (err) {
      console.error(
        `❌ fetchJobStatus crashed for product_content #${id}:`,
        err.message,
      );
      await logUsage({
        uid,
        task: "product_showcase_maker",
        status: "error",
        des: `fetchJobStatus crashed for product_content #${id}: ${err.message}`,
      });
      return;
    }

    if (result.status === "pending") {
      await touchProductStatusCheck(id);
      return;
    }

    const user = await getUser(uid);

    if (result.status === "error") {
      await refundCredits(uid, fee);
      await setContentError(id, result.msg);
      console.error(`❌ product_content #${id} job failed — refunded ${fee}cr`);

      const des = `product_content #${id} job failed — ${fee} credits refunded. Reason: ${result.msg}`;
      await logUsage({
        uid,
        task: "product_showcase_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Product Showcase Video",
        des,
        status: "Refunded",
      });
      return;
    }

    let savedPath;
    try {
      savedPath = await downloadImage(
        result.data,
        `${__dirname}/../client/public/media`,
      );
    } catch (err) {
      console.error(
        `❌ downloadImage failed for product_content #${id}:`,
        err.message,
        "| URL:",
        result.data,
      );
      await refundCredits(uid, fee);
      await setContentError(id, `Download failed: ${err.message}`);

      const des = `product_content #${id} download failed — ${fee}cr refunded. Error: ${err.message}`;
      await logUsage({
        uid,
        task: "product_showcase_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Product Showcase Video",
        des,
        status: "Refunded",
      });
      return;
    }

    if (!savedPath) {
      await refundCredits(uid, fee);
      await setContentError(id, "Download returned empty path");

      const des = `product_content #${id} download returned empty — ${fee}cr refunded`;
      await logUsage({
        uid,
        task: "product_showcase_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Product Showcase Video",
        des,
        status: "Refunded",
      });
      return;
    }

    await query(
      `UPDATE product_content SET status = 'active', generated_video = ?, job_id = NULL WHERE id = ?`,
      [savedPath, id],
    );

    console.log(`✅ product_content #${id} completed — saved to ${savedPath}`);

    const successDes = `product_content #${id} completed successfully — video saved to ${savedPath}`;
    await logUsage({
      uid,
      task: "product_showcase_maker",
      credits: fee,
      status: "success",
      des: successDes,
    });
    await notifyUser(user, {
      task: "Product Showcase Video",
      des: successDes,
      status: "Success",
    });
    return;
  }

  const claimed = await claimProductForSubmission(id);
  if (!claimed) {
    console.log(`⏭️  product_content #${id} already claimed for submission`);
    return;
  }

  const user = await getUser(uid);

  if (!user) {
    await setContentError(id, "User not found");
    await logUsage({
      uid,
      task: "product_showcase_maker",
      status: "error",
      des: `product_content #${id} — user not found`,
    });
    return;
  }

  const credits = getUserCredits(user);

  if (credits <= 0) {
    console.log(`⏭️  product_content #${id} — plan expired or no credits`);
    await setContentError(id, "Plan expired or no credits available");
    await logUsage({
      uid,
      task: "product_showcase_maker",
      credits: 0,
      status: "error",
      des: `product_content #${id} — plan expired or zero credits`,
    });
    await notifyUser(user, {
      task: "Product Showcase Video",
      des: `Your product showcase video #${id} could not be processed — your plan has expired or you have no credits.`,
      status: "Failed",
    });
    return;
  }

  if (credits < fee) {
    console.log(
      `⏭️  product_content #${id} — needs ${fee}cr, has ${credits}cr`,
    );
    await setContentError(
      id,
      `Insufficient credits — needs ${fee}, has ${credits}`,
    );
    await logUsage({
      uid,
      task: "product_showcase_maker",
      credits,
      status: "error",
      des: `product_content #${id} — needs ${fee}cr but user only has ${credits}cr`,
    });
    await notifyUser(user, {
      task: "Product Showcase Video",
      des: `Your product showcase video #${id} could not be processed — you need ${fee} credits but only have ${credits}.`,
      status: "Failed",
    });
    return;
  }

  if (!ref_photo) {
    await setContentError(id, "No product photo found");
    await logUsage({
      uid,
      task: "product_showcase_maker",
      status: "error",
      des: `product_content #${id} — ref_photo is empty`,
    });
    return;
  }

  const otherData = parseOther(other);
  const isAutoProductFlow = otherData.auto_mode || !model;

  let influencer;
  let finalPrompt = prompt;

  if (isAutoProductFlow) {
    const productImagePath = `${__dirname}/../client/public/media/${ref_photo}`;
    const productImageUrlForVision = await uploadFileToProvider(
      productImagePath,
    );

    if (!otherData.credits_reserved) {
      const reserved = await reserveCredits(uid, fee);

      if (!reserved) {
        console.log(
          `⏭️  Skipping product_content #${id} — credits taken by concurrent task`,
        );
        await releaseProductClaim(id);
        await logUsage({
          uid,
          task: "product_showcase_maker",
          status: "skipped",
          des: `product_content #${id} skipped — credits taken by a concurrent task`,
        });
        return;
      }

      otherData.credits_reserved = true;
      await saveOther(id, otherData, "processing");
    }

    if (!otherData.vision_analysis) {
      const vision = await analyzeProductImage(provider, productImageUrlForVision);
      if (vision.status === "error") {
        await refundCredits(uid, fee);
        await setContentError(id, `Product vision analysis failed: ${vision.msg}`);
        await logUsage({
          uid,
          task: "product_showcase_maker",
          credits: fee,
          status: "refunded",
          des: `product_content #${id} vision analysis failed — ${fee}cr refunded. Reason: ${vision.msg}`,
        });
        return;
      }

      otherData.vision_analysis = vision.data;
      await saveOther(id, otherData, "processing");
      return;
    }

    if (!otherData.auto_influencer_photo) {
      if (otherData.auto_influencer_job_id) {
        const result = await fetchJobStatus(
          provider,
          "txt2img",
          otherData.auto_influencer_job_id,
        );

        if (result.status === "pending") {
          await saveOther(id, otherData, "processing");
          return;
        }

        if (result.status === "error") {
          await refundCredits(uid, fee);
          await setContentError(
            id,
            `Auto influencer generation failed: ${result.msg}`,
          );
          await logUsage({
            uid,
            task: "product_showcase_maker",
            credits: fee,
            status: "refunded",
            des: `product_content #${id} auto influencer failed — ${fee}cr refunded. Reason: ${result.msg}`,
          });
          return;
        }

        const savedInfluencerPhoto = await downloadImage(
          result.data,
          `${__dirname}/../client/public/media`,
        );
        otherData.auto_influencer_photo = savedInfluencerPhoto;
        await saveOther(id, otherData, "processing");
        return;
      }

      const createInfluencer = await createJob(provider, "txt2img", {
        prompt: buildAutoInfluencerPrompt(otherData.vision_analysis),
      });

      if (createInfluencer.status === "error") {
        await refundCredits(uid, fee);
        await setContentError(
          id,
          `Auto influencer job creation failed: ${createInfluencer.msg}`,
        );
        await logUsage({
          uid,
          task: "product_showcase_maker",
          credits: fee,
          status: "refunded",
          des: `product_content #${id} auto influencer create failed — ${fee}cr refunded. Reason: ${createInfluencer.msg}`,
        });
        return;
      }

      otherData.auto_influencer_job_id = createInfluencer.taskId;
      await saveOther(id, otherData, "processing");
      return;
    }

    influencer = {
      name: "Auto AI Influencer",
      photo_url: otherData.auto_influencer_photo,
    };
    finalPrompt = buildAutoShowcasePrompt(otherData.vision_analysis, prompt);
  } else {
    try {
      influencer = typeof model === "string" ? JSON.parse(model) : model;
    } catch (err) {
      await setContentError(id, "Invalid model JSON");
      await logUsage({
        uid,
        task: "product_showcase_maker",
        status: "error",
        des: `product_content #${id} — failed to parse model JSON: ${err.message}`,
      });
      return;
    }

    if (!influencer?.photo_url) {
      await setContentError(id, "Influencer has no photo");
      await logUsage({
        uid,
        task: "product_showcase_maker",
        status: "error",
        des: `product_content #${id} — influencer has no photo_url`,
      });
      return;
    }
  }

  const apiKey =
    provider.reel_api_key ||
    provider.img2img_api_key ||
    provider.txt2img_api_key;

  let aspectRatio = "9:16";
  try {
    aspectRatio = normalizeAspectRatio(otherData?.aspect_ratio);
  } catch {
    aspectRatio = "9:16";
  }

  let modelImageUrl;
  try {
    const modelImagePath = `${__dirname}/../client/public/media/${influencer.photo_url}`;
    modelImageUrl = await uploadFileToProvider(modelImagePath, apiKey);
    console.log(`📎 product_content #${id} model image URL: ${modelImageUrl}`);
  } catch (err) {
    await setContentError(id, `Model image upload failed: ${err.message}`);
    await logUsage({
      uid,
      task: "product_showcase_maker",
      status: "error",
      des: `product_content #${id} — model image upload failed: ${err.message}`,
    });
    return;
  }

  let productImageUrl;
  try {
    const productImagePath = `${__dirname}/../client/public/media/${ref_photo}`;
    const preparedProductPath = await prepareProductImageForShowcase(
      productImagePath,
      aspectRatio,
    );
    productImageUrl = await uploadFileToProvider(preparedProductPath, apiKey);
    console.log(
      `📎 product_content #${id} product image URL: ${productImageUrl} (${aspectRatio})`,
    );
  } catch (err) {
    await setContentError(id, `Product image upload failed: ${err.message}`);
    await logUsage({
      uid,
      task: "product_showcase_maker",
      status: "error",
      des: `product_content #${id} — product image upload failed: ${err.message}`,
    });
    return;
  }

  const reserved = otherData.credits_reserved
    ? true
    : await reserveCredits(uid, fee);

  if (!reserved) {
    console.log(
      `⏭️  Skipping product_content #${id} — credits taken by concurrent task`,
    );
    await releaseProductClaim(id);
    await logUsage({
      uid,
      task: "product_showcase_maker",
      status: "skipped",
      des: `product_content #${id} skipped — credits taken by a concurrent task`,
    });
    return;
  }

  if (!otherData.credits_reserved) {
    otherData.credits_reserved = true;
    await saveOther(id, otherData, "submitting");
  }

  if (!otherData.vision_analysis) {
    const vision = await analyzeProductImage(provider, productImageUrl);
    if (vision.status === "error") {
      await refundCredits(uid, fee);
      await setContentError(id, `Product vision analysis failed: ${vision.msg}`);
      await logUsage({
        uid,
        task: "product_showcase_maker",
        credits: fee,
        status: "refunded",
        des: `product_content #${id} vision analysis failed — ${fee}cr refunded. Reason: ${vision.msg}`,
      });
      return;
    }

    otherData.vision_analysis = vision.data;
    await saveOther(id, otherData, "processing");
    return;
  }

  const freshBeforeCreate = await getFreshRow(id);
  if (freshBeforeCreate?.job_id) {
    console.log(
      `⏭️  product_content #${id} already has job_id ${freshBeforeCreate.job_id} before create — skipping duplicate provider call`,
    );
    await query(
      `UPDATE product_content SET status = 'processing' WHERE id = ? AND status = 'submitting'`,
      [id],
    );
    return;
  }

  const create = await createJob(provider, "showcase", {
    image_url_1: modelImageUrl,
    image_url_2: productImageUrl,
    text: buildAutoShowcasePrompt(otherData.vision_analysis, finalPrompt),
    aspect_ratio: aspectRatio,
    generation_type: "REFERENCE_2_VIDEO",
  });

  if (create.status === "error") {
    await setContentError(id, create.msg);
    await refundCredits(uid, fee);
    await releaseProductClaim(id);
    console.error(`❌ product_content #${id} job creation failed:`, create.msg);

    const des = `product_content #${id} job creation failed — ${fee} credits refunded. Reason: ${create.msg}`;
    await logUsage({
      uid,
      task: "product_showcase_maker",
      credits: fee,
      status: "refunded",
      des,
    });
    await notifyUser(user, {
      task: "Product Showcase Video",
      des,
      status: "Refunded",
    });
    return;
  }

  const persisted = await persistJobId(id, create.taskId);

  if (persisted.duplicate && persisted.existingJobId !== create.taskId) {
    console.error(
      `⚠️  product_content #${id} orphan provider job ${create.taskId} — row already has ${persisted.existingJobId}, refunding duplicate charge`,
    );
    await refundCredits(uid, fee);
    return;
  }

  console.log(
    `🚀 product_content #${id} job created — taskId: ${create.taskId}`,
  );
  await logUsage({
    uid,
    task: "product_showcase_maker",
    credits: fee,
    status: "processing",
    des: `product_content #${id} job submitted — taskId: ${create.taskId}`,
  });
  await notifyUser(user, {
    task: "Product Showcase Video",
    des: `Your product showcase video #${id} is being generated. We'll notify you once it's ready.`,
    status: "Processing",
  });
}

// ============================================
// MAIN RUNNER
// ============================================

async function productShowcase({ provider }) {
  try {
    const fee = await getCreditFee();

    if (fee < 1) {
      console.log(
        "⚠️  product_showcase_maker fee not configured by admin, skipping run",
      );
      return;
    }

    await recoverStaleSubmissions();

    const contentList = await query(
      `SELECT * FROM product_content
       WHERE status IN ('processing', 'submitting')
         AND NOT (
           status = 'submitting'
           AND (job_id IS NULL OR job_id = '')
         )
         AND (
           (
             (job_id IS NULL OR job_id = '')
             AND updated_at < DATE_SUB(NOW(), INTERVAL 10 SECOND)
           )
           OR (
             job_id IS NOT NULL
             AND job_id <> ''
             AND updated_at < DATE_SUB(NOW(), INTERVAL ${SHOWCASE_STATUS_POLL_SECONDS} SECOND)
           )
         )`,
    );

    if (!contentList?.length) return;

    for (const item of contentList) {
      await processProductShowcase(item, provider, fee);
    }
  } catch (err) {
    console.error("❌ productShowcase fatal error:", err.message);
    await logUsage({
      task: "product_showcase_maker",
      status: "error",
      des: `productShowcase fatal crash: ${err.message}`,
    });
  }
}

module.exports = { productShowcase };

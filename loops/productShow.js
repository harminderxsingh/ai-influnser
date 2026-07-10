const path = require("path");
const { query } = require("../database/connection");
const {
  downloadImage,
  logUsage,
  sendUsageUpdateEmail,
} = require("../utils/common");
const { fetchJobStatus, createJob } = require("./api");
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

async function getActiveProvider() {
  const [provider] = await query(
    `SELECT * FROM ai_providers
     WHERE is_active = ?
     ORDER BY is_default DESC, id ASC
     LIMIT 1`,
    [1],
  );
  return provider || null;
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

async function saveOtherAndJob(id, otherData, jobId = null, status = "processing") {
  await query(
    `UPDATE product_content
     SET other = ?, job_id = ?, status = ?
     WHERE id = ?`,
    [JSON.stringify(otherData), jobId, status, id],
  );
}

async function recoverStaleSubmissions() {
  await query(
    `UPDATE product_content
     SET status = 'processing', error_message = NULL
     WHERE status = 'error'
       AND error_message = 'Influencer has no photo'`,
    [],
  );

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

function parseInfluencer(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;

  const value = String(raw).trim();
  if (!value || value === "null" || value === "{}") return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isTruthyAutoFlag(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function shouldUseAutoInfluencer(otherData = {}, model, storedInfluencer = null) {
  if (
    isTruthyAutoFlag(otherData.auto_mode) ||
    otherData.influencer_mode === "auto"
  ) {
    return true;
  }

  if (otherData.influencer_mode === "select" && storedInfluencer?.photo_url) {
    return false;
  }

  if (!model) return true;

  const rawModel = String(model).trim();
  if (!rawModel || rawModel === "null" || rawModel === "{}") {
    return true;
  }

  return !storedInfluencer?.photo_url;
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

function buildAutoInfluencerPromptFromText(userPrompt = "") {
  const productContext = userPrompt?.trim()
    ? ` Product/ad context: ${userPrompt.trim()}`
    : "";

  return `${buildAutoInfluencerPrompt({})}${productContext} Create only the influencer portrait/photo, not the product ad video.`;
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

function buildSelectedShowcasePrompt(userPrompt = "") {
  return buildShowcasePrompt(
    userPrompt?.trim() ||
      "Create a realistic UGC ad where the influencer naturally presents the uploaded product.",
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
  const otherData = parseOther(other);

  if (job_id) {
    if (otherData.auto_stage === "influencer_photo") {
      let result;

      try {
        result = await fetchJobStatus(provider, "txt2img", job_id);
      } catch (err) {
        console.error(
          `❌ fetchJobStatus crashed for product_content #${id} auto influencer:`,
          err.message,
        );
        await logUsage({
          uid,
          task: "product_showcase_maker",
          status: "error",
          des: `fetchJobStatus crashed for product_content #${id} auto influencer: ${err.message}`,
        });
        return;
      }

      if (result.status === "pending") {
        await touchProductStatusCheck(id);
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

      let savedInfluencerPhoto;
      try {
        savedInfluencerPhoto = await downloadImage(
          result.data,
          `${__dirname}/../client/public/media`,
        );
      } catch (err) {
        await refundCredits(uid, fee);
        await setContentError(
          id,
          `Auto influencer download failed: ${err.message}`,
        );
        await logUsage({
          uid,
          task: "product_showcase_maker",
          credits: fee,
          status: "refunded",
          des: `product_content #${id} auto influencer download failed — ${fee}cr refunded. Error: ${err.message}`,
        });
        return;
      }

      if (!savedInfluencerPhoto) {
        await refundCredits(uid, fee);
        await setContentError(id, "Auto influencer download returned empty path");
        await logUsage({
          uid,
          task: "product_showcase_maker",
          credits: fee,
          status: "refunded",
          des: `product_content #${id} auto influencer download returned empty — ${fee}cr refunded`,
        });
        return;
      }

      otherData.auto_influencer_photo = savedInfluencerPhoto;
      otherData.auto_influencer_job_id = job_id;
      otherData.auto_stage = "showcase";
      await saveOtherAndJob(id, otherData, null, "processing");

      const [freshItem] = await query(`SELECT * FROM product_content WHERE id = ?`, [
        id,
      ]);
      if (freshItem) {
        await processProductShowcase(freshItem, provider, fee);
      }
      return;
    }

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

  const storedInfluencer = parseInfluencer(model);
  const isAutoProductFlow = shouldUseAutoInfluencer(
    otherData,
    model,
    storedInfluencer,
  );

  if (isAutoProductFlow) {
    otherData.auto_mode = true;
    otherData.influencer_mode = "auto";
  }

  let influencer;
  let finalPrompt = prompt;

  if (isAutoProductFlow) {
    const productImagePath = `${__dirname}/../client/public/media/${ref_photo}`;
    await uploadFileToProvider(productImagePath);

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

    if (!otherData.auto_influencer_photo) {
      if (otherData.auto_influencer_job_id) {
        otherData.auto_stage = "influencer_photo";
        await saveOtherAndJob(
          id,
          otherData,
          otherData.auto_influencer_job_id,
          "processing",
        );
        return;
      }

      const createInfluencer = await createJob(provider, "txt2img", {
        prompt: buildAutoInfluencerPromptFromText(
          otherData.user_prompt || prompt,
        ),
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
      otherData.auto_stage = "influencer_photo";
      await saveOtherAndJob(id, otherData, createInfluencer.taskId, "processing");
      await logUsage({
        uid,
        task: "product_showcase_maker",
        credits: fee,
        status: "processing",
        des: `product_content #${id} auto influencer job submitted — taskId: ${createInfluencer.taskId}`,
      });
      return;
    }

    influencer = {
      name: "Auto AI Influencer",
      photo_url: otherData.auto_influencer_photo,
    };
    finalPrompt = otherData.vision_analysis
      ? buildAutoShowcasePrompt(otherData.vision_analysis, prompt)
      : buildSelectedShowcasePrompt(prompt);
  } else {
    influencer = storedInfluencer;

    if (!influencer?.photo_url) {
      otherData.auto_mode = true;
      otherData.influencer_mode = "auto";
      await saveOther(id, otherData, "processing");
      await releaseProductClaim(id);
      await logUsage({
        uid,
        task: "product_showcase_maker",
        status: "processing",
        des: `product_content #${id} — selected influencer had no photo, switching to auto influencer`,
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
    text: isAutoProductFlow
      ? buildAutoShowcasePrompt(otherData.vision_analysis, finalPrompt)
      : buildSelectedShowcasePrompt(finalPrompt),
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

async function triggerProductShowcase(id) {
  try {
    const provider = await getActiveProvider();
    if (!provider) {
      await logUsage({
        task: "product_showcase_maker",
        status: "skipped",
        des: `product_content #${id} skipped — no active AI provider found`,
      });
      return { success: false, msg: "No active AI provider found" };
    }

    const fee = await getCreditFee();
    if (fee < 1) {
      await logUsage({
        task: "product_showcase_maker",
        status: "skipped",
        des: `product_content #${id} skipped — product_showcase_maker fee not configured`,
      });
      return {
        success: false,
        msg: "Product showcase credit fee is not configured",
      };
    }

    const [item] = await query(`SELECT * FROM product_content WHERE id = ?`, [
      id,
    ]);
    if (!item) return { success: false, msg: "Product content not found" };
    if (!["processing", "submitting"].includes(item.status)) {
      return {
        success: item.status !== "error",
        msg: item.error_message || "Product content is not ready to process",
        status: item.status,
        job_id: item.job_id,
      };
    }

    await processProductShowcase(item, provider, fee);

    const [fresh] = await query(
      `SELECT id, status, job_id, error_message FROM product_content WHERE id = ?`,
      [id],
    );

    if (fresh?.status === "error") {
      return {
        success: false,
        msg: fresh.error_message || "Could not start product showcase",
        status: fresh.status,
        job_id: fresh.job_id,
      };
    }

    return {
      success: true,
      msg: "Product showcase processing started",
      status: fresh?.status,
      job_id: fresh?.job_id,
    };
  } catch (err) {
    console.error(
      `❌ triggerProductShowcase failed for product_content #${id}:`,
      err.message,
    );
    await logUsage({
      task: "product_showcase_maker",
      status: "error",
      des: `triggerProductShowcase failed for product_content #${id}: ${err.message}`,
    });
    return { success: false, msg: err.message };
  }
}

module.exports = { productShowcase, triggerProductShowcase };

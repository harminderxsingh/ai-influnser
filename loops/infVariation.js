const { query } = require("../database/connection");
const {
  downloadImage,
  logUsage,
  sendUsageUpdateEmail,
} = require("../utils/common");
const { fetchJobStatus, createJob } = require("./api");
const path = require("path");
const { frontendUrl } = require("../config.json");

const GALLERY_STATUS_POLL_SECONDS = 30;

// ============================================
// HELPERS
// ============================================

async function getUser(uid) {
  const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  return user || null;
}

async function getCreditFee() {
  const [web] = await query(`SELECT * FROM web_private`);
  return parseInt(web?.inf_var_maker || 0);
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

async function setGalleryError(id, msg) {
  await query(
    `UPDATE gallery SET status = 'error', error_message = ? WHERE id = ?`,
    [msg, id],
  );
}

async function claimGalleryForSubmission(id) {
  const result = await query(
    `UPDATE gallery
     SET status = 'submitting'
     WHERE id = ?
       AND status = 'processing'
       AND (job_id IS NULL OR job_id = '')`,
    [id],
  );

  return result.affectedRows > 0;
}

async function releaseGalleryClaim(id) {
  await query(
    `UPDATE gallery
     SET status = 'processing'
     WHERE id = ?
       AND status = 'submitting'
       AND (job_id IS NULL OR job_id = '')`,
    [id],
  );
}

async function touchGalleryStatusCheck(id) {
  await query(
    `UPDATE gallery
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
    `UPDATE gallery
     SET status = 'processing'
     WHERE status = 'submitting'
       AND job_id IS NOT NULL
       AND job_id <> ''`,
    [],
  );

  await query(
    `UPDATE gallery
     SET status = 'processing'
     WHERE status = 'submitting'
       AND (job_id IS NULL OR job_id = '')
       AND updated_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
    [],
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
async function uploadImageToProvider(localPath, _apiKey) {
  if (localPath.startsWith("http")) return localPath;

  const fileName = path.basename(localPath);
  const publicUrl = `${frontendUrl}/media/${fileName}`;

  console.log(`📎 Media URL → ${publicUrl}`);
  return publicUrl;
}

// ============================================
// PROCESS SINGLE VARIATION
// ============================================

async function processVariation(item, provider, fee) {
  const { id, uid, job_id, prompt, model } = item;

  if (job_id) {
    let result;

    try {
      result = await fetchJobStatus(provider, "img2img", job_id);
    } catch (err) {
      console.error(
        `❌ fetchJobStatus crashed for gallery #${id}:`,
        err.message,
      );
      await logUsage({
        uid,
        task: "inf_var_maker",
        status: "error",
        des: `fetchJobStatus crashed for gallery #${id}: ${err.message}`,
      });
      return;
    }

    if (result.status === "pending") {
      await touchGalleryStatusCheck(id);
      return;
    }

    const user = await getUser(uid);

    if (result.status === "error") {
      await refundCredits(uid, fee);
      await setGalleryError(id, result.msg);
      console.error(`❌ gallery #${id} job failed — refunded ${fee}cr`);

      const des = `gallery #${id} job failed — ${fee} credits refunded. Reason: ${result.msg}`;
      await logUsage({
        uid,
        task: "inf_var_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Influencer Variation",
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
        `❌ downloadImage failed for gallery #${id}:`,
        err.message,
        "| URL:",
        result.data,
      );
      await refundCredits(uid, fee);
      await setGalleryError(id, `downloadImage failed: ${err.message}`);

      const des = `gallery #${id} download failed — ${fee}cr refunded. Error: ${err.message} | URL: ${result.data}`;
      await logUsage({
        uid,
        task: "inf_var_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Influencer Variation",
        des,
        status: "Refunded",
      });
      return;
    }

    if (!savedPath) {
      console.error(
        `❌ downloadImage returned empty for gallery #${id}, URL:`,
        result.data,
      );
      await refundCredits(uid, fee);
      await setGalleryError(id, "downloadImage returned empty path");

      const des = `gallery #${id} download returned empty — ${fee}cr refunded | URL: ${result.data}`;
      await logUsage({
        uid,
        task: "inf_var_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Influencer Variation",
        des,
        status: "Refunded",
      });
      return;
    }

    await query(
      `UPDATE gallery SET status = 'active', generated_photo = ? WHERE id = ?`,
      [savedPath, id],
    );

    console.log(`✅ gallery #${id} completed — saved to ${savedPath}`);

    const successDes = `gallery #${id} completed successfully — image saved to ${savedPath}`;
    await logUsage({
      uid,
      task: "inf_var_maker",
      credits: fee,
      status: "success",
      des: successDes,
    });
    await notifyUser(user, {
      task: "Influencer Variation",
      des: successDes,
      status: "Success",
    });
    return;
  }

  const claimed = await claimGalleryForSubmission(id);
  if (!claimed) {
    console.log(`⏭️  gallery #${id} already claimed for submission`);
    return;
  }

  const user = await getUser(uid);

  if (!user) {
    await setGalleryError(id, "User not found");
    await logUsage({
      uid,
      task: "inf_var_maker",
      status: "error",
      des: `gallery #${id} — user not found in database`,
    });
    return;
  }

  const credits = getUserCredits(user);

  if (credits <= 0) {
    console.log(`⏭️  gallery #${id} — plan expired or no credits`);
    await setGalleryError(id, "Plan expired or no credits available");
    await logUsage({
      uid,
      task: "inf_var_maker",
      credits: 0,
      status: "error",
      des: `gallery #${id} — plan expired or zero credits`,
    });
    await notifyUser(user, {
      task: "Influencer Variation",
      des: `Your variation #${id} could not be processed — your plan has expired or you have no credits.`,
      status: "Failed",
    });
    return;
  }

  if (credits < fee) {
    console.log(`⏭️  gallery #${id} — needs ${fee}cr, has ${credits}cr`);
    await setGalleryError(
      id,
      `Insufficient credits — needs ${fee}, has ${credits}`,
    );
    await logUsage({
      uid,
      task: "inf_var_maker",
      credits,
      status: "error",
      des: `gallery #${id} — needs ${fee}cr but user only has ${credits}cr`,
    });
    await notifyUser(user, {
      task: "Influencer Variation",
      des: `Your variation #${id} could not be processed — you need ${fee} credits but only have ${credits}.`,
      status: "Failed",
    });
    return;
  }

  let influencer;
  try {
    influencer = typeof model === "string" ? JSON.parse(model) : model;
  } catch (err) {
    await setGalleryError(id, "Invalid model JSON");
    await logUsage({
      uid,
      task: "inf_var_maker",
      status: "error",
      des: `gallery #${id} — failed to parse model JSON: ${err.message}`,
    });
    return;
  }

  if (!influencer?.photo_url) {
    await setGalleryError(id, "Influencer has no photo");
    await logUsage({
      uid,
      task: "inf_var_maker",
      status: "error",
      des: `gallery #${id} — influencer has no photo_url in model JSON`,
    });
    return;
  }

  let referenceUrl;
  try {
    const localPath = `${__dirname}/../client/public/media/${influencer.photo_url}`;
    const apiKey = provider.img2img_api_key || provider.txt2img_api_key;
    referenceUrl = await uploadImageToProvider(localPath, apiKey);
    console.log(`📎 gallery #${id} reference URL: ${referenceUrl}`);
  } catch (err) {
    await setGalleryError(id, `Image upload failed: ${err.message}`);
    await logUsage({
      uid,
      task: "inf_var_maker",
      status: "error",
      des: `gallery #${id} — image upload failed: ${err.message}`,
    });
    return;
  }

  const reserved = await reserveCredits(uid, fee);

  if (!reserved) {
    console.log(
      `⏭️  Skipping gallery #${id} — credits taken by concurrent task`,
    );
    await releaseGalleryClaim(id);
    await logUsage({
      uid,
      task: "inf_var_maker",
      status: "skipped",
      des: `gallery #${id} skipped — credits taken by a concurrent task`,
    });
    return;
  }

  await logUsage({
    uid,
    task: "inf_var_maker",
    credits: fee,
    status: "debited",
    des: `gallery #${id} — ${fee} credits debited from wallet for influencer variation generation`,
  });

  let create;
  try {
    create = await createJob(provider, "img2img", {
      prompt,
      reference_url: referenceUrl,
    });
  } catch (err) {
    await refundCredits(uid, fee);
    await setGalleryError(id, `Job creation crashed: ${err.message}`);

    const des = `gallery #${id} job creation crashed — ${fee} credits refunded to wallet. Reason: ${err.message}`;
    await logUsage({
      uid,
      task: "inf_var_maker",
      credits: fee,
      status: "refunded",
      des,
    });
    await notifyUser(user, {
      task: "Influencer Variation",
      des,
      status: "Refunded",
    });
    return;
  }

  if (create.status === "error") {
    await setGalleryError(id, create.msg);
    await refundCredits(uid, fee);
    console.error(`❌ gallery #${id} job creation failed:`, create.msg);

    const des = `gallery #${id} job creation failed — ${fee} credits refunded to wallet. Reason: ${create.msg}`;
    await logUsage({
      uid,
      task: "inf_var_maker",
      credits: fee,
      status: "refunded",
      des,
    });
    await notifyUser(user, {
      task: "Influencer Variation",
      des,
      status: "Refunded",
    });
    return;
  }

  let saved;
  try {
    saved = await query(
      `UPDATE gallery
       SET status = 'processing', job_id = ?
       WHERE id = ?
         AND status = 'submitting'
         AND (job_id IS NULL OR job_id = '')`,
      [create.taskId, id],
    );
  } catch (err) {
    await refundCredits(uid, fee);
    await setGalleryError(id, `Could not save provider job id: ${err.message}`);

    const des = `gallery #${id} job_id save failed after provider create — ${fee} credits refunded to wallet. Provider taskId: ${create.taskId}. Reason: ${err.message}`;
    await logUsage({
      uid,
      task: "inf_var_maker",
      credits: fee,
      status: "refunded",
      des,
    });
    await notifyUser(user, {
      task: "Influencer Variation",
      des,
      status: "Refunded",
    });
    return;
  }

  if (!saved.affectedRows) {
    const [row] = await query(`SELECT job_id FROM gallery WHERE id = ?`, [id]);

    if (row?.job_id) {
      await query(
        `UPDATE gallery
         SET status = 'processing'
         WHERE id = ?
           AND status = 'submitting'`,
        [id],
      );
      console.log(`⚠️  gallery #${id} reconciled submitting → processing`);
      return;
    }

    console.error(
      `⚠️  gallery #${id} job ${create.taskId} created but row already has a job_id — refunding duplicate charge`,
    );
    await refundCredits(uid, fee);

    const des = `gallery #${id} duplicate provider job created — ${fee} credits refunded to wallet. Duplicate taskId: ${create.taskId}`;
    await logUsage({
      uid,
      task: "inf_var_maker",
      credits: fee,
      status: "refunded",
      des,
    });
    await notifyUser(user, {
      task: "Influencer Variation",
      des,
      status: "Refunded",
    });
    return;
  }

  console.log(`🚀 gallery #${id} job created — taskId: ${create.taskId}`);
  await logUsage({
    uid,
    task: "inf_var_maker",
    credits: fee,
    status: "processing",
    des: `gallery #${id} job submitted — taskId: ${create.taskId}`,
  });
  await notifyUser(user, {
    task: "Influencer Variation",
    des: `Your variation #${id} is being generated. We'll notify you once it's ready.`,
    status: "Processing",
  });
}

// ============================================
// MAIN RUNNER
// ============================================

async function runInfVariation({ provider }) {
  try {
    const fee = await getCreditFee();

    if (fee < 1) {
      console.log(
        "⚠️  inf_var_maker fee not configured by admin, skipping run",
      );
      return;
    }

    await recoverStaleSubmissions();

    const galleryList = await query(
      `SELECT * FROM gallery
       WHERE status IN ('processing', 'submitting')
         AND NOT (
           status = 'submitting'
           AND (job_id IS NULL OR job_id = '')
         )
         AND (
           job_id IS NULL
           OR job_id = ''
           OR updated_at < DATE_SUB(NOW(), INTERVAL ${GALLERY_STATUS_POLL_SECONDS} SECOND)
         )`,
    );

    if (!galleryList?.length) return;

    for (const item of galleryList) {
      await processVariation(item, provider, fee);
    }
  } catch (err) {
    console.error("❌ runInfVariation fatal error:", err.message);
    await logUsage({
      task: "inf_var_maker",
      status: "error",
      des: `runInfVariation fatal crash: ${err.message}`,
    });
  }
}

module.exports = { runInfVariation };

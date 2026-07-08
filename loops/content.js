const path = require("path");
const { query } = require("../database/connection");
const {
  downloadImage,
  logUsage,
  sendUsageUpdateEmail,
} = require("../utils/common");
const { fetchJobStatus, createJob } = require("./api");
const { frontendUrl } = require("../config.json");

// ============================================
// HELPERS
// ============================================

async function getUser(uid) {
  const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  return user || null;
}

async function getCreditFee() {
  const [web] = await query(`SELECT * FROM web_private`);
  return parseInt(web?.content_video_maker || 0);
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
    `UPDATE content SET status = 'error', error_message = ? WHERE id = ?`,
    [msg, id],
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
// PROCESS SINGLE CONTENT ITEM
// ============================================

async function processContent(item, provider, fee) {
  const { id, uid, job_id, model, ref_video } = item;

  if (job_id) {
    let result;

    try {
      result = await fetchJobStatus(provider, "reel", job_id);
    } catch (err) {
      console.error(
        `❌ fetchJobStatus crashed for content #${id}:`,
        err.message,
      );
      await logUsage({
        uid,
        task: "content_maker",
        status: "error",
        des: `fetchJobStatus crashed for content #${id}: ${err.message}`,
      });
      return;
    }

    if (result.status === "pending") return;

    const user = await getUser(uid);

    if (result.status === "error") {
      await refundCredits(uid, fee);
      await setContentError(id, result.msg);
      console.error(`❌ content #${id} job failed — refunded ${fee}cr`);

      const des = `content #${id} job failed — ${fee} credits refunded. Reason: ${result.msg}`;
      await logUsage({
        uid,
        task: "content_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Content Video",
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
        `❌ downloadImage failed for content #${id}:`,
        err.message,
        "| URL:",
        result.data,
      );
      await refundCredits(uid, fee);
      await setContentError(id, `Download failed: ${err.message}`);

      const des = `content #${id} download failed — ${fee}cr refunded. Error: ${err.message} | URL: ${result.data}`;
      await logUsage({
        uid,
        task: "content_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Content Video",
        des,
        status: "Refunded",
      });
      return;
    }

    if (!savedPath) {
      console.error(
        `❌ downloadImage returned empty for content #${id}, URL:`,
        result.data,
      );
      await refundCredits(uid, fee);
      await setContentError(id, "Download returned empty path");

      const des = `content #${id} download returned empty — ${fee}cr refunded | URL: ${result.data}`;
      await logUsage({
        uid,
        task: "content_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Content Video",
        des,
        status: "Refunded",
      });
      return;
    }

    await query(
      `UPDATE content SET status = 'active', generated_video = ? WHERE id = ?`,
      [savedPath, id],
    );

    console.log(`✅ content #${id} completed — saved to ${savedPath}`);

    const successDes = `content #${id} completed successfully — video saved to ${savedPath}`;
    await logUsage({
      uid,
      task: "content_maker",
      credits: fee,
      status: "success",
      des: successDes,
    });
    await notifyUser(user, {
      task: "Content Video",
      des: successDes,
      status: "Success",
    });
    return;
  }

  const user = await getUser(uid);

  if (!user) {
    await setContentError(id, "User not found");
    await logUsage({
      uid,
      task: "content_maker",
      status: "error",
      des: `content #${id} — user not found in database`,
    });
    return;
  }

  const credits = getUserCredits(user);

  if (credits <= 0) {
    console.log(`⏭️  content #${id} — plan expired or no credits`);
    await setContentError(id, "Plan expired or no credits available");
    await logUsage({
      uid,
      task: "content_maker",
      credits: 0,
      status: "error",
      des: `content #${id} — plan expired or zero credits`,
    });
    await notifyUser(user, {
      task: "Content Video",
      des: `Your content video #${id} could not be processed — your plan has expired or you have no credits.`,
      status: "Failed",
    });
    return;
  }

  if (credits < fee) {
    console.log(`⏭️  content #${id} — needs ${fee}cr, has ${credits}cr`);
    await setContentError(
      id,
      `Insufficient credits — needs ${fee}, has ${credits}`,
    );
    await logUsage({
      uid,
      task: "content_maker",
      credits,
      status: "error",
      des: `content #${id} — needs ${fee}cr but user only has ${credits}cr`,
    });
    await notifyUser(user, {
      task: "Content Video",
      des: `Your content video #${id} could not be processed — you need ${fee} credits but only have ${credits}.`,
      status: "Failed",
    });
    return;
  }

  let influencer;
  try {
    influencer = typeof model === "string" ? JSON.parse(model) : model;
  } catch (err) {
    await setContentError(id, "Invalid model JSON");
    await logUsage({
      uid,
      task: "content_maker",
      status: "error",
      des: `content #${id} — failed to parse model JSON: ${err.message}`,
    });
    return;
  }

  if (!influencer?.photo_url) {
    await setContentError(id, "Influencer has no photo");
    await logUsage({
      uid,
      task: "content_maker",
      status: "error",
      des: `content #${id} — influencer has no photo_url in model JSON`,
    });
    return;
  }

  let refVideoData;
  try {
    refVideoData =
      typeof ref_video === "string" ? JSON.parse(ref_video) : ref_video;
  } catch (err) {
    await setContentError(id, "Invalid ref_video JSON");
    await logUsage({
      uid,
      task: "content_maker",
      status: "error",
      des: `content #${id} — failed to parse ref_video JSON: ${err.message}`,
    });
    return;
  }

  if (!refVideoData?.video) {
    await setContentError(id, "No video filename in ref_video");
    await logUsage({
      uid,
      task: "content_maker",
      status: "error",
      des: `content #${id} — ref_video has no video field`,
    });
    return;
  }

  const apiKey =
    provider.reel_api_key ||
    provider.img2img_api_key ||
    provider.txt2img_api_key;

  let imageUrl;
  try {
    const imagePath = `${__dirname}/../client/public/media/${influencer.photo_url}`;
    imageUrl = await uploadFileToProvider(imagePath, apiKey);
    console.log(`📎 content #${id} image URL: ${imageUrl}`);
  } catch (err) {
    await setContentError(id, `Image upload failed: ${err.message}`);
    await logUsage({
      uid,
      task: "content_maker",
      status: "error",
      des: `content #${id} — image upload failed: ${err.message}`,
    });
    return;
  }

  let videoUrl;
  try {
    const videoPath = `${__dirname}/../client/public/media/${refVideoData.video}`;
    videoUrl = await uploadFileToProvider(videoPath, apiKey);
    console.log(`📎 content #${id} video URL: ${videoUrl}`);
  } catch (err) {
    await setContentError(id, `Video upload failed: ${err.message}`);
    await logUsage({
      uid,
      task: "content_maker",
      status: "error",
      des: `content #${id} — video upload failed: ${err.message}`,
    });
    return;
  }

  const reserved = await reserveCredits(uid, fee);

  if (!reserved) {
    console.log(
      `⏭️  Skipping content #${id} — credits taken by concurrent task`,
    );
    await logUsage({
      uid,
      task: "content_maker",
      status: "skipped",
      des: `content #${id} skipped — credits taken by a concurrent task`,
    });
    return;
  }

  const create = await createJob(provider, "reel", {
    character_image_url: imageUrl,
    reference_video_url: videoUrl,
  });

  if (create.status === "error") {
    await setContentError(id, create.msg);
    await refundCredits(uid, fee);
    console.error(`❌ content #${id} job creation failed:`, create.msg);

    const des = `content #${id} job creation failed — ${fee} credits refunded. Reason: ${create.msg}`;
    await logUsage({
      uid,
      task: "content_maker",
      credits: fee,
      status: "refunded",
      des,
    });
    await notifyUser(user, { task: "Content Video", des, status: "Refunded" });
    return;
  }

  await query(`UPDATE content SET job_id = ? WHERE id = ?`, [
    create.taskId,
    id,
  ]);

  console.log(`🚀 content #${id} job created — taskId: ${create.taskId}`);
  await logUsage({
    uid,
    task: "content_maker",
    credits: fee,
    status: "processing",
    des: `content #${id} job submitted — taskId: ${create.taskId}`,
  });
  await notifyUser(user, {
    task: "Content Video",
    des: `Your content video #${id} is being generated. We'll notify you once it's ready.`,
    status: "Processing",
  });
}

// ============================================
// MAIN RUNNER
// ============================================

async function runContent({ provider }) {
  try {
    const fee = await getCreditFee();

    if (fee < 1) {
      console.log(
        "⚠️  content_video_maker fee not configured by admin, skipping run",
      );
      return;
    }

    const contentList = await query(
      `SELECT * FROM content WHERE status = 'processing'`,
    );

    if (!contentList?.length) return;

    await Promise.allSettled(
      contentList.map((item) => processContent(item, provider, fee)),
    );
  } catch (err) {
    console.error("❌ runContent fatal error:", err.message);
    await logUsage({
      task: "content_maker",
      status: "error",
      des: `runContent fatal crash: ${err.message}`,
    });
  }
}

module.exports = { runContent };

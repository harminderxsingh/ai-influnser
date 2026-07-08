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
  return parseInt(web?.talking_video_maker || 0);
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

async function setTalkingError(id, msg) {
  await query(
    `UPDATE talking_content SET status = 'error', error_message = ? WHERE id = ?`,
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

async function uploadFileToProvider(localPath) {
  if (localPath.startsWith("http")) return localPath;
  const fileName = path.basename(localPath);
  const publicUrl = `${frontendUrl}/media/${fileName}`;
  console.log(`📎 Media URL → ${publicUrl}`);
  return publicUrl;
}

// ============================================
// PROCESS SINGLE TALKING CONTENT ITEM
// ============================================

async function processTalkingContent(item, provider, fee) {
  const {
    id,
    uid,
    job_id,
    image_url,
    text,
    voice,
    lang,
    gender,
    voice_style,
    project_style,
    aspect_ratio,
    character_style,
  } = item;

  // ── Has a job already → poll its status ──────────────────────
  if (job_id) {
    let result;
    try {
      result = await fetchJobStatus(provider, "talking", job_id);
    } catch (err) {
      console.error(
        `❌ fetchJobStatus crashed for talking_content #${id}:`,
        err.message,
      );
      await logUsage({
        uid,
        task: "talking_video_maker",
        status: "error",
        des: `fetchJobStatus crashed for talking_content #${id}: ${err.message}`,
      });
      return;
    }

    if (result.status === "pending") return;

    const user = await getUser(uid);

    if (result.status === "error") {
      await refundCredits(uid, fee);
      await setTalkingError(id, result.msg);
      console.error(`❌ talking_content #${id} job failed — refunded ${fee}cr`);

      const des = `talking_content #${id} job failed — ${fee} credits refunded. Reason: ${result.msg}`;
      await logUsage({
        uid,
        task: "talking_video_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Talking Video",
        des,
        status: "Refunded",
      });
      return;
    }

    // ── success → download and save ───────────────────────────
    let savedPath;
    try {
      savedPath = await downloadImage(
        result.data,
        `${__dirname}/../client/public/media`,
      );
    } catch (err) {
      console.error(
        `❌ downloadImage failed for talking_content #${id}:`,
        err.message,
        "| URL:",
        result.data,
      );
      await refundCredits(uid, fee);
      await setTalkingError(id, `Download failed: ${err.message}`);

      const des = `talking_content #${id} download failed — ${fee}cr refunded. Error: ${err.message}`;
      await logUsage({
        uid,
        task: "talking_video_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Talking Video",
        des,
        status: "Refunded",
      });
      return;
    }

    if (!savedPath) {
      await refundCredits(uid, fee);
      await setTalkingError(id, "Download returned empty path");

      const des = `talking_content #${id} download returned empty — ${fee}cr refunded`;
      await logUsage({
        uid,
        task: "talking_video_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Talking Video",
        des,
        status: "Refunded",
      });
      return;
    }

    await query(
      `UPDATE talking_content SET status = 'active', generated_video = ?, job_id = NULL WHERE id = ?`,
      [savedPath, id],
    );

    console.log(`✅ talking_content #${id} completed — saved to ${savedPath}`);

    const successDes = `talking_content #${id} completed successfully — video saved to ${savedPath}`;
    await logUsage({
      uid,
      task: "talking_video_maker",
      credits: fee,
      status: "success",
      des: successDes,
    });
    await notifyUser(user, {
      task: "Talking Video",
      des: successDes,
      status: "Success",
    });
    return;
  }

  // ── No job yet → validate user ────────────────────────────────
  const user = await getUser(uid);

  if (!user) {
    await setTalkingError(id, "User not found");
    await logUsage({
      uid,
      task: "talking_video_maker",
      status: "error",
      des: `talking_content #${id} — user not found`,
    });
    return;
  }

  const credits = getUserCredits(user);

  if (credits <= 0) {
    console.log(`⏭️  talking_content #${id} — plan expired or no credits`);
    await setTalkingError(id, "Plan expired or no credits available");
    await logUsage({
      uid,
      task: "talking_video_maker",
      credits: 0,
      status: "error",
      des: `talking_content #${id} — plan expired or zero credits`,
    });
    await notifyUser(user, {
      task: "Talking Video",
      des: `Your talking video #${id} could not be processed — your plan has expired or you have no credits.`,
      status: "Failed",
    });
    return;
  }

  if (credits < fee) {
    console.log(
      `⏭️  talking_content #${id} — needs ${fee}cr, has ${credits}cr`,
    );
    await setTalkingError(
      id,
      `Insufficient credits — needs ${fee}, has ${credits}`,
    );
    await logUsage({
      uid,
      task: "talking_video_maker",
      credits,
      status: "error",
      des: `talking_content #${id} — needs ${fee}cr but user only has ${credits}cr`,
    });
    await notifyUser(user, {
      task: "Talking Video",
      des: `Your talking video #${id} could not be processed — you need ${fee} credits but only have ${credits}.`,
      status: "Failed",
    });
    return;
  }

  // ── Build image URL ───────────────────────────────────────────
  if (!image_url) {
    await setTalkingError(id, "No image URL provided");
    await logUsage({
      uid,
      task: "talking_video_maker",
      status: "error",
      des: `talking_content #${id} — image_url is empty`,
    });
    return;
  }

  if (!text) {
    await setTalkingError(id, "No text/script provided");
    await logUsage({
      uid,
      task: "talking_video_maker",
      status: "error",
      des: `talking_content #${id} — text is empty`,
    });
    return;
  }

  let resolvedImageUrl;
  try {
    const localPath = image_url.startsWith("http")
      ? image_url
      : `${__dirname}/../client/public/media/${image_url}`;
    resolvedImageUrl = await uploadFileToProvider(localPath);
    console.log(`📎 talking_content #${id} image URL: ${resolvedImageUrl}`);
  } catch (err) {
    await setTalkingError(id, `Image URL resolution failed: ${err.message}`);
    await logUsage({
      uid,
      task: "talking_video_maker",
      status: "error",
      des: `talking_content #${id} — image URL resolution failed: ${err.message}`,
    });
    return;
  }

  // ── Reserve credits ───────────────────────────────────────────
  const reserved = await reserveCredits(uid, fee);
  if (!reserved) {
    console.log(
      `⏭️  Skipping talking_content #${id} — credits taken by concurrent task`,
    );
    await logUsage({
      uid,
      task: "talking_video_maker",
      status: "skipped",
      des: `talking_content #${id} skipped — credits taken by concurrent task`,
    });
    return;
  }

  // ── Create the job ────────────────────────────────────────────
  const create = await createJob(provider, "talking", {
    imageUrl: resolvedImageUrl,
    text: text,
    voice: voice || "en-US-AriaNeural",
    lang: lang || "en-US",
    gender: gender || "female",
    voiceStyle: voice_style || "general",
    projectStyle: project_style || "close_up",
    aspectRatio: aspect_ratio || "9:16",
    characterStyle: character_style || "realistic",
  });

  if (create.status === "error") {
    await setTalkingError(id, create.msg);
    await refundCredits(uid, fee);
    console.error(`❌ talking_content #${id} job creation failed:`, create.msg);

    const des = `talking_content #${id} job creation failed — ${fee} credits refunded. Reason: ${create.msg}`;
    await logUsage({
      uid,
      task: "talking_video_maker",
      credits: fee,
      status: "refunded",
      des,
    });
    await notifyUser(user, {
      task: "Talking Video",
      des,
      status: "Refunded",
    });
    return;
  }

  await query(`UPDATE talking_content SET job_id = ? WHERE id = ?`, [
    create.taskId,
    id,
  ]);

  console.log(
    `🚀 talking_content #${id} job created — taskId: ${create.taskId}`,
  );
  await logUsage({
    uid,
    task: "talking_video_maker",
    credits: fee,
    status: "processing",
    des: `talking_content #${id} job submitted — taskId: ${create.taskId}`,
  });
  await notifyUser(user, {
    task: "Talking Video",
    des: `Your talking video #${id} is being generated. We'll notify you once it's ready.`,
    status: "Processing",
  });
}

// ============================================
// MAIN RUNNER
// ============================================

async function runTalkingVideo({ provider }) {
  try {
    // Only run if provider supports talking
    if (!provider.talking_enabled) return;

    const fee = await getCreditFee();

    if (fee < 1) {
      console.log(
        "⚠️  talking_video_maker fee not configured by admin, skipping run",
      );
      return;
    }

    const contentList = await query(
      `SELECT * FROM talking_content WHERE status = 'processing'`,
    );

    if (!contentList?.length) return;

    await Promise.allSettled(
      contentList.map((item) => processTalkingContent(item, provider, fee)),
    );
  } catch (err) {
    console.error("❌ runTalkingVideo fatal error:", err.message);
    await logUsage({
      task: "talking_video_maker",
      status: "error",
      des: `runTalkingVideo fatal crash: ${err.message}`,
    });
  }
}

module.exports = { runTalkingVideo };

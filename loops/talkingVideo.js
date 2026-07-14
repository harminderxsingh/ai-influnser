const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { query } = require("../database/connection");
const {
  downloadImage,
  logUsage,
  sendUsageUpdateEmail,
} = require("../utils/common");
const { fetchJobStatus, createJob, buildAuth } = require("./api");
const { mediaToProviderUrl } = require("../utils/mediaUrl");

// Lip-sync (D-ID) finishes in seconds — poll often. Full video gens need longer.
const TALKING_STATUS_POLL_SECONDS = 3;

function isDidProvider(provider) {
  return String(provider?.provider_key || "").toLowerCase() === "d_id";
}

/**
 * D-ID needs a public HTTPS source_url (no localhost / data URLs).
 * Upload local influencer photos to D-ID /images first.
 */
async function uploadImageToDid(provider, localPath) {
  let buffer;
  let mime = "image/jpeg";
  let filename = "face.jpg";

  if (typeof localPath === "string" && localPath.startsWith("data:")) {
    const match = localPath.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL for D-ID upload");
    mime = match[1] || "image/jpeg";
    buffer = Buffer.from(match[2], "base64");
    filename = mime.includes("png") ? "face.png" : "face.jpg";
  } else if (
    typeof localPath === "string" &&
    (localPath.startsWith("http://") || localPath.startsWith("https://"))
  ) {
    const parsed = new URL(localPath);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";
    if (!isLocal && localPath.startsWith("https://")) {
      return localPath;
    }
    const filePath = path.join(
      __dirname,
      "../client/public/media",
      path.basename(parsed.pathname),
    );
    if (!fs.existsSync(filePath)) {
      throw new Error(`Media file not found for D-ID: ${filePath}`);
    }
    buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    mime = ext === ".png" ? "image/png" : "image/jpeg";
    filename = path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50);
  } else {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Media file not found for D-ID: ${localPath}`);
    }
    buffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    mime = ext === ".png" ? "image/png" : "image/jpeg";
    filename = path.basename(localPath).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50);
  }

  const auth = buildAuth(provider, "talking");
  const baseUrl = String(provider.talking_base_url || "https://api.d-id.com").replace(
    /\/+$/,
    "",
  );
  const form = new FormData();
  form.append("image", new Blob([buffer], { type: mime }), filename);

  const response = await axios.post(`${baseUrl}/images`, form, {
    headers: { ...auth.headers },
    timeout: 60000,
    validateStatus: (s) => s >= 200 && s < 400,
  });

  const url = response.data?.url;
  if (!url) {
    throw new Error(
      `D-ID image upload returned no url: ${JSON.stringify(response.data)}`,
    );
  }
  console.log(`📎 D-ID image uploaded → ${url}`);
  return url;
}

async function resolveTalkingImageUrl(provider, image_url) {
  const localPath = image_url.startsWith("http")
    ? image_url
    : path.join(__dirname, "../client/public/media", image_url);

  if (isDidProvider(provider)) {
    return uploadImageToDid(provider, localPath);
  }
  return mediaToProviderUrl(localPath);
}

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

async function claimTalkingForSubmission(id) {
  const result = await query(
    `UPDATE talking_content
     SET status = 'submitting'
     WHERE id = ?
       AND status = 'processing'
       AND (job_id IS NULL OR job_id = '')`,
    [id],
  );

  return result.affectedRows > 0;
}

async function releaseTalkingClaim(id) {
  await query(
    `UPDATE talking_content
     SET status = 'processing'
     WHERE id = ?
       AND status = 'submitting'
       AND (job_id IS NULL OR job_id = '')`,
    [id],
  );
}

async function touchTalkingStatusCheck(id) {
  await query(
    `UPDATE talking_content
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
    `UPDATE talking_content
     SET status = 'processing'
     WHERE status = 'submitting'
       AND job_id IS NOT NULL
       AND job_id <> ''`,
    [],
  );

  await query(
    `UPDATE talking_content
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

    if (result.status === "pending") {
      await touchTalkingStatusCheck(id);
      return;
    }

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
      const apiKey =
        provider?.talking_api_key ||
        provider?.showcase_api_key ||
        provider?.txt2img_api_key ||
        "";
      console.log(`⬇️  talking_content #${id} downloading video…`);
      savedPath = await downloadImage(
        result.data,
        `${__dirname}/../client/public/media`,
        { apiKey, timeout: 120000 },
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

  const claimed = await claimTalkingForSubmission(id);
  if (!claimed) {
    console.log(`⏭️  talking_content #${id} already claimed for submission`);
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
    resolvedImageUrl = await resolveTalkingImageUrl(provider, image_url);
    console.log(
      `📎 talking_content #${id} image URL (${provider.provider_key}): ${String(resolvedImageUrl).slice(0, 80)}…`,
    );
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
    await releaseTalkingClaim(id);
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

  const saved = await query(
    `UPDATE talking_content
     SET status = 'processing', job_id = ?
     WHERE id = ?
       AND status = 'submitting'
       AND (job_id IS NULL OR job_id = '')`,
    [create.taskId, id],
  );

  if (!saved.affectedRows) {
    const [row] = await query(`SELECT job_id FROM talking_content WHERE id = ?`, [
      id,
    ]);

    if (row?.job_id) {
      await query(
        `UPDATE talking_content
         SET status = 'processing'
         WHERE id = ?
           AND status = 'submitting'`,
        [id],
      );
      console.log(
        `⚠️  talking_content #${id} reconciled submitting → processing`,
      );
      return;
    }

    console.error(
      `⚠️  talking_content #${id} job ${create.taskId} created but row already has a job_id — refunding duplicate charge`,
    );
    await refundCredits(uid, fee);
    return;
  }

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

    await recoverStaleSubmissions();

    const contentList = await query(
      `SELECT * FROM talking_content
       WHERE status IN ('processing', 'submitting')
         AND NOT (
           status = 'submitting'
           AND (job_id IS NULL OR job_id = '')
         )
         AND (
           job_id IS NULL
           OR job_id = ''
           OR updated_at < DATE_SUB(NOW(), INTERVAL ${TALKING_STATUS_POLL_SECONDS} SECOND)
         )`,
    );

    if (!contentList?.length) return;

    for (const item of contentList) {
      await processTalkingContent(item, provider, fee);
    }
  } catch (err) {
    console.error("❌ runTalkingVideo fatal error:", err.message);
    await logUsage({
      task: "talking_video_maker",
      status: "error",
      des: `runTalkingVideo fatal crash: ${err.message}`,
    });
  }
}

async function triggerTalkingVideo(id) {
  try {
    const { getActiveProvider } = require("../utils/aiProvider");
    const provider = await getActiveProvider("talking");
    if (!provider?.talking_enabled) {
      return { success: false, msg: "No active talking video provider found" };
    }

    const fee = await getCreditFee();
    if (fee < 1) {
      return {
        success: false,
        msg: "Talking video credit fee is not configured",
      };
    }

    const [item] = await query(`SELECT * FROM talking_content WHERE id = ?`, [
      id,
    ]);
    if (!item) return { success: false, msg: "Talking video task not found" };

    if (!["processing", "submitting"].includes(item.status)) {
      return { success: true, status: item.status, job_id: item.job_id };
    }

    await processTalkingContent(item, provider, fee);

    const [fresh] = await query(
      `SELECT status, job_id, error_message FROM talking_content WHERE id = ?`,
      [id],
    );

    return {
      success: true,
      status: fresh?.status || item.status,
      job_id: fresh?.job_id || null,
      error_message: fresh?.error_message || null,
    };
  } catch (err) {
    console.error("triggerTalkingVideo failed:", err.message);
    return { success: false, msg: err.message };
  }
}

module.exports = { runTalkingVideo, triggerTalkingVideo };

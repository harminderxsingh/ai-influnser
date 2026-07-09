const { query } = require("../database/connection");
const {
  downloadImage,
  logUsage,
  sendUsageUpdateEmail,
} = require("../utils/common");
const { fetchJobStatus, createJob } = require("./api");

const INF_STATUS_POLL_SECONDS = 30;

// ============================================
// HELPERS
// ============================================

async function getUser(uid) {
  const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  return user || null;
}

async function getCreditFee() {
  const [web] = await query(`SELECT * FROM web_private`);
  return parseInt(web?.inf_maker || 0);
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

async function setInfError(id, msg) {
  await query(
    `UPDATE influencers SET status = 'error', error_message = ? WHERE id = ?`,
    [msg, id],
  );
}

async function claimInfluencerForSubmission(id) {
  const result = await query(
    `UPDATE influencers
     SET status = 'submitting'
     WHERE id = ?
       AND status = 'processing'
       AND (job_id IS NULL OR job_id = '')`,
    [id],
  );

  return result.affectedRows > 0;
}

async function releaseInfluencerClaim(id) {
  await query(
    `UPDATE influencers
     SET status = 'processing'
     WHERE id = ?
       AND status = 'submitting'
       AND (job_id IS NULL OR job_id = '')`,
    [id],
  );
}

async function touchInfluencerStatusCheck(id) {
  await query(
    `UPDATE influencers
     SET updated_at = NOW()
     WHERE id = ?
       AND status = 'processing'
       AND job_id IS NOT NULL
       AND job_id <> ''`,
    [id],
  );
}

async function recoverStaleSubmissions() {
  await query(
    `UPDATE influencers
     SET status = 'processing'
     WHERE status = 'submitting'
       AND (job_id IS NULL OR job_id = '')
       AND updated_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
    [],
  );
}

// ── Send email helper (fire-and-forget, never throws) ─────────
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
// PROCESS SINGLE INFLUENCER
// ============================================

async function processInfluencer(inf, provider, fee) {
  const { id, uid, job_id, prompt } = inf;

  // ── Has a job already → poll its status ───────────────────────
  if (job_id) {
    let result;

    try {
      result = await fetchJobStatus(provider, "txt2img", job_id);
    } catch (err) {
      console.error(`❌ fetchJobStatus crashed for inf #${id}:`, err.message);
      await logUsage({
        uid,
        task: "inf_maker",
        status: "error",
        des: `fetchJobStatus crashed for inf #${id}: ${err.message}`,
      });
      return;
    }

    if (result.status === "pending") {
      await touchInfluencerStatusCheck(id);
      return;
    }

    // ── Fetch user once — needed for email from here on ──────
    const user = await getUser(uid);

    if (result.status === "error") {
      await refundCredits(uid, fee);
      await setInfError(id, result.msg);
      console.error(`❌ inf #${id} job failed — refunded ${fee}cr`);

      const des = `inf #${id} job failed — ${fee} credits refunded. Reason: ${result.msg}`;
      await logUsage({
        uid,
        task: "inf_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Influencer Maker",
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
        `❌ downloadImage failed for inf #${id}:`,
        err.message,
        "| URL:",
        result.data,
      );
      await refundCredits(uid, fee);
      await setInfError(id, `downloadImage failed: ${err.message}`);

      const des = `inf #${id} download failed — ${fee}cr refunded. Error: ${err.message} | URL: ${result.data}`;
      await logUsage({
        uid,
        task: "inf_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Influencer Maker",
        des,
        status: "Refunded",
      });
      return;
    }

    if (!savedPath) {
      console.error(
        `❌ downloadImage returned empty for inf #${id}, URL:`,
        result.data,
      );
      await refundCredits(uid, fee);
      await setInfError(id, "downloadImage returned empty path");

      const des = `inf #${id} download returned empty — ${fee}cr refunded | URL: ${result.data}`;
      await logUsage({
        uid,
        task: "inf_maker",
        credits: fee,
        status: "refunded",
        des,
      });
      await notifyUser(user, {
        task: "Influencer Maker",
        des,
        status: "Refunded",
      });
      return;
    }

    await query(
      `UPDATE influencers SET status = 'active', photo_url = ? WHERE id = ?`,
      [savedPath, id],
    );

    console.log(`✅ inf #${id} completed — saved to ${savedPath}`);

    const successDes = `inf #${id} completed successfully — image saved to ${savedPath}`;
    await logUsage({
      uid,
      task: "inf_maker",
      credits: fee,
      status: "success",
      des: successDes,
    });
    await notifyUser(user, {
      task: "Influencer Maker",
      des: successDes,
      status: "Success",
    });
    return;
  }

  const claimed = await claimInfluencerForSubmission(id);
  if (!claimed) {
    console.log(`⏭️  inf #${id} already claimed for submission`);
    return;
  }

  // ── No job yet → validate user ────────────────────────────────
  const user = await getUser(uid);

  if (!user) {
    await setInfError(id, "User not found");
    await logUsage({
      uid,
      task: "inf_maker",
      status: "error",
      des: `inf #${id} — user not found in database`,
    });
    return;
  }

  const credits = getUserCredits(user);

  if (credits <= 0) {
    console.log(`⏭️  inf #${id} — plan expired or no credits`);
    await setInfError(id, "Plan expired or no credits available");
    await logUsage({
      uid,
      task: "inf_maker",
      credits: 0,
      status: "error",
      des: `inf #${id} — plan expired or zero credits`,
    });
    await notifyUser(user, {
      task: "Influencer Maker",
      des: `Your influencer #${id} could not be processed — your plan has expired or you have no credits.`,
      status: "Failed",
    });
    return;
  }

  if (credits < fee) {
    console.log(`⏭️  inf #${id} — needs ${fee}cr, has ${credits}cr`);
    await setInfError(
      id,
      `Insufficient credits — needs ${fee}, has ${credits}`,
    );
    await logUsage({
      uid,
      task: "inf_maker",
      credits,
      status: "error",
      des: `inf #${id} — needs ${fee}cr but user only has ${credits}cr`,
    });
    await notifyUser(user, {
      task: "Influencer Maker",
      des: `Your influencer #${id} could not be processed — you need ${fee} credits but only have ${credits}.`,
      status: "Failed",
    });
    return;
  }

  // ── Atomically reserve credits ────────────────────────────────
  const reserved = await reserveCredits(uid, fee);

  if (!reserved) {
    console.log(`⏭️  Skipping inf #${id} — credits taken by concurrent task`);
    await releaseInfluencerClaim(id);
    await logUsage({
      uid,
      task: "inf_maker",
      status: "skipped",
      des: `inf #${id} skipped — credits taken by a concurrent task`,
    });
    return;
  }

  // ── Create the job ────────────────────────────────────────────
  const create = await createJob(provider, "txt2img", { prompt });

  if (create.status === "error") {
    await setInfError(id, create.msg);
    await refundCredits(uid, fee);
    console.error(`❌ inf #${id} job creation failed:`, create.msg);

    const des = `inf #${id} job creation failed — ${fee} credits refunded. Reason: ${create.msg}`;
    await logUsage({
      uid,
      task: "inf_maker",
      credits: fee,
      status: "refunded",
      des,
    });
    await notifyUser(user, {
      task: "Influencer Maker",
      des,
      status: "Refunded",
    });
    return;
  }

  const saved = await query(
    `UPDATE influencers
     SET status = 'processing', job_id = ?
     WHERE id = ?
       AND status = 'submitting'
       AND (job_id IS NULL OR job_id = '')`,
    [create.taskId, id],
  );

  if (!saved.affectedRows) {
    console.error(
      `⚠️  inf #${id} job ${create.taskId} created but row already has a job_id - refunding duplicate charge`,
    );
    await refundCredits(uid, fee);
    return;
  }

  console.log(`🚀 inf #${id} job created — taskId: ${create.taskId}`);
  await logUsage({
    uid,
    task: "inf_maker",
    credits: fee,
    status: "processing",
    des: `inf #${id} job submitted — taskId: ${create.taskId}`,
  });
  await notifyUser(user, {
    task: "Influencer Maker",
    des: `Your influencer #${id} is being generated. We'll notify you once it's ready.`,
    status: "Processing",
  });
}

// ============================================
// MAIN RUNNER
// ============================================

async function runMakeInf({ provider }) {
  try {
    const fee = await getCreditFee();

    if (fee < 1) {
      console.log("⚠️  Credit fee not configured by admin, skipping run");
      return;
    }

    await recoverStaleSubmissions();

    const infList = await query(
      `SELECT * FROM influencers
       WHERE status = 'processing'
         AND (
           job_id IS NULL
           OR job_id = ''
           OR updated_at < DATE_SUB(NOW(), INTERVAL ${INF_STATUS_POLL_SECONDS} SECOND)
         )`,
    );

    if (!infList?.length) return;

    for (const inf of infList) {
      await processInfluencer(inf, provider, fee);
    }
  } catch (err) {
    console.error("❌ runMakeInf fatal error:", err.message);
    await logUsage({
      task: "inf_maker",
      status: "error",
      des: `runMakeInf fatal crash: ${err.message}`,
    });
  }
}

module.exports = { runMakeInf, logUsage };

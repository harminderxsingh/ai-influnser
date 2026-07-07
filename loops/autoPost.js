// loops/autoPost.js
const { query } = require("../database/connection");
const moment = require("moment-timezone");

async function processScheduledPosts() {
  try {
    // ── Fetch all pending scheduled posts where time has come ──
    const posts = await query(
      `SELECT * FROM scheduled_posts 
       WHERE status = 'pending' 
         AND post_now = 0 
         AND scheduled_at_utc IS NOT NULL
         AND scheduled_at_utc <= UTC_TIMESTAMP()`,
    );

    if (!posts.length) return;

    console.log(`[autoPost] Found ${posts.length} post(s) to publish`);

    for (const post of posts) {
      console.log(
        `[autoPost] Processing post ID: ${post.id} → ${post.platform}`,
      );

      try {
        const fullCaption = [post.caption, post.hashtags]
          .filter(Boolean)
          .join("\n\n");

        let result = null;

        // ── Instagram ──────────────────────────────────────
        if (post.platform === "instagram") {
          const { publishToInstagram } = require("../utils/instaPublish");

          const [account] = await query(
            `SELECT * FROM instagram_accounts WHERE id = ?`,
            [post.account_id],
          );

          if (!account) {
            await markFailed(post.id, "Instagram account not found");
            continue;
          }

          console.log(`[autoPost][instagram] Posting to: ${account.username}`);
          console.log(`[autoPost][instagram] Media URL : ${post.media_url}`);

          result = await publishToInstagram({
            account,
            mediaUrl: post.media_url,
            mediaType: post.media_type || "IMAGE",
            caption: fullCaption,
          });

          console.log(
            `[autoPost][instagram] Result:`,
            JSON.stringify(result, null, 2),
          );

          if (result?.id) {
            await markPosted(post.id, result.id);
          } else {
            const errMsg =
              result?.error?.message ||
              result?.error?.error_user_msg ||
              "Instagram publish failed";
            await markFailed(post.id, errMsg);
          }
        }

        // ── TikTok ─────────────────────────────────────────
        else if (post.platform === "tiktok") {
          const { publishToTiktok } = require("../utils/tiktokPublish");

          const [account] = await query(
            `SELECT * FROM tiktok_accounts WHERE id = ?`,
            [post.account_id],
          );

          if (!account) {
            await markFailed(post.id, "TikTok account not found");
            continue;
          }

          console.log(`[autoPost][tiktok] Posting to: ${account.username}`);
          console.log(`[autoPost][tiktok] Media URL : ${post.media_url}`);

          result = await publishToTiktok({
            account,
            mediaUrl: post.media_url,
            mediaType: post.media_type || "VIDEO",
            caption: fullCaption,
          });

          console.log(
            `[autoPost][tiktok] Result:`,
            JSON.stringify(result, null, 2),
          );

          if (result?.publish_id) {
            await markPosted(post.id, result.publish_id);
          } else {
            const errMsg = result?.error?.message || "TikTok publish failed";
            await markFailed(post.id, errMsg);
          }
        } else {
          await markFailed(post.id, `Unknown platform: ${post.platform}`);
        }
      } catch (postErr) {
        console.error(
          `[autoPost] Error processing post ${post.id}:`,
          postErr.message,
        );
        await markFailed(post.id, postErr.message);
      }
    }
  } catch (err) {
    console.error("[autoPost] Loop error:", err.message);
  }
}

// ── Helpers ───────────────────────────────────────────────
async function markPosted(id, platformPostId) {
  await query(
    `UPDATE scheduled_posts 
     SET status = 'posted', platform_post_id = ?, posted_at = NOW() 
     WHERE id = ?`,
    [platformPostId, id],
  );
  console.log(`[autoPost] ✅ Post ${id} marked as posted`);
}

async function markFailed(id, errorMessage) {
  await query(
    `UPDATE scheduled_posts 
     SET status = 'failed', error_message = ? 
     WHERE id = ?`,
    [errorMessage, id],
  );
  console.log(`[autoPost] ❌ Post ${id} marked as failed: ${errorMessage}`);
}

// ── Init — runs every 60 seconds ──────────────────────────
function autoPostInit() {
  console.log("[autoPost] Scheduler started — checking every 60 seconds");

  // run immediately on start
  processScheduledPosts();

  // then every 60s
  setInterval(processScheduledPosts, 60 * 1000);
}

module.exports = { autoPostInit };

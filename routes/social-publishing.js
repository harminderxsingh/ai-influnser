const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const { getEnv } = require("../utils/common");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const moment = require("moment-timezone");

function buildMediaUrl(filename) {
  const env = getEnv();
  return `${env.frontendUrl}/media/${filename}`;
}

// ─── GET /accounts ────────────────────────────────────────
router.get("/accounts", validateUser, checkPlan, async (req, res) => {
  try {
    const instaAccounts = await query(
      `SELECT id, username, name, profile_pic, 'instagram' AS platform
       FROM instagram_accounts WHERE uid = ?`,
      [req.decode.uid],
    );
    const tiktokAccounts = await query(
      `SELECT id, username, display_name AS name, avatar_url AS profile_pic, 'tiktok' AS platform
       FROM tiktok_accounts WHERE uid = ?`,
      [req.decode.uid],
    );
    res.json({
      success: true,
      accounts: [...instaAccounts, ...tiktokAccounts],
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ─── GET /get_medias ──────────────────────────────────────
router.get("/get_medias", validateUser, checkPlan, async (req, res) => {
  try {
    const influencersPhotos = await query(
      `SELECT * FROM influencers WHERE uid = ? AND status = 'active' ORDER BY created_at DESC`,
      [req.decode.uid],
    );
    const gallaryPhotos = await query(
      `SELECT * FROM gallery WHERE uid = ? AND status = 'active'`,
      [req.decode.uid],
    );
    const contentVideos = await query(
      `SELECT * FROM content WHERE uid = ? AND status = 'active'`,
      [req.decode.uid],
    );
    const productVideos = await query(
      `SELECT * FROM product_content WHERE uid = ? AND status = 'active' ORDER BY created_at DESC`,
      [req.decode.uid],
    );

    res.json({
      success: true,
      data: {
        influencersPhotos: influencersPhotos || [],
        gallaryPhotos: gallaryPhotos || [],
        contentVideos: contentVideos || [],
        productVideos: productVideos || [],
      },
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// ─── GET /my_posts ────────────────────────────────────────
router.get("/my_posts", validateUser, async (req, res) => {
  try {
    const posts = await query(
      `SELECT * FROM scheduled_posts WHERE uid = ? ORDER BY createdAt DESC`,
      [req.decode.uid],
    );
    res.json({ success: true, posts });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// ─── POST /create_post ────────────────────────────────────
router.post("/create_post", validateUser, checkPlan, async (req, res) => {
  try {
    const {
      platform,
      account_id,
      source_type,
      source_id,
      media_url, // ← frontend sends full URL like http://localhost:5000/media/rkJ7J.jpg
      media_type,
      caption,
      hashtags,
      post_now,
      scheduled_at,
      timezone,
    } = req.body;

    // ── Validation ────────────────────────────────────────
    if (!platform || !account_id || !media_url || !source_type || !source_id) {
      return res.json({
        success: false,
        msg: "platform, account_id, source_type, source_id and media_url are required",
      });
    }

    if (!post_now && !scheduled_at) {
      return res.json({
        success: false,
        msg: "Please provide scheduled_at for scheduled posts",
      });
    }

    if (!post_now && scheduled_at) {
      const scheduledMoment = moment.tz(scheduled_at, timezone || "UTC");
      if (scheduledMoment.isBefore(moment())) {
        return res.json({
          success: false,
          msg: "Scheduled time must be in the future",
        });
      }
    }

    // ── Extract filename and rebuild with public frontendUrl ──
    // frontend sends: http://localhost:5000/media/rkJ7J.jpg
    // we extract:     rkJ7J.jpg
    // we rebuild:     https://chigger-endless-whale.ngrok-free.app/media/rkJ7J.jpg
    const filename = media_url.split("/media/").pop();
    const mediaUrl = buildMediaUrl(filename);
    console.log("[social-publishing] Original URL :", media_url);
    console.log("[social-publishing] Rebuilt URL  :", mediaUrl);

    // ── Convert scheduled_at to UTC ───────────────────────
    let scheduledUtc = null;
    if (!post_now && scheduled_at) {
      scheduledUtc = moment
        .tz(scheduled_at, timezone || "UTC")
        .utc()
        .format("YYYY-MM-DD HH:mm:ss");
    }

    // ── Save record to DB ─────────────────────────────────
    const insertResult = await query(
      `INSERT INTO scheduled_posts
        (uid, platform, account_id, media_url, media_type,
         source_type, source_id, caption, hashtags,
         timezone, scheduled_at_utc, post_now, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.decode.uid,
        platform,
        account_id,
        mediaUrl,
        media_type || "IMAGE",
        source_type,
        source_id,
        caption || "",
        hashtags || "",
        timezone || "UTC",
        scheduledUtc,
        post_now ? 1 : 0,
        "pending",
      ],
    );

    const postDbId = insertResult.insertId;

    // ── Post now ──────────────────────────────────────────
    if (post_now) {
      const fullCaption = [caption, hashtags].filter(Boolean).join("\n\n");

      // ── Instagram ───────────────────────────────────────
      if (platform === "instagram") {
        const { publishToInstagram } = require("../utils/instaPublish");

        const [account] = await query(
          `SELECT * FROM instagram_accounts WHERE id = ? AND uid = ?`,
          [account_id, req.decode.uid],
        );
        if (!account) {
          return res.json({
            success: false,
            msg: "Instagram account not found",
          });
        }

        console.log("[instagram] Posting to:", account.username);
        console.log("[instagram] Media URL :", mediaUrl);
        console.log("[instagram] Media Type:", media_type);

        const result = await publishToInstagram({
          account,
          mediaUrl,
          mediaType: media_type || "IMAGE",
          caption: fullCaption,
        });

        console.log("[instagram] Result:", JSON.stringify(result, null, 2));

        if (result?.id) {
          await query(
            `UPDATE scheduled_posts SET status = 'posted', platform_post_id = ?, posted_at = NOW() WHERE id = ?`,
            [result.id, postDbId],
          );
          return res.json({
            success: true,
            msg: "Posted to Instagram successfully",
            postId: result.id,
          });
        } else {
          const errMsg =
            result?.error?.message ||
            result?.error?.error_user_msg ||
            "Instagram publish failed";
          await query(
            `UPDATE scheduled_posts SET status = 'failed', error_message = ? WHERE id = ?`,
            [errMsg, postDbId],
          );
          return res.json({ success: false, msg: errMsg });
        }
      }

      // ── TikTok ──────────────────────────────────────────
      if (platform === "tiktok") {
        const { publishToTiktok } = require("../utils/tiktokPublish");

        const [account] = await query(
          `SELECT * FROM tiktok_accounts WHERE id = ? AND uid = ?`,
          [account_id, req.decode.uid],
        );
        if (!account) {
          return res.json({ success: false, msg: "TikTok account not found" });
        }

        console.log("[tiktok] Posting to:", account.username);
        console.log("[tiktok] Media URL :", mediaUrl);

        const result = await publishToTiktok({
          account,
          mediaUrl,
          mediaType: media_type || "VIDEO",
          caption: fullCaption,
        });

        console.log("[tiktok] Result:", JSON.stringify(result, null, 2));

        if (result?.publish_id) {
          await query(
            `UPDATE scheduled_posts SET status = 'posted', platform_post_id = ?, posted_at = NOW() WHERE id = ?`,
            [result.publish_id, postDbId],
          );
          return res.json({
            success: true,
            msg: "Posted to TikTok successfully",
            publishId: result.publish_id,
          });
        } else {
          const errMsg = result?.error?.message || "TikTok publish failed";
          await query(
            `UPDATE scheduled_posts SET status = 'failed', error_message = ? WHERE id = ?`,
            [errMsg, postDbId],
          );
          return res.json({ success: false, msg: errMsg });
        }
      }
    }

    // ── Scheduled → saved, cron picks it up later ─────────
    return res.json({
      success: true,
      msg: `Post scheduled for ${moment
        .utc(scheduledUtc)
        .tz(timezone || "UTC")
        .format("MMM D, YYYY [at] h:mm A z")}`,
      postDbId,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// ─── DELETE /delete_post/:id ──────────────────────────────
router.post("/delete_post/", validateUser, async (req, res) => {
  try {
    await query(
      `DELETE FROM scheduled_posts WHERE id = ? AND uid = ?`,
      // ↑ removed AND status = 'pending' so any post can be deleted
      [req.body.id, req.decode.uid],
    );
    res.json({ success: true, msg: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const { uploadImage, deleteFile } = require("../utils/common");
const path = require("path");
const { normalizeSubmissionKey } = require("../utils/submissionKey");
const { triggerProductShowcase } = require("../loops/productShow");

// add content
router.post("/add_new", validateUser, checkPlan, async (req, res) => {
  try {
    const { model, ref_video, submission_key } = req.body;
    const submissionKey = normalizeSubmissionKey(submission_key);
    const uid = req.decode.uid;

    if (!model || !ref_video) {
      return res.json({
        msg: "Please select a model and a video",
        success: false,
      });
    }

    const modelJson = JSON.stringify(model);
    const refVideoJson = JSON.stringify(ref_video);

    if (submissionKey) {
      const [existing] = await query(
        `SELECT id FROM content WHERE uid = ? AND submission_key = ?`,
        [uid, submissionKey],
      );

      if (existing) {
        return res.json({
          success: true,
          msg: "The video is already getting ready...",
          id: existing.id,
        });
      }
    }

    const [recentDuplicate] = await query(
      `SELECT id FROM content
       WHERE uid = ?
         AND model = ?
         AND ref_video = ?
         AND status IN ('processing', 'submitting')
         AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
       ORDER BY id DESC
       LIMIT 1`,
      [uid, modelJson, refVideoJson],
    );

    if (recentDuplicate) {
      return res.json({
        success: true,
        msg: "The video is already getting ready...",
        id: recentDuplicate.id,
      });
    }

    try {
      await query(
        `INSERT INTO content (uid, model, ref_video, status, submission_key) VALUES (?,?,?,?,?)`,
        [uid, modelJson, refVideoJson, "processing", submissionKey],
      );
    } catch (insertErr) {
      if (insertErr.code === "ER_DUP_ENTRY") {
        const [existing] = await query(
          `SELECT id FROM content WHERE uid = ? AND submission_key = ?`,
          [uid, submissionKey],
        );

        return res.json({
          success: true,
          msg: "The video is already getting ready...",
          id: existing?.id,
        });
      }

      throw insertErr;
    }

    res.json({ success: true, msg: "The video is getting ready..." });
  } catch (err) {
    console.error("Add model error:", err);
    res.json({
      success: false,
      msg: "Something went wrong. Please try again.",
      err,
    });
  }
});

// get all gallery
router.get("/get_all", validateUser, checkPlan, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM content WHERE uid = ?`, [
      req.decode.uid,
    ]);
    res.json({ data, success: true });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      msg: "Something went wrong",
    });
  }
});

// del a content
router.post("/del_one", validateUser, checkPlan, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM content WHERE id = ?`, [id]);
    res.json({ success: true, msg: "The content is deleted" });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      msg: "Something went wrong",
    });
  }
});

// Add product content
router.post(
  "/add_new_product_content",
  validateUser,
  checkPlan,
  async (req, res) => {
    try {
      const {
        model_id,
        model_name,
        prompt,
        aspect_ratio,
        submission_key,
        influencer_mode,
      } = req.body;
      const submissionKey = normalizeSubmissionKey(submission_key);
      const uid = req.decode.uid;
      const useSelectedInfluencer = influencer_mode === "select" && model_id;

      if (!req.files || !req.files.product_image) {
        return res.json({
          msg: "Please upload a product image",
          success: false,
        });
      }

      if (submissionKey) {
        const [existing] = await query(
          `SELECT id FROM product_content WHERE uid = ? AND submission_key = ?`,
          [uid, submissionKey],
        );

        if (existing) {
          const triggerResult = await triggerProductShowcase(existing.id);
          if (!triggerResult.success) {
            return res.json({
              success: false,
              msg: triggerResult.msg,
              id: existing.id,
            });
          }

          return res.json({
            success: true,
            msg: "The video is already getting ready...",
            id: existing.id,
            job_id: triggerResult.job_id,
            status: triggerResult.status,
          });
        }
      }

      let modelData = null;
      if (useSelectedInfluencer) {
        [modelData] = await query(
          `SELECT * FROM influencers
           WHERE id = ?
             AND uid = ?
             AND status = 'active'
             AND photo_url IS NOT NULL
             AND photo_url <> ''`,
          [model_id, uid],
        );

        if (!modelData) {
          return res.json({
            msg: "Selected influencer is not ready yet. Please choose an active influencer with a photo.",
            success: false,
          });
        }
      }

      const modelJson = modelData ? JSON.stringify(modelData) : null;
      const promptText = (prompt || "").trim();

      if (modelData) {
        const [recentDuplicate] = await query(
          `SELECT id FROM product_content
           WHERE uid = ?
             AND model = ?
             AND prompt = ?
             AND status IN ('processing', 'submitting')
             AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
           ORDER BY id DESC
           LIMIT 1`,
          [uid, modelJson, promptText],
        );

        if (recentDuplicate) {
          const triggerResult = await triggerProductShowcase(recentDuplicate.id);
          if (!triggerResult.success) {
            return res.json({
              success: false,
              msg: triggerResult.msg,
              id: recentDuplicate.id,
            });
          }

          return res.json({
            success: true,
            msg: "The video is already getting ready...",
            id: recentDuplicate.id,
            job_id: triggerResult.job_id,
            status: triggerResult.status,
          });
        }
      }

      // Upload image
      const uploadResult = await uploadImage(
        req.files.product_image,
        path.join(__dirname, "../client/public/media"),
        ["jpeg", "jpg", "png", "webp"],
        10,
      );

      if (!uploadResult.success) {
        return res.json({
          success: false,
          msg: uploadResult.msg,
        });
      }

      // Prepare other data JSON
      const otherData = {
        aspect_ratio: aspect_ratio || "9:16",
        influencer_mode: useSelectedInfluencer ? "select" : "auto",
        auto_mode: !useSelectedInfluencer,
        product_image_name: req.files.product_image.name,
        user_prompt: promptText,
      };

      // Insert into database
      let insertResult;
      try {
        insertResult = await query(
          `INSERT INTO product_content
            (uid, model, ref_photo, prompt, other, status, submission_key)
           VALUES (?,?,?,?,?,?,?)`,
          [
            uid,
            modelJson,
            uploadResult.filename,
            promptText,
            JSON.stringify(otherData),
            "processing",
            submissionKey,
          ],
        );
      } catch (insertErr) {
        if (insertErr.code === "ER_DUP_ENTRY") {
          const [existing] = await query(
            `SELECT id FROM product_content WHERE uid = ? AND submission_key = ?`,
            [uid, submissionKey],
          );

          let triggerResult = null;
          if (existing?.id) {
            triggerResult = await triggerProductShowcase(existing.id);
            if (!triggerResult.success) {
              return res.json({
                success: false,
                msg: triggerResult.msg,
                id: existing.id,
              });
            }
          }

          return res.json({
            success: true,
            msg: "The video is already getting ready...",
            id: existing?.id,
            job_id: triggerResult?.job_id,
            status: triggerResult?.status,
          });
        }

        throw insertErr;
      }

      const triggerResult = await triggerProductShowcase(insertResult.insertId);
      if (!triggerResult.success) {
        return res.json({
          success: false,
          msg: triggerResult.msg,
          id: insertResult.insertId,
        });
      }

      res.json({
        success: true,
        msg: "The video is getting ready...",
        id: insertResult.insertId,
        job_id: triggerResult.job_id,
        status: triggerResult.status,
      });
    } catch (err) {
      console.error("Add product content error:", err);
      res.json({
        success: false,
        msg: "Something went wrong. Please try again.",
        err: err.message,
      });
    }
  },
);

// Get all product content
router.get(
  "/get_all_product_content",
  validateUser,
  checkPlan,
  async (req, res) => {
    try {
      await query(
        `UPDATE product_content
         SET status = 'processing', error_message = NULL
         WHERE uid = ?
           AND status = 'error'
           AND error_message = 'Influencer has no photo'
           AND (
             model IS NULL
             OR model = ''
             OR model = 'null'
             OR model = '{}'
             OR other LIKE '%"auto_mode":true%'
             OR other LIKE '%"auto_mode":1%'
             OR other LIKE '%"auto_mode":"true"%'
             OR other LIKE '%"influencer_mode":"auto"%'
           )`,
        [req.decode.uid],
      );

      const brokenAutoRows = await query(
        `SELECT id, other, generated_video
         FROM product_content
         WHERE uid = ?
           AND status = 'active'
           AND generated_video IS NOT NULL
           AND generated_video <> ''
           AND generated_video NOT REGEXP '\\\\.(mp4|mov|webm|m4v)$'
           AND (
             other LIKE '%"auto_mode":true%'
             OR other LIKE '%"influencer_mode":"auto"%'
           )`,
        [req.decode.uid],
      );

      for (const row of brokenAutoRows) {
        let otherData = {};
        try {
          otherData = row.other ? JSON.parse(row.other) : {};
        } catch {
          otherData = {};
        }

        otherData.auto_stage = "showcase_video";
        delete otherData.auto_influencer_photo;
        delete otherData.auto_influencer_job_id;

        await query(
          `UPDATE product_content
           SET status = 'processing',
               generated_video = NULL,
               error_message = NULL,
               job_id = NULL,
               other = ?
           WHERE id = ? AND uid = ?`,
          [JSON.stringify(otherData), row.id, req.decode.uid],
        );

      }

      const data = await query(
        `SELECT * FROM product_content WHERE uid = ? ORDER BY created_at DESC`,
        [req.decode.uid],
      );
      res.json({ data, success: true });
    } catch (err) {
      console.error(err);
      res.json({
        success: false,
        msg: "Something went wrong",
      });
    }
  },
);

// In your delete route
router.post(
  "/del_one_product_content",
  validateUser,
  checkPlan,
  async (req, res) => {
    try {
      const { id } = req.body;

      const content = await query(
        `SELECT ref_photo FROM product_content WHERE id = ? AND uid = ?`,
        [id, req.decode.uid],
      );

      if (content.length === 0) {
        return res.json({
          success: false,
          msg: "Content not found",
        });
      }

      // Delete from database
      await query(`DELETE FROM product_content WHERE id = ? AND uid = ?`, [
        id,
        req.decode.uid,
      ]);

      // Delete the file (silent operation)
      const filePath = path.join(
        __dirname,
        "../client/public/media",
        content[0].ref_photo,
      );
      deleteFile(filePath);

      res.json({ success: true, msg: "The content is deleted" });
    } catch (err) {
      console.error(err);
      res.json({
        success: false,
        msg: "Something went wrong",
      });
    }
  },
);

module.exports = router;

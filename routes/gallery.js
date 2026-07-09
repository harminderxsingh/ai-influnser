const express = require("express");
const router = express.Router();
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const { normalizeSubmissionKey } = require("../utils/submissionKey");

// add gallery
router.post("/add_new_task", validateUser, checkPlan, async (req, res) => {
  try {
    const { selectedModel, prompt, submission_key } = req.body;
    const submissionKey = normalizeSubmissionKey(submission_key);
    const uid = req.decode.uid;

    if (!selectedModel || !prompt) {
      return res.json({
        msg: "Please selecte an influencer and enter a prompt",
      });
    }

    const modelJson = JSON.stringify(selectedModel);

    if (submissionKey) {
      const [existing] = await query(
        `SELECT id FROM gallery WHERE uid = ? AND submission_key = ?`,
        [uid, submissionKey],
      );

      if (existing) {
        return res.json({
          success: true,
          msg: "The influencer is already getting ready...",
          id: existing.id,
        });
      }
    }

    const [recentDuplicate] = await query(
      `SELECT id FROM gallery
       WHERE uid = ?
         AND model = ?
         AND prompt = ?
         AND status IN ('processing', 'submitting')
         AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
       ORDER BY id DESC
       LIMIT 1`,
      [uid, modelJson, prompt],
    );

    if (recentDuplicate) {
      return res.json({
        success: true,
        msg: "The influencer is already getting ready...",
        id: recentDuplicate.id,
      });
    }

    try {
      await query(
        `INSERT INTO gallery (uid, model, prompt, status, submission_key) VALUES (?,?,?,?,?)`,
        [uid, modelJson, prompt, "processing", submissionKey],
      );
    } catch (insertErr) {
      if (insertErr.code === "ER_DUP_ENTRY") {
        const [existing] = await query(
          `SELECT id FROM gallery WHERE uid = ? AND submission_key = ?`,
          [uid, submissionKey],
        );

        return res.json({
          success: true,
          msg: "The influencer is already getting ready...",
          id: existing?.id,
        });
      }

      throw insertErr;
    }

    res.json({ success: true, msg: "The influencer is getting ready..." });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      msg: "Something went wrong",
    });
  }
});

// get all gallery
router.get("/get_all", validateUser, checkPlan, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM gallery WHERE uid = ?`, [
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
    await query(`DELETE FROM gallery WHERE id = ?`, [id]);
    res.json({ success: true, msg: "The content is deleted" });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      msg: "Something went wrong",
    });
  }
});

module.exports = router;

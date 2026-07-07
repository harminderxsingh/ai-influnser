const router = require("express").Router();
const { query } = require("../database/connection.js");
const adminValidator = require("../middlewares/admin.js");
const validateUser = require("../middlewares/user");

// Get all plans
router.get("/get_all", async (req, res) => {
  try {
    const plans = await query(`SELECT * FROM plan ORDER BY price ASC`);
    res.json({ success: true, plans, data: plans });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Server error", err });
  }
});

// Add new plan
router.post("/add_new", adminValidator, async (req, res) => {
  try {
    const {
      title,
      price,
      monthly_price,
      yearly_price,
      recurring_enabled,
      default_billing_interval,
      popular,
      price_strike,
      credits,
      expiry_days,
      max_characters,
    } = req.body;

    if (
      !title ||
      (price === undefined && monthly_price === undefined) ||
      !credits ||
      !expiry_days ||
      !max_characters
    ) {
      return res.json({ msg: "Please fill all the required details" });
    }

    await query(
      `INSERT INTO plan (title, price, monthly_price, yearly_price, recurring_enabled, default_billing_interval, popular, price_strike, credits, expiry_days, max_characters) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        price ?? monthly_price,
        monthly_price ?? price,
        yearly_price ?? Number(monthly_price ?? price ?? 0) * 12,
        recurring_enabled === false ? 0 : 1,
        default_billing_interval || "monthly",
        popular ? 1 : 0,
        price_strike || null,
        credits,
        expiry_days,
        max_characters,
      ],
    );

    res.json({ msg: "Plan was added successfully", success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Server error", err });
  }
});

// Edit plan
router.post("/edit", adminValidator, async (req, res) => {
  try {
    const {
      id,
      title,
      price,
      monthly_price,
      yearly_price,
      recurring_enabled,
      default_billing_interval,
      popular,
      price_strike,
      credits,
      expiry_days,
      max_characters,
    } = req.body;

    if (
      !id ||
      !title ||
      (price === undefined && monthly_price === undefined) ||
      !credits ||
      !expiry_days ||
      !max_characters
    ) {
      return res.json({ msg: "Please fill all the required details" });
    }

    await query(
      `UPDATE plan SET title = ?, price = ?, monthly_price = ?, yearly_price = ?, recurring_enabled = ?, default_billing_interval = ?, popular = ?, price_strike = ?, credits = ?, expiry_days = ?, max_characters = ? WHERE id = ?`,
      [
        title,
        price ?? monthly_price,
        monthly_price ?? price,
        yearly_price ?? Number(monthly_price ?? price ?? 0) * 12,
        recurring_enabled === false ? 0 : 1,
        default_billing_interval || "monthly",
        popular ? 1 : 0,
        price_strike || null,
        credits,
        expiry_days,
        max_characters,
        id,
      ],
    );

    res.json({ msg: "Plan updated successfully", success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Server error", err });
  }
});

// Delete plan
router.post("/delete", adminValidator, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.json({ msg: "Plan ID is required" });
    }

    await query(`DELETE FROM plan WHERE id = ?`, [id]);

    res.json({ msg: "Plan deleted successfully", success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Server error", err });
  }
});

// get plan by id
router.post("/get_plan_by_id", validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    const [plan] = await query(`SELECT * FROM plan WHERE id = ?`, [id]);
    if (!plan) {
      return res.json({ msg: "Invalid plan id found" });
    }

    res.json({ data: plan, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Server error", err });
  }
});

module.exports = router;

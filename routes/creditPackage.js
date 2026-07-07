const router = require("express").Router();
const { query } = require("../database/connection.js");
const adminValidator = require("../middlewares/admin.js");
const userValidator = require("../middlewares/user.js");

function normalizePackageInput(body) {
  return {
    title: String(body.title || "").trim(),
    price: Number(body.price),
    credits: parseInt(body.credits, 10),
    popular: body.popular ? 1 : 0,
    status: body.status === "inactive" ? "inactive" : "active",
  };
}

function validatePackageInput(input) {
  if (!input.title) return "Package title is required";
  if (!Number.isFinite(input.price) || input.price < 0)
    return "Package price must be zero or greater";
  if (!Number.isInteger(input.credits) || input.credits < 1)
    return "Package credits must be greater than zero";
  return null;
}

router.get("/get_all", async (req, res) => {
  try {
    const packages = await query(
      `SELECT * FROM credit_packages WHERE status = 'active' ORDER BY price ASC`,
      [],
    );
    res.json({ success: true, data: packages, packages });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message || "Server error" });
  }
});

router.get("/admin/get_all", adminValidator, async (req, res) => {
  try {
    const packages = await query(
      `SELECT * FROM credit_packages ORDER BY price ASC`,
      [],
    );
    res.json({ success: true, data: packages, packages });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message || "Server error" });
  }
});

router.post("/get_by_id", userValidator, async (req, res) => {
  try {
    const { id } = req.body;
    const [creditPackage] = await query(
      `SELECT * FROM credit_packages WHERE id = ? AND status = 'active' LIMIT 1`,
      [id],
    );
    if (!creditPackage) {
      return res.json({ success: false, msg: "Credit package not found" });
    }
    res.json({ success: true, data: creditPackage });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message || "Server error" });
  }
});

router.post("/add_new", adminValidator, async (req, res) => {
  try {
    const input = normalizePackageInput(req.body);
    const validationError = validatePackageInput(input);
    if (validationError) return res.json({ success: false, msg: validationError });

    await query(
      `INSERT INTO credit_packages (title, price, credits, popular, status) VALUES (?, ?, ?, ?, ?)`,
      [input.title, input.price, input.credits, input.popular, input.status],
    );

    res.json({ success: true, msg: "Credit package added successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message || "Server error" });
  }
});

router.post("/edit", adminValidator, async (req, res) => {
  try {
    const { id } = req.body;
    const input = normalizePackageInput(req.body);
    if (!id) return res.json({ success: false, msg: "Package ID is required" });
    const validationError = validatePackageInput(input);
    if (validationError) return res.json({ success: false, msg: validationError });

    await query(
      `UPDATE credit_packages SET title = ?, price = ?, credits = ?, popular = ?, status = ? WHERE id = ?`,
      [
        input.title,
        input.price,
        input.credits,
        input.popular,
        input.status,
        id,
      ],
    );

    res.json({ success: true, msg: "Credit package updated successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message || "Server error" });
  }
});

router.post("/delete", adminValidator, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, msg: "Package ID is required" });
    await query(`DELETE FROM credit_packages WHERE id = ?`, [id]);
    res.json({ success: true, msg: "Credit package deleted successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: err.message || "Server error" });
  }
});

module.exports = router;

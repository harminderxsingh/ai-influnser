const jwt = require("jsonwebtoken");
const { query } = require("../database/connection");
const { getEnv } = require("../utils/common");

function verifyToken(token, secret) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decode) => {
      if (err) reject(err);
      else resolve(decode);
    });
  });
}

const adminValidator = async (req, res, next) => {
  try {
    const token = req.get("Authorization");
    if (!token) {
      return res.json({ msg: "No token found", token: token, logout: true });
    }

    const env = getEnv();
    const decode = await verifyToken(token.split(" ")[1], env?.jwt);

    const getAdmin = await query(
      `SELECT * FROM admin WHERE uid = ? AND token_version = ?`,
      [decode.uid, decode.token_version],
    );
    if (getAdmin.length < 1) {
      return res.json({
        success: false,
        msg: "Invalid token found",
        token,
        logout: true,
      });
    }
    if (getAdmin[0].role === "admin") {
      req.decode = decode;
      return next();
    }
    return res.json({
      success: 0,
      msg: "Unauthorized token",
      token: token,
      logout: true,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      msg: "Invalid token found",
      logout: true,
    });
  }
};

module.exports = adminValidator;

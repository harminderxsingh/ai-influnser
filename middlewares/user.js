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

const validateUser = async (req, res, next) => {
  try {
    const token = req.get("Authorization");
    if (!token) {
      return res.json({ msg: "No token found", token: token, logout: true });
    }

    const env = getEnv();
    const decode = await verifyToken(token.split(" ")[1], env?.jwt);

    const getUser = await query(
      `SELECT * FROM user WHERE uid = ? AND token_version = ?`,
      [decode.uid, decode.token_version],
    );
    if (getUser.length < 1) {
      return res.json({
        success: false,
        msg: "Invalid token found",
        token,
        logout: true,
      });
    }
    if (getUser[0].role === "user") {
      req.decode = decode;
      req.decode.user = getUser[0];
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

module.exports = validateUser;

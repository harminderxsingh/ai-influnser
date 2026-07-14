process.env.NODE_ENV = "development";

const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env.development"),
});

require("../server.js");

require("dotenv").config({ silent: true });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fileUpload = require("express-fileupload");
const { mainLoop } = require("./loops/mainLoop");
const { autoPostInit } = require("./loops/autoPost");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());

// Check if database is configured
function isDatabaseConfigured() {
  const configPath = path.join(__dirname, "config.json");
  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return !!(
      config.database &&
      config.database.host &&
      config.database.user &&
      config.database.database
    );
  } catch (err) {
    return false;
  }
}

// Setup route (always accessible)
app.use("/setup", require("./routes/setup"));

// Middleware to redirect to setup if not configured
app.use((req, res, next) => {
  if (!isDatabaseConfigured() && !req.path.startsWith("/setup")) {
    return res.redirect("/setup");
  }
  next();
});

// Your other routes
app.use("/api/user", require("./routes/user"));
app.use("/api/theme", require("./routes/theme"));
app.use("/api/web", require("./routes/web"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/plan", require("./routes/plan"));
app.use("/api/credit-package", require("./routes/creditPackage"));
app.use("/api/inf", require("./routes/inf"));
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/content", require("./routes/content"));
app.use("/api/support", require("./routes/support"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/launchpad", require("./routes/launchpad"));
app.use("/api/blogs", require("./routes/blogs"));
app.use("/api/insta", require("./routes/insta"));
app.use("/api/tiktok", require("./routes/tiktok"));
app.use("/api/talking", require("./routes/talkingVideo"));
app.use("/api/social-publishing", require("./routes/social-publishing"));
app.use(
  "/api/prompt-recommendation",
  require("./routes/promptRecommendation"),
);

const publicRoot = path.resolve(__dirname, "./client/public");

app.use("/media", express.static(path.join(publicRoot, "media")));
app.use("/assets", express.static(path.join(publicRoot, "assets")));
app.use("/static", express.static(path.join(publicRoot, "static")));
app.use(express.static(publicRoot));

app.get("/{*path}", (req, res, next) => {
  const p = req.path || "";
  if (
    p.startsWith("/api") ||
    p.startsWith("/static") ||
    p.startsWith("/media") ||
    p.startsWith("/assets")
  ) {
    return res.status(404).send("Not found");
  }

  res.sendFile(path.join(publicRoot, "index.html"), (err) => {
    if (err) next(err);
  });
});

// Get port from config or default
let PORT = 8001;
const configPath = path.join(__dirname, "config.json");
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    PORT = config.port || 8001;
  } catch (err) {
    console.error("Error reading port from config:", err);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  mainLoop();
  autoPostInit();

  if (isDatabaseConfigured()) {
    const db = require("./database/connection");
    db.getConnection()
      .then((conn) => {
        console.log("Database connected successfully");
        conn.release();
        const { initDatabase } = require("./database/init");
        initDatabase();
      })
      .catch((err) => {
        console.error("Database connection failed:", err.message);
      });
  } else {
    console.log(
      "⚠️  Database not configured. Please visit http://localhost:" +
        PORT +
        "/setup",
    );
  }
});

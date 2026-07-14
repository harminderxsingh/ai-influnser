const fs = require("fs");
const path = require("path");

function resolveConfigPath() {
  const root = path.join(__dirname, "..");
  if (process.env.NODE_ENV === "development") {
    const devPath = path.join(root, "config.development.json");
    if (fs.existsSync(devPath)) return devPath;
  }
  return path.join(root, "config.json");
}

function loadAppConfig() {
  const configPath = resolveConfigPath();
  if (!fs.existsSync(configPath)) return null;
  try {
    return {
      ...JSON.parse(fs.readFileSync(configPath, "utf8")),
      __configPath: configPath,
    };
  } catch {
    return null;
  }
}

module.exports = { resolveConfigPath, loadAppConfig };

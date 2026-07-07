const fs = require("fs");
const path = require("path");

const buildDir = path.join(__dirname, "../client/build");
const publicDir = path.join(__dirname, "../client/public");
const preserveDirs = new Set(["media", "assets"]);

if (!fs.existsSync(buildDir)) {
  console.error("client/build not found. Run: npm --prefix client run build");
  process.exit(1);
}

for (const name of fs.readdirSync(publicDir)) {
  if (preserveDirs.has(name)) continue;
  fs.rmSync(path.join(publicDir, name), { recursive: true, force: true });
}

for (const name of fs.readdirSync(buildDir)) {
  fs.cpSync(path.join(buildDir, name), path.join(publicDir, name), {
    recursive: true,
  });
}

console.log("Copied client/build → client/public (media/ and assets/ kept)");

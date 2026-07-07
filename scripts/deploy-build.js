const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const buildDir = path.join(root, "client", "build");
const publicDir = path.join(root, "client", "public");

const COPY_ITEMS = [
  "index.html",
  "asset-manifest.json",
  "robots.txt",
  "manifest.json",
  "static",
];

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else copyFile(from, to);
  }
}

if (!fs.existsSync(buildDir)) {
  console.error("Build folder not found. Run: cd client && npm run build");
  process.exit(1);
}

for (const item of COPY_ITEMS) {
  const src = path.join(buildDir, item);
  const dest = path.join(publicDir, item);
  if (!fs.existsSync(src)) continue;
  if (fs.statSync(src).isDirectory()) copyDir(src, dest);
  else copyFile(src, dest);
  console.log("Copied:", item);
}

console.log("Production build deployed to client/public (media folder preserved).");

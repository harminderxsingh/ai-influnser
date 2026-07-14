const fs = require("fs");
const path = require("path");

/**
 * Convert a local media path (or localhost http URL) into something remote
 * AI providers can consume. xAI rejects plain http:// and cannot reach localhost,
 * so we send base64 data URLs for local files.
 */
async function mediaToProviderUrl(localPath) {
  if (typeof localPath === "string" && localPath.startsWith("data:")) {
    return localPath;
  }

  let filePath = localPath;

  if (
    typeof localPath === "string" &&
    (localPath.startsWith("http://") || localPath.startsWith("https://"))
  ) {
    try {
      const parsed = new URL(localPath);
      const isLocal =
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "::1" ||
        parsed.hostname.endsWith(".local");

      if (!isLocal && localPath.startsWith("https://")) {
        return localPath;
      }

      filePath = path.join(
        __dirname,
        "../client/public/media",
        path.basename(parsed.pathname),
      );
    } catch {
      // fall through
    }
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Media file not found: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : ext === ".mp4"
            ? "video/mp4"
            : "image/jpeg";

  console.log(
    `📎 Media → data URL (${mime}, ${(buffer.length / 1024).toFixed(1)} KB)`,
  );
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

module.exports = { mediaToProviderUrl };

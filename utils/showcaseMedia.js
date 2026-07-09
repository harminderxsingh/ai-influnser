const path = require("path");
const sharp = require("sharp");

const SHOWCASE_LONG_EDGE = 1920;

function normalizeAspectRatio(raw) {
  const value = String(raw || "9:16").trim();
  if (value === "auto" || value === "Auto") return "Auto";
  if (value === "16:9") return "16:9";
  return "9:16";
}

function targetSizeForAspect(aspectRatio, meta = {}) {
  const ratio = normalizeAspectRatio(aspectRatio);
  if (ratio === "Auto") {
    const isLandscape = (meta.width || 1) >= (meta.height || 1);
    return isLandscape
      ? { width: SHOWCASE_LONG_EDGE, height: 1080 }
      : { width: 1080, height: SHOWCASE_LONG_EDGE };
  }
  if (ratio === "16:9") {
    return { width: SHOWCASE_LONG_EDGE, height: 1080 };
  }
  return { width: 1080, height: SHOWCASE_LONG_EDGE };
}

function buildShowcasePrompt(userPrompt) {
  const base = typeof userPrompt === "string" ? userPrompt.trim() : "";
  const quality =
    " The influencer naturally presents and holds the product. Keep the product photorealistic with sharp packaging, crisp label text, and accurate colors throughout the entire video, especially in the final seconds. No blur, no soft focus, and no warping on the product.";

  return base ? `${base}${quality}` : quality.trim();
}

async function prepareProductImageForShowcase(inputPath, aspectRatio = "9:16") {
  const meta = await sharp(inputPath).metadata();
  const { width, height } = targetSizeForAspect(aspectRatio, meta);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outPath = path.join(
    path.dirname(inputPath),
    `${baseName}_showcase_${width}x${height}.jpg`,
  );

  await sharp(inputPath)
    .resize(width, height, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 94, mozjpeg: true })
    .toFile(outPath);

  return outPath;
}

module.exports = {
  buildShowcasePrompt,
  normalizeAspectRatio,
  prepareProductImageForShowcase,
};

import { readdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGE_ROOT = path.join(process.cwd(), "public", "images");
const MAX_WIDTH = 2400;
const MAX_HEIGHT = 3000;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 82;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function optimizeImage(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(extension)) return null;

  const before = (await stat(filePath)).size;
  const tempPath = `${filePath}.optimized`;

  let pipeline = sharp(filePath, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (extension === ".jpg" || extension === ".jpeg") {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else if (extension === ".png") {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else {
    pipeline = pipeline.webp({ quality: WEBP_QUALITY, effort: 5, smartSubsample: true });
  }

  await pipeline.toFile(tempPath);
  const after = (await stat(tempPath)).size;

  // Never replace a source file with a larger result.
  if (after >= before) {
    await unlink(tempPath);
    return { filePath, before, after: before, changed: false };
  }

  await rename(tempPath, filePath);
  return { filePath, before, after, changed: true };
}

async function main() {
  let files;
  try {
    files = await walk(IMAGE_ROOT);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      console.log("No public/images directory found; skipping static image optimization.");
      return;
    }
    throw error;
  }

  let beforeTotal = 0;
  let afterTotal = 0;
  let changed = 0;

  for (const filePath of files) {
    const result = await optimizeImage(filePath);
    if (!result) continue;
    beforeTotal += result.before;
    afterTotal += result.after;
    if (result.changed) changed += 1;
  }

  const saved = Math.max(0, beforeTotal - afterTotal);
  const pct = beforeTotal ? ((saved / beforeTotal) * 100).toFixed(1) : "0.0";
  console.log(
    `Static images: optimized ${changed} file(s), saved ${(saved / 1024).toFixed(1)} KiB (${pct}%).`
  );
}

main().catch((error) => {
  console.error("Static image optimization failed:", error);
  process.exitCode = 1;
});

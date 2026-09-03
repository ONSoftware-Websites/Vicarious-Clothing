import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import heicConvert from "heic-convert";

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_OUTPUT_WIDTH = 2200;
const MAX_OUTPUT_HEIGHT = 2800;
const WEBP_QUALITY = 82;
const PAGE_SIZE = 1000;
const MIGRATED_PREFIX = "migrated/";
const SUPPORTED_BUCKETS = new Set(["product-images", "journal-images"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const KEEP_ORIGINALS = args.has("--keep-originals");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Number.POSITIVE_INFINITY;

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const equals = trimmed.indexOf("=");
  if (equals < 1) return null;
  const key = trimmed.slice(0, equals).trim();
  let value = trimmed.slice(equals + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

async function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    try {
      const text = await readFile(path.join(process.cwd(), filename), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const parsed = parseEnvLine(line);
        if (!parsed) continue;
        const [key, value] = parsed;
        if (!process.env[key]) process.env[key] = value;
      }
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
        throw error;
      }
    }
  }
}

function extensionOf(objectPath) {
  return objectPath.split(/[?#]/)[0].split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function safeStem(objectPath) {
  const base = objectPath.split("/").pop() || "image";
  return base
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "image";
}

function migratedPathFor(bucket, objectPath) {
  const hash = createHash("sha256")
    .update(`${bucket}/${objectPath}`)
    .digest("hex")
    .slice(0, 12);
  return `${MIGRATED_PREFIX}${safeStem(objectPath)}-${hash}.webp`;
}

function parseSupabasePublicUrl(src, supabaseUrl) {
  if (!src || typeof src !== "string") return null;

  let imageUrl;
  let projectUrl;
  try {
    imageUrl = new URL(src);
    projectUrl = new URL(supabaseUrl);
  } catch {
    return null;
  }

  if (imageUrl.origin !== projectUrl.origin) return null;

  const prefix = "/storage/v1/object/public/";
  if (!imageUrl.pathname.startsWith(prefix)) return null;

  const remainder = imageUrl.pathname.slice(prefix.length);
  const slash = remainder.indexOf("/");
  if (slash < 1) return null;

  const bucket = decodeURIComponent(remainder.slice(0, slash));
  const objectPath = remainder
    .slice(slash + 1)
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");

  if (!SUPPORTED_BUCKETS.has(bucket) || !objectPath) return null;
  return { bucket, objectPath };
}

async function fetchAll(supabase, table, columns) {
  const rows = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const end = start + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select(columns).range(start, end);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function decodeHeic(sourceBuffer) {
  return Buffer.from(
    await heicConvert({
      buffer: sourceBuffer,
      format: "PNG",
      quality: 1,
    })
  );
}

async function optimizeToWebp(objectPath, sourceBuffer) {
  const ext = extensionOf(objectPath);
  const input = HEIC_EXTENSIONS.has(ext) ? await decodeHeic(sourceBuffer) : sourceBuffer;

  const { data, info } = await sharp(input, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({
      width: MAX_OUTPUT_WIDTH,
      height: MAX_OUTPUT_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toColourspace("srgb")
    .webp({ quality: WEBP_QUALITY, effort: 5, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    size: data.byteLength,
  };
}

function addReference(map, src, ref, supabaseUrl) {
  const parsed = parseSupabasePublicUrl(src, supabaseUrl);
  if (!parsed) return;
  if (parsed.objectPath.startsWith(MIGRATED_PREFIX)) return;

  const existing = map.get(src) ?? { src, ...parsed, refs: [] };
  existing.refs.push(ref);
  map.set(src, existing);
}

async function collectCandidates(supabase, supabaseUrl) {
  const [productImages, journalPosts, orderItems] = await Promise.all([
    fetchAll(supabase, "product_images", "id,src,product_sku,position"),
    fetchAll(supabase, "journal_posts", "id,cover_image"),
    fetchAll(supabase, "order_items", "id,image,order_id,sku"),
  ]);

  const candidates = new Map();

  for (const row of productImages) {
    addReference(
      candidates,
      row.src,
      { table: "product_images", id: row.id, field: "src", label: `product ${row.product_sku} image ${row.position}` },
      supabaseUrl
    );
  }

  for (const row of journalPosts) {
    addReference(
      candidates,
      row.cover_image,
      { table: "journal_posts", id: row.id, field: "cover_image", label: `journal ${row.id}` },
      supabaseUrl
    );
  }

  for (const row of orderItems) {
    addReference(
      candidates,
      row.image,
      { table: "order_items", id: row.id, field: "image", label: `order ${row.order_id} item ${row.sku ?? row.id}` },
      supabaseUrl
    );
  }

  return Array.from(candidates.values());
}

async function updateReference(supabase, ref, oldUrl, newUrl) {
  const { data, error } = await supabase
    .from(ref.table)
    .update({ [ref.field]: newUrl })
    .eq("id", ref.id)
    .eq(ref.field, oldUrl)
    .select("id");

  if (error) throw new Error(`${ref.label}: ${error.message}`);
  if (!data?.length) {
    throw new Error(`${ref.label}: row changed since migration scan; original was left in place`);
  }
}

async function migrateCandidate(supabase, candidate) {
  const { bucket, objectPath, src, refs } = candidate;
  const destinationPath = migratedPathFor(bucket, objectPath);

  const downloaded = await supabase.storage.from(bucket).download(objectPath);
  if (downloaded.error || !downloaded.data) {
    throw new Error(`download failed: ${downloaded.error?.message ?? "missing object"}`);
  }
  if (downloaded.data.size > MAX_SOURCE_BYTES) {
    throw new Error(`source is larger than ${MAX_SOURCE_BYTES / 1024 / 1024} MB`);
  }

  const sourceBuffer = Buffer.from(await downloaded.data.arrayBuffer());
  const optimized = await optimizeToWebp(objectPath, sourceBuffer);

  const uploaded = await supabase.storage.from(bucket).upload(destinationPath, optimized.buffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: true,
  });
  if (uploaded.error) throw new Error(`upload failed: ${uploaded.error.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(destinationPath);
  const newUrl = urlData.publicUrl;

  try {
    for (const ref of refs) {
      await updateReference(supabase, ref, src, newUrl);
    }
  } catch (error) {
    // Keep both objects when a database write fails. A rerun can safely finish
    // the remaining old references because the migrated destination is stable.
    throw error;
  }

  if (!KEEP_ORIGINALS && objectPath !== destinationPath) {
    const removed = await supabase.storage.from(bucket).remove([objectPath]);
    if (removed.error) {
      throw new Error(`database updated, but original cleanup failed: ${removed.error.message}`);
    }
  }

  return {
    newUrl,
    before: sourceBuffer.byteLength,
    after: optimized.size,
    width: optimized.width,
    height: optimized.height,
    references: refs.length,
  };
}

async function main() {
  await loadLocalEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Put them in .env.local/.env or export them before running the migration."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const allCandidates = await collectCandidates(supabase, supabaseUrl);
  const candidates = allCandidates.slice(0, Number.isFinite(LIMIT) ? LIMIT : allCandidates.length);

  console.log("Vicarious Clothing existing-image migration");
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`Candidates: ${allCandidates.length}${candidates.length !== allCandidates.length ? ` (processing first ${candidates.length})` : ""}`);
  console.log(`Original cleanup: ${APPLY ? (KEEP_ORIGINALS ? "disabled" : "enabled after DB updates") : "not applicable"}`);

  if (!APPLY) {
    const byBucket = candidates.reduce((acc, item) => {
      acc[item.bucket] = (acc[item.bucket] ?? 0) + 1;
      return acc;
    }, {});
    for (const [bucket, count] of Object.entries(byBucket)) {
      console.log(`  ${bucket}: ${count}`);
    }
    console.log("\nDry run only. Re-run with --apply to migrate these images.");
    return;
  }

  let migrated = 0;
  let failed = 0;
  let beforeBytes = 0;
  let afterBytes = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const prefix = `[${index + 1}/${candidates.length}] ${candidate.bucket}/${candidate.objectPath}`;
    try {
      const result = await migrateCandidate(supabase, candidate);
      migrated += 1;
      beforeBytes += result.before;
      afterBytes += result.after;
      const savedPct = result.before > 0 ? ((1 - result.after / result.before) * 100).toFixed(1) : "0.0";
      console.log(`${prefix} -> ${result.width}x${result.height}, ${savedPct}% smaller, ${result.references} reference(s) updated`);
    } catch (error) {
      failed += 1;
      console.error(`${prefix} FAILED: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const savedBytes = Math.max(0, beforeBytes - afterBytes);
  const savedPct = beforeBytes > 0 ? ((savedBytes / beforeBytes) * 100).toFixed(1) : "0.0";
  console.log("\nMigration summary");
  console.log(`Migrated: ${migrated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Processed originals: ${(beforeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized output: ${(afterBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${(savedBytes / 1024 / 1024).toFixed(2)} MB (${savedPct}%)`);

  if (failed > 0) {
    process.exitCode = 1;
    console.error("One or more images failed. Re-run the same command after fixing the reported issue; completed rows are skipped automatically.");
  }
}

main().catch((error) => {
  console.error("Image migration failed:", error);
  process.exitCode = 1;
});

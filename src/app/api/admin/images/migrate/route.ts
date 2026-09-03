import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 3;
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_OUTPUT_WIDTH = 2200;
const MAX_OUTPUT_HEIGHT = 2800;
const WEBP_QUALITY = 82;
const MIGRATED_PREFIX = "migrated/";
const PROJECT_HOST = "oassmkyfcomqkhouyzmi.supabase.co";
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

type Ref = {
  table: "product_images" | "journal_posts" | "order_items";
  id: string;
  field: "src" | "cover_image" | "image";
};

type Candidate = {
  src: string;
  bucket: "product-images" | "journal-images";
  objectPath: string;
  refs: Ref[];
};

function extensionOf(objectPath: string) {
  return objectPath.split(/[?#]/)[0].split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function safeStem(objectPath: string) {
  const base = objectPath.split("/").pop() || "image";
  return base
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "image";
}

function migratedPathFor(bucket: string, objectPath: string) {
  const hash = createHash("sha256").update(`${bucket}/${objectPath}`).digest("hex").slice(0, 12);
  return `${MIGRATED_PREFIX}${safeStem(objectPath)}-${hash}.webp`;
}

function parseStoredUrl(src: unknown) {
  if (typeof src !== "string" || !src) return null;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }

  if (url.hostname !== PROJECT_HOST) return null;
  const prefix = "/storage/v1/object/public/";
  if (!url.pathname.startsWith(prefix)) return null;
  const remainder = url.pathname.slice(prefix.length);
  const slash = remainder.indexOf("/");
  if (slash < 1) return null;
  const bucket = decodeURIComponent(remainder.slice(0, slash));
  if (bucket !== "product-images" && bucket !== "journal-images") return null;
  const objectPath = remainder
    .slice(slash + 1)
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");
  if (!objectPath || objectPath.startsWith(MIGRATED_PREFIX)) return null;
  return { bucket: bucket as Candidate["bucket"], objectPath };
}

function addCandidate(map: Map<string, Candidate>, src: unknown, ref: Ref) {
  const parsed = parseStoredUrl(src);
  if (!parsed || typeof src !== "string") return;
  const existing = map.get(src) ?? { src, ...parsed, refs: [] };
  existing.refs.push(ref);
  map.set(src, existing);
}

async function collectCandidates() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const [productImages, journalPosts, orderItems] = await Promise.all([
    supabase.from("product_images").select("id,src").order("id"),
    supabase.from("journal_posts").select("id,cover_image").order("id"),
    supabase.from("order_items").select("id,image").order("id"),
  ]);

  if (productImages.error) throw productImages.error;
  if (journalPosts.error) throw journalPosts.error;
  if (orderItems.error) throw orderItems.error;

  const candidates = new Map<string, Candidate>();
  for (const row of productImages.data ?? []) {
    addCandidate(candidates, row.src, { table: "product_images", id: String(row.id), field: "src" });
  }
  for (const row of journalPosts.data ?? []) {
    addCandidate(candidates, row.cover_image, { table: "journal_posts", id: String(row.id), field: "cover_image" });
  }
  for (const row of orderItems.data ?? []) {
    addCandidate(candidates, row.image, { table: "order_items", id: String(row.id), field: "image" });
  }
  return Array.from(candidates.values());
}

async function decodeHeic(sourceBuffer: Buffer) {
  return Buffer.from(await heicConvert({ buffer: sourceBuffer, format: "PNG", quality: 1 }));
}

async function optimizeToWebp(objectPath: string, sourceBuffer: Buffer) {
  const input = HEIC_EXTENSIONS.has(extensionOf(objectPath)) ? await decodeHeic(sourceBuffer) : sourceBuffer;
  const { data, info } = await sharp(input, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: MAX_OUTPUT_WIDTH, height: MAX_OUTPUT_HEIGHT, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .webp({ quality: WEBP_QUALITY, effort: 5, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height, size: data.byteLength };
}

async function migrateOne(candidate: Candidate) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const destinationPath = migratedPathFor(candidate.bucket, candidate.objectPath);

  const downloaded = await supabase.storage.from(candidate.bucket).download(candidate.objectPath);
  if (downloaded.error || !downloaded.data) throw new Error(downloaded.error?.message ?? "Source object missing");
  if (downloaded.data.size > MAX_SOURCE_BYTES) throw new Error("Source exceeds 50 MB");

  const original = Buffer.from(await downloaded.data.arrayBuffer());
  const optimized = await optimizeToWebp(candidate.objectPath, original);
  const uploaded = await supabase.storage.from(candidate.bucket).upload(destinationPath, optimized.buffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: true,
  });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const { data: publicData } = supabase.storage.from(candidate.bucket).getPublicUrl(destinationPath);
  const newUrl = publicData.publicUrl;

  for (const ref of candidate.refs) {
    const update = await supabase
      .from(ref.table)
      .update({ [ref.field]: newUrl })
      .eq("id", ref.id)
      .eq(ref.field, candidate.src)
      .select("id");
    if (update.error) throw new Error(`${ref.table}: ${update.error.message}`);
    if (!update.data?.length) throw new Error(`${ref.table}: reference changed during migration`);
  }

  const removed = await supabase.storage.from(candidate.bucket).remove([candidate.objectPath]);
  if (removed.error) throw new Error(`References updated, but old object cleanup failed: ${removed.error.message}`);

  return {
    before: original.byteLength,
    after: optimized.size,
    width: optimized.width,
    height: optimized.height,
    refs: candidate.refs.length,
  };
}

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const candidates = await collectCandidates();
    return NextResponse.json({ remaining: candidates.length, batchSize: BATCH_SIZE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const requested = Number(body.batchSize ?? BATCH_SIZE);
    const batchSize = Math.max(1, Math.min(BATCH_SIZE, Number.isFinite(requested) ? requested : BATCH_SIZE));
    const candidates = (await collectCandidates()).slice(0, batchSize);

    const results: Array<Record<string, unknown>> = [];
    for (const candidate of candidates) {
      try {
        const result = await migrateOne(candidate);
        results.push({ ok: true, src: candidate.src, ...result });
      } catch (error) {
        results.push({ ok: false, src: candidate.src, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const remaining = (await collectCandidates()).length;
    return NextResponse.json({
      processed: results.length,
      succeeded: results.filter((item) => item.ok).length,
      failed: results.filter((item) => !item.ok).length,
      remaining,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

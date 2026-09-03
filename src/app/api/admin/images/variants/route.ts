import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 3;
const PROJECT_HOST = "oassmkyfcomqkhouyzmi.supabase.co";

function parseObjectPath(src: string) {
  try {
    const url = new URL(src);
    if (url.hostname !== PROJECT_HOST) return null;
    const marker = "/storage/v1/object/public/product-images/";
    if (!url.pathname.startsWith(marker)) return null;
    return decodeURIComponent(url.pathname.slice(marker.length));
  } catch {
    return null;
  }
}

function filenameOf(path: string) {
  return path.split("/").pop() || "image.webp";
}

async function makeVariant(input: Buffer, width: number, quality: number) {
  return sharp(input, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .webp({ quality, effort: 4, smartSubsample: true })
    .toBuffer();
}

async function pendingRows() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("product_images")
    .select("id,src,src_thumb,src_display")
    .or("src_thumb.is.null,src_display.is.null")
    .order("id")
    .limit(1000);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function processOne(row: { id: string; src: string; src_thumb: string | null; src_display: string | null }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const objectPath = parseObjectPath(row.src);
  if (!objectPath) throw new Error("Unsupported source URL");

  const downloaded = await supabase.storage.from("product-images").download(objectPath);
  if (downloaded.error || !downloaded.data) throw new Error(downloaded.error?.message ?? "Source image missing");
  const source = Buffer.from(await downloaded.data.arrayBuffer());
  const file = filenameOf(objectPath);

  const [thumb, display] = await Promise.all([
    makeVariant(source, 480, 68),
    makeVariant(source, 1200, 76),
  ]);

  const thumbPath = `variants/thumb/${file}`;
  const displayPath = `variants/display/${file}`;
  const [thumbUpload, displayUpload] = await Promise.all([
    supabase.storage.from("product-images").upload(thumbPath, thumb, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    }),
    supabase.storage.from("product-images").upload(displayPath, display, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    }),
  ]);
  if (thumbUpload.error) throw new Error(`Thumbnail upload failed: ${thumbUpload.error.message}`);
  if (displayUpload.error) throw new Error(`Display upload failed: ${displayUpload.error.message}`);

  const thumbUrl = supabase.storage.from("product-images").getPublicUrl(thumbPath).data.publicUrl;
  const displayUrl = supabase.storage.from("product-images").getPublicUrl(displayPath).data.publicUrl;
  const update = await supabase
    .from("product_images")
    .update({ src_thumb: thumbUrl, src_display: displayUrl })
    .eq("id", row.id);
  if (update.error) throw new Error(update.error.message);

  return {
    id: row.id,
    originalBytes: source.byteLength,
    thumbBytes: thumb.byteLength,
    displayBytes: display.byteLength,
  };
}

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const rows = await pendingRows();
    return NextResponse.json({ remaining: rows.length, batchSize: BATCH_SIZE });
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
    const rows = (await pendingRows()).slice(0, batchSize);
    const results = [];
    for (const row of rows) {
      try {
        results.push({ ok: true, ...(await processOne(row as never)) });
      } catch (error) {
        results.push({ ok: false, id: row.id, error: error instanceof Error ? error.message : String(error) });
      }
    }
    const remaining = (await pendingRows()).length;
    return NextResponse.json({
      processed: results.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      remaining,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

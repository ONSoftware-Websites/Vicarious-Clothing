import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_OUTPUT_WIDTH = 2200;
const MAX_OUTPUT_HEIGHT = 2800;
const WEBP_QUALITY = 82;
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

function extensionOf(path: string) {
  const clean = path.split(/[?#]/)[0] ?? path;
  return clean.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function optimizedPathFor(sourcePath: string) {
  const withoutIncoming = sourcePath.replace(/^incoming\//, "");
  const withoutExt = withoutIncoming.replace(/\.[a-z0-9]+$/i, "");
  return `${withoutExt}.webp`;
}

function optimizationMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `Could not optimize this image. Original error: ${message}`;
}

async function decodeHeic(sourceBuffer: Buffer) {
  // Sharp/libvips on Vercel is often built without HEIC/HEIF decompression
  // support. Decode HEIC explicitly first, then let Sharp normalize it.
  return Buffer.from(
    await heicConvert({
      buffer: sourceBuffer,
      format: "PNG",
      quality: 1,
    })
  );
}

async function optimizeToWebp(sourcePath: string, sourceBuffer: Buffer) {
  const ext = extensionOf(sourcePath);
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
    .webp({
      quality: WEBP_QUALITY,
      effort: 5,
      smartSubsample: true,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    size: data.byteLength,
  };
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    const bucketRaw = String(body.bucket ?? "product-images");
    const bucket = bucketRaw === "journal-images" ? "journal-images" : "product-images";
    const sourcePath = String(body.path ?? "");

    if (!sourcePath || !sourcePath.startsWith("incoming/")) {
      return NextResponse.json({ error: "Missing temporary source upload." }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase Storage is not configured." }, { status: 503 });
    }

    const downloaded = await supabase.storage.from(bucket).download(sourcePath);
    if (downloaded.error || !downloaded.data) {
      return NextResponse.json(
        { error: downloaded.error?.message ?? "Could not download temporary image for optimization." },
        { status: 500 }
      );
    }

    if (downloaded.data.size > MAX_SOURCE_BYTES) {
      await supabase.storage.from(bucket).remove([sourcePath]).catch(() => {});
      return NextResponse.json({ error: "File too large to optimize (max 50MB)." }, { status: 400 });
    }

    const sourceBuffer = Buffer.from(await downloaded.data.arrayBuffer());
    const finalPath = optimizedPathFor(sourcePath);

    let optimized: Awaited<ReturnType<typeof optimizeToWebp>>;
    try {
      optimized = await optimizeToWebp(sourcePath, sourceBuffer);
    } catch (error) {
      await supabase.storage.from(bucket).remove([sourcePath]).catch(() => {});
      return NextResponse.json({ error: optimizationMessage(error) }, { status: 415 });
    }

    const uploaded = await supabase.storage.from(bucket).upload(finalPath, optimized.buffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

    if (uploaded.error) {
      await supabase.storage.from(bucket).remove([sourcePath]).catch(() => {});
      return NextResponse.json({ error: uploaded.error.message }, { status: 500 });
    }

    await supabase.storage.from(bucket).remove([sourcePath]).catch(() => {});

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(finalPath);
    return NextResponse.json({
      ok: true,
      bucket,
      path: finalPath,
      url: urlData.publicUrl,
      contentType: "image/webp",
      optimized: true,
      width: optimized.width,
      height: optimized.height,
      size: optimized.size,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

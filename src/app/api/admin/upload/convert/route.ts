import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_OUTPUT_WIDTH = 1800;
const MAX_OUTPUT_HEIGHT = 2400;
const WEBP_QUALITY = 76;
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
  return Buffer.from(
    await heicConvert({
      buffer: sourceBuffer,
      format: "PNG",
      quality: 1,
    })
  );
}

async function normalizedInput(sourcePath: string, sourceBuffer: Buffer) {
  return HEIC_EXTENSIONS.has(extensionOf(sourcePath)) ? await decodeHeic(sourceBuffer) : sourceBuffer;
}

async function optimizeFull(input: Buffer) {
  const { data, info } = await sharp(input, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: MAX_OUTPUT_WIDTH, height: MAX_OUTPUT_HEIGHT, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .webp({ quality: WEBP_QUALITY, effort: 5, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height, size: data.byteLength };
}

async function variant(input: Buffer, width: number, quality: number) {
  return sharp(input, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .webp({ quality, effort: 4, smartSubsample: true })
    .toBuffer();
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

    try {
      const input = await normalizedInput(sourcePath, sourceBuffer);
      const optimized = await optimizeFull(input);
      const filename = finalPath.split("/").pop() || "image.webp";

      const uploaded = await supabase.storage.from(bucket).upload(finalPath, optimized.buffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
      if (uploaded.error) throw new Error(uploaded.error.message);

      if (bucket === "product-images") {
        const [thumb, display] = await Promise.all([
          variant(input, 480, 68),
          variant(input, 1200, 76),
        ]);
        const [thumbUpload, displayUpload] = await Promise.all([
          supabase.storage.from(bucket).upload(`variants/thumb/${filename}`, thumb, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: true,
          }),
          supabase.storage.from(bucket).upload(`variants/display/${filename}`, display, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: true,
          }),
        ]);
        if (thumbUpload.error) throw new Error(`Thumbnail variant failed: ${thumbUpload.error.message}`);
        if (displayUpload.error) throw new Error(`Display variant failed: ${displayUpload.error.message}`);
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
    } catch (error) {
      await supabase.storage.from(bucket).remove([sourcePath]).catch(() => {});
      return NextResponse.json({ error: optimizationMessage(error) }, { status: 415 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

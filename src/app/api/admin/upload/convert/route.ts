import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

function extensionOf(path: string) {
  const clean = path.split(/[?#]/)[0] ?? path;
  return clean.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function pngPathFor(sourcePath: string) {
  const withoutIncoming = sourcePath.replace(/^incoming\//, "");
  const withoutExt = withoutIncoming.replace(/\.[a-z0-9]+$/i, "");
  return `${withoutExt}.png`;
}

function conversionMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `Could not convert this Apple image to PNG. Original error: ${message}`;
}

async function convertHeicToPng(sourceBuffer: Buffer) {
  // Sharp/libvips on Vercel is often built without HEIC/HEIF compression
  // support. Use a HEIC-specific decoder first, then normalize the result with
  // Sharp so the final file is a storefront-safe PNG.
  const decoded = Buffer.from(
    await heicConvert({
      buffer: sourceBuffer,
      format: "PNG",
      quality: 1,
    })
  );

  return sharp(decoded, { limitInputPixels: 80_000_000 })
    .rotate()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function convertWithSharpToPng(sourceBuffer: Buffer) {
  return sharp(sourceBuffer, { limitInputPixels: 80_000_000 })
    .rotate()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function convertToPng(sourcePath: string, sourceBuffer: Buffer) {
  const ext = extensionOf(sourcePath);
  if (HEIC_EXTENSIONS.has(ext)) {
    return convertHeicToPng(sourceBuffer);
  }
  return convertWithSharpToPng(sourceBuffer);
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
        { error: downloaded.error?.message ?? "Could not download temporary image for conversion." },
        { status: 500 }
      );
    }

    if (downloaded.data.size > MAX_SOURCE_BYTES) {
      await supabase.storage.from(bucket).remove([sourcePath]).catch(() => {});
      return NextResponse.json({ error: "File too large to convert (max 50MB)." }, { status: 400 });
    }

    const sourceBuffer = Buffer.from(await downloaded.data.arrayBuffer());
    const finalPath = pngPathFor(sourcePath);

    let pngBuffer: Buffer;
    try {
      pngBuffer = await convertToPng(sourcePath, sourceBuffer);
    } catch (error) {
      await supabase.storage.from(bucket).remove([sourcePath]).catch(() => {});
      return NextResponse.json({ error: conversionMessage(error) }, { status: 415 });
    }

    const uploaded = await supabase.storage.from(bucket).upload(finalPath, pngBuffer, {
      contentType: "image/png",
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
      contentType: "image/png",
      converted: true,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

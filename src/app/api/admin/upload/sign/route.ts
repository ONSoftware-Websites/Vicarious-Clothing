import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";

const MAX_BYTES = 50 * 1024 * 1024; // Supabase direct uploads can handle normal phone originals.

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  tif: "image/tiff",
  tiff: "image/tiff",
  dng: "image/x-adobe-dng",
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/tiff",
  "image/x-tiff",
  "image/dng",
  "image/x-adobe-dng",
  "application/octet-stream",
]);

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function contentTypeFor(name: string, declaredType: string) {
  const ext = extensionOf(name);
  const type = declaredType.toLowerCase();

  if (MIME_BY_EXTENSION[ext]) return MIME_BY_EXTENSION[ext];
  if (type && ALLOWED_MIME_TYPES.has(type) && type !== "application/octet-stream") return type;
  if (type.startsWith("image/")) return type;
  return "";
}

function safeStorageName(name: string, fallbackExt: string) {
  const base = name || `image.${fallbackExt}`;
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  if (safe.includes(".")) return safe;
  return `${safe || "image"}.${fallbackExt}`;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    const bucketRaw = String(body.bucket ?? "product-images");
    const bucket = bucketRaw === "journal-images" ? "journal-images" : "product-images";
    const name = String(body.name ?? "image");
    const size = Number(body.size ?? 0);
    const declaredType = String(body.type ?? "");

    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "Missing file size" }, { status: 400 });
    }
    if (size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const contentType = contentTypeFor(name, declaredType);
    if (!contentType) {
      return NextResponse.json(
        { error: "Not an accepted image type. JPEG, PNG, WebP, HEIC, HEIF, TIFF and Apple ProRAW DNG are accepted." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase Storage is not configured." }, { status: 503 });
    }

    const ext = extensionOf(name) || Object.entries(MIME_BY_EXTENSION).find(([, mime]) => mime === contentType)?.[0] || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeStorageName(name, ext)}`;

    let signed = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (signed.error && signed.error.message.includes("Bucket not found")) {
      await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});
      signed = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    }

    if (signed.error || !signed.data) {
      const message = signed.error?.message ?? "Could not create upload URL";
      if (message.includes("Bucket not found")) {
        return NextResponse.json(
          { error: `Bucket "${bucket}" not found — run supabase/storage.sql in Supabase SQL editor.` },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({
      bucket,
      path,
      token: signed.data.token,
      signedUrl: signed.data.signedUrl,
      publicUrl: urlData.publicUrl,
      contentType,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

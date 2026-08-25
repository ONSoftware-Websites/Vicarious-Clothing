"use client";

import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useCallback, useRef, useState } from "react";

interface ImageDropzoneProps {
  images: Array<{ src: string; alt?: string }>;
  onChange: (images: Array<{ src: string; alt?: string }>) => void;
  bucket?: "product-images" | "journal-images";
  max?: number;
  single?: boolean;
}

interface SignedUploadResponse {
  bucket: "product-images" | "journal-images";
  path: string;
  token: string;
  publicUrl: string;
  contentType: string;
  needsPngConversion?: boolean;
}

interface ConvertResponse {
  url: string;
  path: string;
  contentType: string;
  converted: boolean;
}

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const APPLE_PHOTO_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
  "heic",
  "heif",
  "tif",
  "tiff",
  "dng",
]);

const APPLE_SOURCE_EXTENSIONS = new Set(["heic", "heif", "tif", "tiff", "dng"]);

function extensionOf(name: string) {
  const clean = name.split(/[?#]/)[0] ?? name;
  return clean.split(".").pop()?.toLowerCase() ?? "";
}

function isAcceptedPhotoFile(file: File) {
  const ext = extensionOf(file.name);
  const type = file.type.toLowerCase();
  return (
    type.startsWith("image/") ||
    type.includes("heic") ||
    type.includes("heif") ||
    type.includes("tiff") ||
    type.includes("dng") ||
    APPLE_PHOTO_EXTENSIONS.has(ext)
  );
}

function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase browser upload is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function getSignedUpload(file: File, bucket: "product-images" | "journal-images") {
  const res = await fetch("/api/admin/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket,
      name: file.name,
      size: file.size,
      type: file.type,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not prepare upload");
  return data as SignedUploadResponse;
}

async function convertUploadedSourceToPng(signed: SignedUploadResponse) {
  const res = await fetch("/api/admin/upload/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket: signed.bucket, path: signed.path }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not convert Apple image to PNG");
  return data as ConvertResponse;
}

async function uploadDirectToSupabase(file: File, bucket: "product-images" | "journal-images") {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File too large. Please keep product photos under 50MB each.");
  }

  const signed = await getSignedUpload(file, bucket);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, file, {
      contentType: signed.contentType,
    });

  if (error) throw new Error(error.message);

  if (signed.needsPngConversion || APPLE_SOURCE_EXTENSIONS.has(extensionOf(file.name))) {
    const converted = await convertUploadedSourceToPng(signed);
    return converted.url;
  }

  return signed.publicUrl;
}

export function ImageDropzone({ images, onChange, bucket = "product-images", max = 10, single = false }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(isAcceptedPhotoFile);
    if (list.length === 0) {
      setError("Please select image files only. JPEG, PNG, WebP, HEIC, HEIF, TIFF and Apple ProRAW DNG are accepted.");
      return;
    }

    const remaining = single ? 1 : max - images.length;
    const toUpload = list.slice(0, remaining);
    if (toUpload.length === 0) {
      setError(single ? "Replace the existing image first." : `Maximum ${max} images`);
      return;
    }

    setError("");
    setUploading((n) => n + toUpload.length);

    let nextImages = single ? [] : [...images];

    for (const file of toUpload) {
      try {
        const url = await uploadDirectToSupabase(file, bucket);
        if (single) {
          nextImages = [{ src: url }];
        } else {
          nextImages = [...nextImages, { src: url }];
        }
        onChange(nextImages);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }, [images, onChange, bucket, max, single]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={
          dragOver
            ? "flex min-h-[110px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-accent bg-accent-tint p-6 text-center"
            : "flex min-h-[110px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-line bg-cream p-6 text-center hover:border-ink-faint"
        }
      >
        <p className="font-display text-xs font-semibold uppercase tracking-[0.16em]">
          {uploading > 0 ? `Uploading ${uploading}…` : single ? "Drop cover image or click to browse" : "Drop images or click to browse"}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          {single
            ? "JPEG, PNG, WebP, HEIC, HEIF, TIFF, DNG — Apple formats become PNG"
            : `Up to ${max} images — Apple formats become PNG — 50MB each`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif,.tif,.tiff,.dng"
          multiple={!single}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              uploadFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {error && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-700">{error}</p>}

      {images.length > 0 && (
        <div className={single ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3 sm:grid-cols-3"}>
          {images.map((img, i) => (
            <div key={`${img.src}-${i}`} className="group relative border border-line bg-paper">
              {img.src ? (
                <Image
                  src={img.src}
                  alt={img.alt || `Image ${i + 1}`}
                  width={400}
                  height={500}
                  className="h-[180px] w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-[180px] items-center justify-center bg-cream font-mono text-[10px] uppercase text-ink-faint">No image</div>
              )}
              <div className="absolute inset-x-0 top-0 flex justify-between bg-ink/70 p-1">
                <div className="flex gap-1">
                  {!single && (
                    <>
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="bg-paper px-1.5 py-0.5 font-mono text-[10px] disabled:opacity-40">←</button>
                      <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="bg-paper px-1.5 py-0.5 font-mono text-[10px] disabled:opacity-40">→</button>
                    </>
                  )}
                  <span className="bg-paper px-1.5 py-0.5 font-mono text-[10px]">{i + 1}</span>
                </div>
                <button type="button" onClick={() => remove(i)} className="bg-red-600 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-red-700">Remove</button>
              </div>
              {!single && (
                <input
                  value={img.alt ?? ""}
                  onChange={(e) => {
                    const next = [...images];
                    next[i] = { ...next[i], alt: e.target.value };
                    onChange(next);
                  }}
                  placeholder="Alt text (optional)"
                  className="w-full border-t border-line px-2 py-1.5 font-mono text-[10px] focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
      )}
      {!single && images.length > 0 && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">{images.length}/{max} images — first is the cover</p>}
    </div>
  );
}

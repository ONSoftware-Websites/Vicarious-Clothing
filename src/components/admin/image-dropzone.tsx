"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface ImageDropzoneProps {
  images: Array<{ src: string; alt?: string }>;
  onChange: (images: Array<{ src: string; alt?: string }>) => void;
  bucket?: "product-images" | "journal-images";
  max?: number;
  single?: boolean;
}

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

const BROWSER_PREVIEW_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
const UNSUPPORTED_BROWSER_PREVIEW_EXTENSIONS = new Set(["heic", "heif", "tif", "tiff", "dng"]);

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

function canPreviewInBrowser(src: string) {
  const ext = extensionOf(src);
  if (UNSUPPORTED_BROWSER_PREVIEW_EXTENSIONS.has(ext)) return false;
  if (BROWSER_PREVIEW_EXTENSIONS.has(ext)) return true;
  // Supabase public URLs normally keep the original extension, but remote image
  // URLs without a useful extension should still be attempted.
  return true;
}

function formatLabel(src: string) {
  const ext = extensionOf(src);
  if (!ext) return "Image file uploaded";
  return `${ext.toUpperCase()} file uploaded`;
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
        const fd = new FormData();
        fd.append("file", file);
        fd.append("bucket", bucket);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        const url = data.url as string;
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
            ? "JPEG, PNG, WebP, HEIC, HEIF, TIFF, DNG — max 8MB"
            : `Up to ${max} images — JPEG, PNG, WebP, HEIC, HEIF, TIFF, DNG — 8MB each`}
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
              {img.src && canPreviewInBrowser(img.src) ? (
                <Image
                  src={img.src}
                  alt={img.alt || `Image ${i + 1}`}
                  width={400}
                  height={500}
                  className="h-[180px] w-full object-cover"
                  unoptimized
                />
              ) : img.src ? (
                <div className="flex h-[180px] flex-col items-center justify-center bg-cream px-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  <span>{formatLabel(img.src)}</span>
                  <span className="mt-2 normal-case tracking-normal">Stored successfully. Browser preview may not support this Apple format.</span>
                </div>
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
              {/* Alt text (optional) */}
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

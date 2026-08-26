"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductImageWatermark } from "@/components/product-image-watermark";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const step = useCallback(
    (dir: 1 | -1) => {
      setActive((i) => (i + dir + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen, step]);

  const current = images[active] ?? images[0];

  if (!images.length) {
    return (
      <div className="aspect-[4/5] w-full bg-cream p-12 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
        No images
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        <button
          type="button"
          className="group relative block w-full cursor-zoom-in overflow-hidden bg-cream"
          onClick={() => setFullscreen(true)}
          aria-label="Open fullscreen image viewer"
        >
          <Image
            src={current?.src ?? ""}
            alt={current?.alt ?? "Product image"}
            width={900}
            height={1125}
            priority
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <ProductImageWatermark size="md" />
          <span className="absolute bottom-3 left-3 bg-ink/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper backdrop-blur">
            {active + 1} / {images.length}
          </span>
          <span className="absolute inset-0 hidden items-center justify-center bg-ink/0 transition-colors group-hover:bg-ink/5 sm:flex">
            <span className="rounded-full bg-paper/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink opacity-0 transition-opacity group-hover:opacity-100">
              View
            </span>
          </span>
        </button>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(0, 8).map((img, i) => (
              <button
                key={`${img.src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "relative aspect-[4/5] overflow-hidden bg-cream transition-all",
                  active === i ? "ring-2 ring-ink ring-offset-1" : "opacity-70 hover:opacity-100 hover:ring-1 hover:ring-line"
                )}
                aria-label={`View image ${i + 1}`}
                aria-current={active === i}
              >
                <Image
                  src={img.src}
                  alt={img.alt ?? `Product image ${i + 1}`}
                  width={400}
                  height={500}
                  className="h-full w-full object-cover"
                  sizes="120px"
                />
                <ProductImageWatermark size="sm" className="scale-75 sm:scale-75" />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink/95"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image viewer"
          onClick={() => setFullscreen(false)}
        >
          <div className="flex items-center justify-between p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/70">
              {active + 1} / {images.length}
            </p>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper hover:text-white"
            >
              Close
            </button>
          </div>
          <div
            className="relative flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current?.src ?? ""}
              alt={current?.alt ?? "Product image"}
              fill
              className="object-contain"
              sizes="100vw"
            />
            <ProductImageWatermark size="lg" />
            <button
              type="button"
              onClick={() => step(-1)}
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-paper/10 text-paper transition-colors hover:bg-paper/25"
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-paper/10 text-paper transition-colors hover:bg-paper/25"
              aria-label="Next image"
            >
              →
            </button>
          </div>
          <div className="flex justify-center gap-2 p-4">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(i);
                }}
                className={cn(
                  "relative h-16 w-12 overflow-hidden border",
                  active === i
                    ? "border-paper"
                    : "border-transparent opacity-50 hover:opacity-100"
                )}
                aria-label={`Go to image ${i + 1}`}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <ProductImageWatermark size="sm" className="scale-[0.65] sm:scale-[0.65]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

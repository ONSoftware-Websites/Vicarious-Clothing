"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  const current = images[active];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <button
            type="button"
            className="relative block w-full cursor-zoom-in overflow-hidden bg-cream"
            onClick={() => setFullscreen(true)}
            aria-label="Open fullscreen image viewer"
          >
            <Image
              src={current?.src ?? ""}
              alt={current?.alt ?? "Product image"}
              width={900}
              height={1125}
              priority
              className="aspect-[4/5] w-full object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <span className="absolute bottom-3 right-3 bg-ink/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper">
              {active + 1} / {images.length}
            </span>
          </button>
        </div>
        {images.slice(0, 4).map((img, i) => {
          const index = i + 1 >= images.length ? i : i + 1;
          const image = images[index];
          if (!image) return null;
          return (
            <button
              key={image.src}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative block overflow-hidden bg-cream",
                active === index && "ring-2 ring-accent ring-offset-2"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.src}
                alt={image.alt ?? "Product image"}
                width={450}
                height={562}
                className="aspect-[4/5] w-full object-cover transition-opacity hover:opacity-80"
                sizes="(min-width: 1024px) 25vw, 50vw"
              />
            </button>
          );
        })}
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
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

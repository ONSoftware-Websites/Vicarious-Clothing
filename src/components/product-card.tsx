"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { conditionLabel, formatPrice } from "@/lib/utils";
import { productImageVariant } from "@/lib/product-image";
import { Badge } from "@/components/ui";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductImageWatermark } from "@/components/product-image-watermark";
import { ResilientImage } from "@/components/resilient-image";

export function ProductCard({
  product,
  showSoldOverlay = false,
  priority = false,
}: {
  product: Product;
  showSoldOverlay?: boolean;
  priority?: boolean;
}) {
  const [hoverIntent, setHoverIntent] = useState(false);
  const sold = product.status === "SOLD";
  const primary = product.images[0];
  const secondary = product.images[1];

  return (
    <div
      className="group relative"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHoverIntent(true);
      }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="block"
        aria-label={`${product.brand} ${product.name}, ${formatPrice(product.price)}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-cream">
          {hoverIntent && secondary?.src && secondary.src !== primary?.src && (
            <ResilientImage
              src={secondary.thumbSrc ?? productImageVariant(secondary.src, "thumb")}
              fallbackSrc={secondary.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              loading="lazy"
            />
          )}
          {primary?.src ? (
            <ResilientImage
              src={primary.thumbSrc ?? productImageVariant(primary.src, "thumb")}
              fallbackSrc={primary.src}
              alt={primary.alt ?? `${product.brand} ${product.name}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-opacity duration-300 group-hover:opacity-0"
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cream px-4 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
              Image unavailable
            </div>
          )}
          <ProductImageWatermark size="sm" />
          {sold && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
              <span className="border border-paper/70 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-paper">
                Sold
              </span>
            </div>
          )}
          {product.compareAtPrice && !sold && (
            <span className="absolute left-3 top-3">
              <Badge tone="sale">Sale</Badge>
            </span>
          )}
          {showSoldOverlay && sold && product.soldAt && (
            <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/90">
              Sold{" "}
              {new Date(product.soldAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      </Link>

      <WishlistButton
        sku={product.sku}
        className="absolute right-3 top-3 bg-paper/90 p-2 transition-opacity hover:text-accent-deep sm:opacity-0 sm:group-hover:opacity-100"
        sold={sold}
      />

      <div className="pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
          {product.brand}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-0.5 block font-display text-sm font-medium leading-snug hover:text-accent-deep"
        >
          {product.name}
        </Link>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          Size {product.size} · {conditionLabel(product.condition)}
        </p>
        <p className="mt-1.5 font-mono text-sm">
          {formatPrice(product.price)}
          {product.compareAtPrice && (
            <span className="ml-2 text-ink-faint line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

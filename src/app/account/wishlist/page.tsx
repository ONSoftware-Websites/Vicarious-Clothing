"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account-shell";
import { useWishlist } from "@/hooks/use-wishlist";
import { useMounted } from "@/hooks/use-local-storage";
import { conditionLabel, formatPrice } from "@/lib/utils";

interface WishlistProduct {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  price: number;
  status: string;
  images: Array<{ src: string; alt?: string }>;
}

export default function WishlistPage() {
  const { skus, remove } = useWishlist();
  const mounted = useMounted();
  const [products, setProducts] = useState<Record<string, WishlistProduct>>({});

  useEffect(() => {
    if (!mounted || skus.length === 0) return;
    let cancelled = false;
    fetch(`/api/products?skus=${encodeURIComponent(skus.join(","))}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, WishlistProduct> = {};
        for (const p of data.products) map[p.sku] = p;
        setProducts(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [skus, mounted]);

  const loading =
    !mounted || (skus.length > 0 && skus.some((s) => !products[s]));

  const items = skus
    .map((sku) => products[sku])
    .filter(Boolean)
    .sort((a, b) => (a.status === "SOLD" ? 1 : 0) - (b.status === "SOLD" ? 1 : 0));

  return (
    <AccountShell>
      <h2 className="mb-6 font-display text-lg font-semibold uppercase tracking-tight">
        Wishlist
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-5 py-5 animate-pulse">
              <div className="h-[112px] w-[90px] bg-cream" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 bg-cream" />
                <div className="h-4 w-3/4 bg-line" />
                <div className="h-3 w-20 bg-cream" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-line bg-cream p-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">Wishlist</p>
          <p className="mt-3 font-display text-xl font-semibold uppercase tracking-tight">Nothing saved yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            Tap the heart on any piece to keep it here. One-of-one, so save the ones you love.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-11 items-center justify-center bg-ink px-8 font-display text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:bg-accent"
          >
            Browse everything
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {items.map((product) => {
            const sold = product.status === "SOLD";
            return (
              <li key={product.sku} className="flex gap-5 py-5">
                <Link href={`/product/${product.slug}`} className="shrink-0">
                  <Image
                    src={product.images[0]?.src ?? ""}
                    alt={product.name}
                    width={90}
                    height={112}
                    className="h-[112px] w-[90px] object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                    {product.brand}
                  </p>
                  <Link
                    href={`/product/${product.slug}`}
                    className="font-display text-sm font-medium hover:text-accent-deep"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                    Size {product.size} ·{" "}
                    {conditionLabel(product.condition as never).toUpperCase()}
                  </p>
                  {sold ? (
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-red-700">
                      Sold — check similar pieces on the product page
                    </p>
                  ) : (
                    <p className="mt-2 font-mono text-sm">
                      {formatPrice(product.price)}
                    </p>
                  )}
                  <div className="mt-auto flex gap-4 pt-2">
                    {!sold && (
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep underline underline-offset-2"
                      >
                        View piece →
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(product.sku)}
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint underline underline-offset-2 hover:text-accent-deep"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AccountShell>
  );
}

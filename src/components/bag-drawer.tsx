"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductImageWatermark } from "@/components/product-image-watermark";
import { useShopUi } from "@/hooks/use-shop-ui";
import { useCart } from "@/hooks/use-cart";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/site";
import { conditionLabel, formatPrice } from "@/lib/utils";

interface BagProduct {
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

export function BagDrawer() {
  const { bagOpen, closeBag } = useShopUi();
  const { lines, remove, setQty, count } = useCart();
  const [products, setProducts] = useState<Record<string, BagProduct>>({});

  useEffect(() => {
    if (bagOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [bagOpen]);

  useEffect(() => {
    if (!bagOpen || lines.length === 0) return;
    let cancelled = false;
    const skus = lines.map((l) => l.sku).join(",");
    fetch(`/api/products?skus=${encodeURIComponent(skus)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, BagProduct> = {};
        for (const p of data.products) map[p.sku] = p;
        setProducts(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bagOpen, lines]);

  if (!bagOpen) return null;

  const loading = lines.length > 0 && lines.some((l) => !products[l.sku]);

  const items = lines
    .map((line) => ({ line, product: products[line.sku] }))
    .filter((x) => x.product);

  const subtotal = items.reduce((sum, { line, product }) => sum + product.price * line.qty, 0);
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
  const progress = Math.min(100, Math.max(0, (subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm"
      onClick={closeBag}
      role="dialog"
      aria-modal="true"
      aria-label="Bag"
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
            Bag {count > 0 && `(${count})`}
          </h2>
          <button
            type="button"
            onClick={closeBag}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-accent-deep"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {loading ? (
            <div className="space-y-4 py-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-[100px] w-20 bg-cream" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 bg-cream" />
                    <div className="h-4 w-3/4 bg-line" />
                    <div className="h-3 w-20 bg-cream" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">Bag</p>
              <p className="mt-3 font-display text-2xl font-semibold uppercase tracking-tight">Nothing yet.</p>
              <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-ink-soft">
                One-of-one pieces don’t wait. Find something before someone else does.
              </p>
              <Link
                href="/shop"
                onClick={closeBag}
                className="mt-8 inline-flex h-11 items-center justify-center bg-ink px-8 font-display text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:bg-accent"
              >
                Browse everything
              </Link>
              <Link href="/shop/new-in" onClick={closeBag} className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint underline underline-offset-2 hover:text-accent-deep">
                Shop new in →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map(({ line, product }) => (
                <li key={line.sku} className="flex gap-4 py-5">
                  <Link href={`/product/${product.slug}`} onClick={closeBag} className="relative shrink-0 overflow-hidden bg-cream">
                    <Image
                      src={product.images[0]?.src ?? ""}
                      alt={product.name}
                      width={80}
                      height={100}
                      className="h-[100px] w-20 object-cover transition-transform hover:scale-[1.03]"
                    />
                    <ProductImageWatermark size="sm" className="scale-[0.65] sm:scale-[0.65]" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                      {product.brand}
                    </p>
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={closeBag}
                      className="font-display text-sm font-medium leading-tight hover:text-accent-deep"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                      {product.sku} · Size {product.size} · {conditionLabel(product.condition as never).toUpperCase()}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">One of one</span>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm font-medium">
                          {formatPrice(product.price * line.qty)}
                        </p>
                        <button
                          type="button"
                          onClick={() => remove(line.sku)}
                          className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint underline underline-offset-2 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line bg-cream px-6 py-5">
            <div className="mb-3">
              <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em]">
                <span className={remaining <= 0 ? "text-accent-deep" : "text-ink-soft"}>
                  {remaining > 0 ? `Add ${formatPrice(remaining)} for free delivery` : "Free delivery unlocked ✓"}
                </span>
                <span className="text-ink-faint">{formatPrice(subtotal)} / {formatPrice(FREE_DELIVERY_THRESHOLD)}</span>
              </div>
              <div className="h-1.5 w-full bg-line">
                <div className="h-1.5 bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-sm font-medium uppercase tracking-[0.14em]">
                Subtotal
              </p>
              <p className="font-mono text-base">{formatPrice(subtotal)}</p>
            </div>
            <Link
              href="/checkout"
              onClick={closeBag}
              className="flex h-13 w-full items-center justify-center bg-ink font-display text-xs font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-accent"
            >
              Checkout
            </Link>
            <Link
              href="/bag"
              onClick={closeBag}
              className="mt-3 block text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft underline underline-offset-4 hover:text-accent-deep"
            >
              View full bag
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
            <div className="flex h-full items-center justify-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
                Loading…
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-xl font-semibold uppercase">
                Nothing yet.
              </p>
              <p className="mt-2 max-w-[220px] text-sm text-ink-soft">
                Find something.
              </p>
              <Link
                href="/shop"
                onClick={closeBag}
                className="mt-6 inline-block border border-ink px-6 py-3 font-display text-xs font-medium uppercase tracking-[0.14em] hover:bg-ink hover:text-paper"
              >
                Browse everything
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map(({ line, product }) => (
                <li key={line.sku} className="flex gap-4 py-5">
                  <Link href={`/product/${product.slug}`} onClick={closeBag}>
                    <Image
                      src={product.images[0]?.src ?? ""}
                      alt={product.name}
                      width={80}
                      height={100}
                      className="h-[100px] w-20 object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                      {product.brand}
                    </p>
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={closeBag}
                      className="font-display text-sm font-medium hover:text-accent-deep"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                      Size {product.size} · {conditionLabel(product.condition as never).toUpperCase()}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => setQty(line.sku, line.qty - 1)}
                          className="h-8 w-8 text-sm hover:bg-cream"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-mono text-xs">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.sku, line.qty + 1)}
                          className="h-8 w-8 text-sm hover:bg-cream"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm">
                          {formatPrice(product.price * line.qty)}
                        </p>
                        <button
                          type="button"
                          onClick={() => remove(line.sku)}
                          className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint underline underline-offset-2 hover:text-accent-deep"
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
          <div className="border-t border-line px-6 py-5">
            {remaining > 0 ? (
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                Add {formatPrice(remaining)} for free UK delivery
              </p>
            ) : (
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
                Free UK delivery unlocked
              </p>
            )}
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";
import { useMounted } from "@/hooks/use-local-storage";
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_COST } from "@/lib/site";
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

export default function BagPage() {
  const { lines, remove, setQty } = useCart();
  const mounted = useMounted();
  const [products, setProducts] = useState<Record<string, BagProduct>>({});

  useEffect(() => {
    if (!mounted || lines.length === 0) return;
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
  }, [lines, mounted]);

  const loading = mounted && lines.length > 0 && lines.some((l) => !products[l.sku]);

  const items = lines
    .map((line) => ({ line, product: products[line.sku] }))
    .filter((x) => x.product);

  const soldItems = items.filter(({ product }) => product.status === "SOLD");

  const subtotal = items.reduce(
    (sum, { line, product }) => sum + product.price * line.qty,
    0
  );
  const freeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-8 border-b border-line pb-6 font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
        Bag
      </h1>

      {!mounted || loading ? (
        <div className="py-24 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
            Loading…
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl font-semibold uppercase tracking-tight">
            Nothing yet.
          </p>
          <p className="mt-2 text-ink-soft">Find something.</p>
          <Link
            href="/shop"
            className="mt-8 inline-block border border-ink px-8 py-3.5 font-display text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
          >
            Browse everything
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {soldItems.length > 0 && (
              <div className="mb-6 border border-red-200 bg-red-50 p-5">
                <p className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
                  Someone got there first
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  A piece in your bag has just sold. Remove it to continue.
                </p>
              </div>
            )}
            <ul className="divide-y divide-line border-t border-line">
              {items.map(({ line, product }) => (
                <li key={line.sku} className="flex gap-5 py-6">
                  <Link href={`/product/${product.slug}`} className="shrink-0">
                    <Image
                      src={product.images[0]?.src ?? ""}
                      alt={product.name}
                      width={110}
                      height={137}
                      className="h-[137px] w-[110px] object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                      {product.brand}
                    </p>
                    <Link
                      href={`/product/${product.slug}`}
                      className="font-display text-base font-medium hover:text-accent-deep"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                      {product.sku} · Size {product.size} ·{" "}
                      {conditionLabel(product.condition as never).toUpperCase()}
                    </p>
                    {product.status === "SOLD" && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-red-700">
                        Sold
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => setQty(line.sku, line.qty - 1)}
                          className="h-9 w-9 hover:bg-cream"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-9 text-center font-mono text-xs">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.sku, line.qty + 1)}
                          className="h-9 w-9 hover:bg-cream"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
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
          </div>

          <aside className="lg:col-span-1">
            <div className="border border-line bg-cream p-6 lg:sticky lg:top-24">
              <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em]">
                Summary
              </h2>
              <dl className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Delivery</dt>
                  <dd>{freeDelivery ? "Free" : formatPrice(STANDARD_DELIVERY_COST)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-sm">
                  <dt className="font-semibold uppercase tracking-[0.12em]">Total</dt>
                  <dd>
                    {formatPrice(
                      subtotal + (freeDelivery ? 0 : STANDARD_DELIVERY_COST)
                    )}
                  </dd>
                </div>
              </dl>
              {!freeDelivery && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  Add {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for
                  free UK delivery
                </p>
              )}
              <Link
                href="/checkout"
                aria-disabled={soldItems.length > 0}
                className={
                  soldItems.length > 0
                    ? "pointer-events-none mt-6 flex h-13 w-full items-center justify-center bg-ink-faint font-display text-xs font-semibold uppercase tracking-[0.16em] text-paper"
                    : "mt-6 flex h-13 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-accent"
                }
              >
                Checkout
              </Link>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Guest checkout available
              </p>
            </div>
          </aside>
        </div>
      )}
    </Container>
  );
}

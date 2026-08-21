import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] w-full bg-cream" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-16 bg-line" />
        <div className="h-4 w-3/4 bg-line" />
        <div className="h-3 w-20 bg-line" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-14">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductGrid({
  products,
  showSoldOverlay = false,
}: {
  products: Product[];
  showSoldOverlay?: boolean;
}) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center sm:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">No matches</p>
        <p className="mt-3 font-display text-2xl font-semibold uppercase tracking-tight sm:text-3xl">
          Nothing matched that.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          Try adjusting your filters or search — or browse everything we have in stock.
        </p>
        <a
          href="/shop"
          className="mt-8 inline-flex h-11 items-center justify-center border border-ink px-8 font-display text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
        >
          Browse everything
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-14">
      {products.map((product, i) => (
        <ProductCard
          key={product.sku}
          product={product}
          showSoldOverlay={showSoldOverlay}
          priority={i < 4}
        />
      ))}
    </div>
  );
}

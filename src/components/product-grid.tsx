import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

export function ProductGrid({
  products,
  showSoldOverlay = false,
}: {
  products: Product[];
  showSoldOverlay?: boolean;
}) {
  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-xl font-semibold uppercase">
          Nothing matched that.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Try another search or browse everything.
        </p>
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

import type { Category } from "@/lib/types";
import { Container } from "@/components/ui";
import { ProductGrid } from "@/components/product-grid";
import { SortMenu } from "@/components/sort-menu";
import { FilterSheet } from "@/components/filter-sheet";
import { filterProducts, getFacets, type SortKey } from "@/lib/catalog";
import { listProducts } from "@/lib/server/store";
import { CATEGORY_LABELS } from "@/lib/site";
import { isRecent } from "@/lib/utils";

export interface ShopParams {
  brand?: string;
  size?: string;
  condition?: string;
  colour?: string;
  min?: string;
  max?: string;
  sort?: string;
  q?: string;
  collection?: string;
}

export async function ShopView({
  category,
  params,
}: {
  category?: Category | "new-in" | "sale";
  params: ShopParams;
}) {
  const allProducts = (await listProducts()).filter((p) => p.status !== "DRAFT");
  const facets = getFacets(allProducts);

  const filters = {
    category,
    brands: params.brand?.split(",").filter(Boolean),
    sizes: params.size?.split(",").filter(Boolean),
    conditions: params.condition?.split(",").filter(Boolean),
    colours: params.colour?.split(",").filter(Boolean),
    minPrice: params.min ? Number(params.min) : undefined,
    maxPrice: params.max ? Number(params.max) : undefined,
    q: params.q,
    onlyAvailable: true,
  };

  let products = filterProducts(
    allProducts,
    filters,
    (params.sort ?? "newest") as SortKey
  );

  if (params.collection === "picks") {
    products = products.filter((p) => p.isPick);
  } else if (params.collection === "latest") {
    products = products.filter((p) => isRecent(p.listedAt, 30));
  } else if (params.collection === "under-25") {
    products = products.filter((p) => p.price < 25);
  }

  const heading = category
    ? category === "new-in"
      ? "New In"
      : category === "sale"
        ? "Sale"
        : CATEGORY_LABELS[category]
    : "Shop";

  const activeFilterCount =
    (params.brand?.split(",").filter(Boolean).length ?? 0) +
    (params.size?.split(",").filter(Boolean).length ?? 0) +
    (params.condition?.split(",").filter(Boolean).length ?? 0) +
    (params.colour?.split(",").filter(Boolean).length ?? 0) +
    (params.min ? 1 : 0) +
    (params.max ? 1 : 0);

  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            {products.length} {products.length === 1 ? "item" : "items"}
            {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`}
          </p>
        </div>
        <div className="hidden sm:block">
          <SortMenu />
        </div>
      </div>

      <div className="mb-6 flex gap-3 sm:hidden">
        <FilterSheet facets={facets} />
        <SortMenu />
      </div>

      <div className="flex gap-10">
        <div className="hidden lg:block">
          <FilterSheet facets={facets} />
        </div>
        <div className="flex-1">
          <ProductGrid products={products} />
        </div>
      </div>
    </Container>
  );
}

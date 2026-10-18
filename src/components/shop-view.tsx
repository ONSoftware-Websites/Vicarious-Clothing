import Link from "next/link";
import type { Category } from "@/lib/types";
import { Container } from "@/components/ui";
import { ProductGrid } from "@/components/product-grid";
import { SortMenu } from "@/components/sort-menu";
import { FilterSheet } from "@/components/filter-sheet";
import { filterProducts, getFacets, type SortKey } from "@/lib/catalog";
import { isPublicProduct, parsePriceFilter } from "@/lib/public-catalog";
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
  page?: string;
}

export async function ShopView({
  category,
  params,
}: {
  category?: Category | "new-in" | "sale";
  params: ShopParams;
}) {
  const allProducts = (await listProducts()).filter(isPublicProduct);
  const facets = getFacets(allProducts);

  const filters = {
    category,
    brands: params.brand?.split(",").filter(Boolean),
    sizes: params.size?.split(",").filter(Boolean),
    conditions: params.condition?.split(",").filter(Boolean),
    colours: params.colour?.split(",").filter(Boolean),
    minPrice: parsePriceFilter(params.min),
    maxPrice: parsePriceFilter(params.max),
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

  const pageSize=24;
  const requestedPage=Number(params.page);
  const totalPages=Math.max(1,Math.ceil(products.length/pageSize));
  const page=Number.isSafeInteger(requestedPage)&&requestedPage>0?Math.min(requestedPage,totalPages):1;
  const visibleProducts=products.slice((page-1)*pageSize,page*pageSize);
  const pageHref=(target:number)=>{const query=new URLSearchParams();for(const [key,value] of Object.entries(params)){if(value&&key!=="page")query.set(key,value);}query.set("page",String(target));return `?${query.toString()}`;};

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

  const chips: {key:string;value:string;label:string}[]=[];
  for(const [key,label] of [["brand","Brand"],["size","Size"],["condition","Condition"],["colour","Colour"]] as const){
    for(const value of (params[key]??"").split(",").filter(Boolean))chips.push({key,value,label:`${label}: ${value}`});
  }
  if(params.min)chips.push({key:"min",value:params.min,label:`From £${params.min}`});
  if(params.max)chips.push({key:"max",value:params.max,label:`To £${params.max}`});
  const removeChip=(chip:{key:string;value:string})=>{
    const query=new URLSearchParams();
    for(const [key,value] of Object.entries(params))if(value&&key!=="page")query.set(key,value);
    if(chip.key==="min"||chip.key==="max")query.delete(chip.key);
    else {const values=(query.get(chip.key)??"").split(",").filter(value=>value!==chip.value);if(values.length)query.set(chip.key,values.join(","));else query.delete(chip.key);}
    return `?${query.toString()}`;
  };
  const clearHref=()=>{const query=new URLSearchParams();if(params.q)query.set("q",params.q);if(params.collection)query.set("collection",params.collection);if(params.sort)query.set("sort",params.sort);return `?${query.toString()}`;};

  return (
    <Container className="py-8 sm:py-12">
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

      {chips.length>0&&<div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Applied filters">{chips.map(chip=><Link key={`${chip.key}:${chip.value}`} href={removeChip(chip)} scroll={false} className="inline-flex min-h-10 items-center gap-2 border border-line bg-cream px-3 py-2 font-mono text-[11px] text-ink hover:border-ink">{chip.label}<span aria-hidden="true">×</span><span className="sr-only">Remove filter</span></Link>)}<Link href={clearHref()} scroll={false} className="inline-flex min-h-10 items-center px-3 font-mono text-[11px] underline underline-offset-4">Clear filters</Link></div>}
      <div className="mb-6 flex gap-3 sm:hidden">
        <FilterSheet facets={facets} />
        <SortMenu />
      </div>

      <div className="flex gap-10">

        <div className="flex-1 min-w-0">
          <div className="mb-5 hidden lg:flex items-center justify-between border-y border-line py-3"><FilterSheet facets={facets} /><p className="font-mono text-[11px] uppercase text-ink-soft">{products.length} pieces found</p></div>
          {visibleProducts.length ? <ProductGrid products={visibleProducts} /> : <div className="border border-line bg-cream px-6 py-12 text-center"><p className="font-display text-xl font-bold uppercase">No matching pieces</p><p className="mt-2 text-sm text-ink-soft">Try a broader search or remove some filters.</p><Link href="/shop" className="mt-5 inline-block border border-ink px-6 py-3 font-mono text-xs uppercase">Browse all clothing</Link></div>}
          {totalPages>1 && <nav aria-label="Catalogue pages" className="mt-10 flex flex-wrap items-center justify-center gap-3"><Link href={pageHref(Math.max(1,page-1))} aria-disabled={page===1} className={`border border-line px-4 py-2 font-mono text-xs uppercase ${page===1?"pointer-events-none opacity-40":""}`}>Previous</Link><span className="font-mono text-xs text-ink-soft">Page {page} of {totalPages}</span><Link href={pageHref(Math.min(totalPages,page+1))} aria-disabled={page===totalPages} className={`border border-line px-4 py-2 font-mono text-xs uppercase ${page===totalPages?"pointer-events-none opacity-40":""}`}>Next</Link></nav>}
        </div>
      </div>
    </Container>
  );
}

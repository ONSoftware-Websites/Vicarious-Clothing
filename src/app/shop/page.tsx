import type { Metadata } from "next";
import { ShopView, type ShopParams } from "@/components/shop-view";
import { COLLECTIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop All Clothing",
  description:
    "Browse every piece currently in the Vicarious Clothing collection — pre-owned menswear and streetwear, each one measured, checked and photographed.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params: ShopParams = {
    brand: typeof raw.brand === "string" ? raw.brand : undefined,
    size: typeof raw.size === "string" ? raw.size : undefined,
    condition: typeof raw.condition === "string" ? raw.condition : undefined,
    colour: typeof raw.colour === "string" ? raw.colour : undefined,
    min: typeof raw.min === "string" ? raw.min : undefined,
    max: typeof raw.max === "string" ? raw.max : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    q: typeof raw.q === "string" ? raw.q : undefined,
    collection: typeof raw.collection === "string" ? raw.collection : undefined,
  };

  const collection = COLLECTIONS.find((c) => c.key === params.collection);
  const title = collection ? collection.label : "Shop All Clothing";

  return (
    <div>
      {collection && (
        <div className="border-b border-line bg-cream">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-deep">
              Collection
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold uppercase tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{collection.description}</p>
          </div>
        </div>
      )}
      <ShopView params={params} />
    </div>
  );
}

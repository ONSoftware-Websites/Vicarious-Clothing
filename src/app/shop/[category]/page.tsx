import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView, type ShopParams } from "@/components/shop-view";
import { CATEGORY_LABELS } from "@/lib/site";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID: Array<Category | "new-in" | "sale"> = [
  ...(Object.keys(CATEGORY_LABELS) as Category[]),
  "new-in",
  "sale",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!VALID.includes(category as never)) return {};
  const label =
    category === "new-in"
      ? "New In"
      : category === "sale"
        ? "Sale"
        : CATEGORY_LABELS[category as Category];
  return {
    title: `${label}`,
    description: `Browse pre-owned ${label.toLowerCase()} at Vicarious Clothing — every piece measured, checked against our condition scale and photographed properly.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  if (!VALID.includes(category as never)) notFound();

  const raw = await searchParams;
  const shopParams: ShopParams = {
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

  return <ShopView category={category as Category | "new-in" | "sale"} params={shopParams} />;
}

import type { NextRequest } from "next/server";
import type { Category, Condition, Product } from "@/lib/types";
import { CATEGORIES, CONDITIONS, MARKETPLACES } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { fetchProductFromSellerHq } from "@/lib/server/sellerhq-sync";

type SellerHqProduct = {
  id?: string;
  businessId?: string;
  code?: string;
  sku?: string;
  name?: string;
  description?: string;
  brand?: string;
  category?: string;
  size?: string;
  colour?: string;
  color?: string;
  condition?: string;
  purchasePrice?: number | string | null;
  purchaseDate?: string | null;
  purchaseSource?: string;
  storageLocation?: string;
  photos?: string[];
  labels?: string[];
  customFields?: Record<string, unknown>;
  status?: string;
  marketplaces?: string[];
  listingPrice?: number | string | null;
  listingDate?: string | null;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function moneyString(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  const amount = Number(value);
  return Number.isFinite(amount) ? String(Math.round(amount * 100) / 100) : "";
}

function normalise(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function mapCategory(value: unknown): Category {
  const raw = normalise(value);
  const table: Record<string, Category> = {
    top: "tops",
    tops: "tops",
    t_shirt: "tops",
    tshirt: "tops",
    shirt: "tops",
    blouse: "tops",
    trouser: "trousers",
    trousers: "trousers",
    pants: "trousers",
    joggers: "trousers",
    dress: "dresses",
    dresses: "dresses",
    skirt: "skirts",
    skirts: "skirts",
    shoe: "shoes",
    shoes: "shoes",
    footwear: "footwear",
    trainer: "footwear",
    trainers: "footwear",
    accessory: "accessories",
    accessories: "accessories",
    bag: "accessories",
    hat: "accessories",
    hoodie: "hoodies",
    hoodies: "hoodies",
    knit: "knitwear",
    knitwear: "knitwear",
    jumper: "knitwear",
    sweater: "knitwear",
    jacket: "jackets",
    jackets: "jackets",
    coat: "jackets",
    coats: "jackets",
    jean: "jeans",
    jeans: "jeans",
    vintage: "vintage",
  };
  if (raw in table) return table[raw];
  if ((CATEGORIES as readonly string[]).includes(raw)) return raw as Category;
  return "vintage";
}

function mapCondition(value: unknown): Condition {
  const raw = normalise(value);
  const table: Record<string, Condition> = {
    new: "new_without_tags",
    new_without_tags: "new_without_tags",
    new_with_tags: "new_with_tags",
    very_good: "very_good",
    excellent: "excellent",
    good: "good",
    satisfactory: "fair",
    fair: "fair",
    for_parts_not_working: "fair",
    parts_not_working: "fair",
  };
  if (raw in table) return table[raw];
  if ((CONDITIONS as readonly string[]).includes(raw)) return raw as Condition;
  return "good";
}

function defectsFrom(source: SellerHqProduct) {
  const fields = source.customFields ?? {};
  const defects = fields.defects ?? fields.Defects ?? fields.damage ?? fields.Damage;
  if (Array.isArray(defects)) return defects.map(clean).filter(Boolean);
  if (typeof defects === "string") {
    return defects
      .split(/\n|,/)
      .map(clean)
      .filter(Boolean);
  }
  return [];
}

function tagsFrom(source: SellerHqProduct) {
  const labels = Array.isArray(source.labels) ? source.labels : [];
  const marketplaces = Array.isArray(source.marketplaces) ? source.marketplaces : [];
  return [...labels, ...marketplaces].map(clean).filter(Boolean).slice(0, 20);
}

function marketplaceFrom(source: SellerHqProduct): Product["marketplace"] {
  const sourceMarkets = new Set((source.marketplaces ?? []).map((m) => normalise(m)));
  return MARKETPLACES.map((channel) => ({
    channel,
    status:
      channel === "website" || sourceMarkets.has(channel)
        ? "LISTED"
        : "NOT_LISTED",
  }));
}

function mapForForm(source: SellerHqProduct) {
  const prdCode = clean(source.code || source.id);
  const brand = clean(source.brand);
  const name = clean(source.name);
  const photos = Array.isArray(source.photos) ? source.photos.map(clean).filter(Boolean) : [];

  return {
    prdCode,
    name,
    brand,
    category: mapCategory(source.category),
    size: clean(source.size),
    colour: clean(source.colour || source.color),
    material: clean(source.customFields?.material ?? source.customFields?.Material),
    condition: mapCondition(source.condition),
    conditionNotes: clean(source.customFields?.conditionNotes ?? source.customFields?.ConditionNotes),
    measurements: [],
    description: clean(source.description),
    defects: defectsFrom(source),
    tags: tagsFrom(source),
    price: moneyString(source.listingPrice),
    cost: moneyString(source.purchasePrice),
    images: photos.map((src, index) => ({ src, alt: `${brand || "Product"} ${name || "image"} - image ${index + 1}` })),
    location: clean(source.storageLocation),
    acquisitionSource: clean(source.purchaseSource),
    purchaseDate: source.purchaseDate ?? "",
    marketplace: marketplaceFrom(source),
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ prdCode: string }> }
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const params = await context.params;
  const prdCode = decodeURIComponent(params.prdCode ?? "").trim();
  if (!prdCode) return Response.json({ error: "Missing PRD code" }, { status: 400 });

  const result = await fetchProductFromSellerHq(prdCode);
  if (!result.ok) {
    return Response.json(
      { error: result.error ?? "Could not pull product from SellerHQ" },
      { status: result.status && result.status >= 400 ? result.status : 502 }
    );
  }

  const data = result.data as { product?: SellerHqProduct } | null;
  if (!data?.product) {
    return Response.json({ error: "SellerHQ product not found" }, { status: 404 });
  }

  return Response.json({ ok: true, product: data.product, mapped: mapForForm(data.product) });
}

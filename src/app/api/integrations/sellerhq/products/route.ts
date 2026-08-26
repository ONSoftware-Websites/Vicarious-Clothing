import type { NextRequest } from "next/server";
import type { Category, Condition, InventoryStatus, MarketplaceListing, Product } from "@/lib/types";
import { CATEGORIES, CONDITIONS, INVENTORY_STATUSES } from "@/lib/types";
import { getProductBySku, listProducts, nextSku, upsertProduct } from "@/lib/server/store";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
  salePrice?: number | string | null;
  saleDate?: string | null;
};

type SyncBody = {
  product?: SellerHqProduct;
  publish?: boolean;
  action?: "upsert" | "archive" | "delete";
};

function timingSafeEqualText(a: string, b: string) {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function requireIntegrationKey(request: NextRequest) {
  const configured = process.env.SELLERHQ_API_KEY;
  if (!configured) {
    return Response.json(
      { error: "SellerHQ integration is not configured" },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const header = request.headers.get("x-sellerhq-api-key")?.trim() ?? "";
  const supplied = bearer || header;

  if (!supplied || !timingSafeEqualText(supplied, configured)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function money(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined;
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

function mapStatus(source: SellerHqProduct, publish: boolean): InventoryStatus {
  const raw = normalise(source.status);
  if (raw === "sold" || source.saleDate) return "SOLD";
  if (raw === "archived" || raw === "removed" || raw === "returned") return "ARCHIVED";
  if (raw === "reserved" || raw === "awaiting_shipping" || raw === "in_shipping") return "RESERVED";
  if (publish || raw === "listed") return "AVAILABLE";
  if (raw === "draft" || raw === "unlisted" || raw === "relisting_required" || raw === "issue") return "DRAFT";
  return "DRAFT";
}

function mapMarketplace(source: SellerHqProduct, publish: boolean): MarketplaceListing[] {
  const sourceMarkets = new Set((source.marketplaces ?? []).map((m) => normalise(m)));
  return [
    { channel: "website", status: publish ? "LISTED" : "NOT_LISTED" },
    { channel: "vinted", status: sourceMarkets.has("vinted") ? "LISTED" : "NOT_LISTED" },
    { channel: "depop", status: sourceMarkets.has("depop") ? "LISTED" : "NOT_LISTED" },
    { channel: "ebay", status: sourceMarkets.has("ebay") ? "LISTED" : "NOT_LISTED" },
  ];
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
  const marketplaceLabels = Array.isArray(source.marketplaces) ? source.marketplaces : [];
  return [...labels, ...marketplaceLabels]
    .map(clean)
    .filter(Boolean)
    .slice(0, 20);
}

async function findExisting(source: SellerHqProduct) {
  const sku = clean(source.sku).toUpperCase();
  if (sku.startsWith("VC-")) {
    const bySku = await getProductBySku(sku);
    if (bySku) return bySku;
  }

  const prdCode = clean(source.code || source.id);
  if (!prdCode) return undefined;
  const products = await listProducts();
  return products.find((p) => p.prdCode?.toLowerCase() === prdCode.toLowerCase());
}

async function mapSellerHqProduct(source: SellerHqProduct, publish: boolean): Promise<Product> {
  const prdCode = clean(source.code || source.id);
  if (!prdCode) throw new Error("SellerHQ product code is required");

  const existing = await findExisting(source);
  const sku = existing?.sku ?? await nextSku();
  const name = clean(source.name) || "Untitled product";
  const brand = clean(source.brand) || "Unbranded";
  const price = money(source.listingPrice) ?? money(source.salePrice) ?? existing?.price ?? 0;
  if (price <= 0) throw new Error("A positive listingPrice is required");

  const slug = existing?.slug ?? `${sku.toLowerCase()}-${slugify(brand)}-${slugify(name)}`;
  const photos = Array.isArray(source.photos) ? source.photos.map(clean).filter(Boolean) : [];
  const status = mapStatus(source, publish);

  if (status === "AVAILABLE" && photos.length === 0 && !existing?.images.length) {
    throw new Error("Available website products require at least one photo URL");
  }

  return {
    sku,
    slug,
    name,
    brand,
    category: mapCategory(source.category),
    size: clean(source.size) || "One Size",
    colour: clean(source.colour || source.color),
    material: clean(source.customFields?.material ?? source.customFields?.Material),
    condition: mapCondition(source.condition),
    conditionNotes: clean(source.customFields?.conditionNotes ?? source.customFields?.ConditionNotes),
    measurements: existing?.measurements ?? [],
    description: clean(source.description),
    defects: defectsFrom(source),
    tags: tagsFrom(source),
    price,
    compareAtPrice: existing?.compareAtPrice,
    cost: money(source.purchasePrice) ?? existing?.cost,
    floorPrice: existing?.floorPrice,
    images: photos.length
      ? photos.map((src, idx) => ({ src, alt: `${brand} ${name} - image ${idx + 1}` }))
      : existing?.images ?? [],
    status: (INVENTORY_STATUSES as readonly string[]).includes(status) ? status : "DRAFT",
    location: clean(source.storageLocation) || existing?.location,
    listedAt:
      status === "AVAILABLE" && !existing?.listedAt
        ? new Date().toISOString()
        : existing?.listedAt ?? source.listingDate ?? new Date().toISOString(),
    soldAt: source.saleDate ?? existing?.soldAt,
    reservedUntil: existing?.reservedUntil,
    acquisitionSource: clean(source.purchaseSource) || existing?.acquisitionSource,
    purchaseDate: source.purchaseDate ?? existing?.purchaseDate,
    prdCode,
    marketplace: mapMarketplace(source, publish),
    isPick: existing?.isPick ?? false,
    featured: existing?.featured ?? false,
  };
}

export async function POST(request: NextRequest) {
  const authError = requireIntegrationKey(request);
  if (authError) return authError;

  try {
    const body = await request.json() as SyncBody | SellerHqProduct;
    const source = "product" in body && body.product ? body.product : body as SellerHqProduct;
    const publish = "publish" in body ? Boolean(body.publish) : true;
    const product = await mapSellerHqProduct(source, publish);

    await upsertProduct(product, "SellerHQ", `${product.sku} synced from SellerHQ ${product.prdCode}`);

    return Response.json({
      ok: true,
      action: "upserted",
      sku: product.sku,
      slug: product.slug,
      prdCode: product.prdCode,
      status: product.status,
      url: `/product/${product.slug}`,
    });
  } catch (error) {
    console.error("SellerHQ product sync failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "SellerHQ product sync failed" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}

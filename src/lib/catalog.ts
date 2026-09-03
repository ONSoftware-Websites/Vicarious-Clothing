import type { Category, Product } from "@/lib/types";
import { isRecent } from "@/lib/utils";
import { listProducts } from "@/lib/server/store";

export interface CatalogFilters {
  category?: Category | "new-in" | "sale";
  brands?: string[];
  sizes?: string[];
  conditions?: string[];
  colours?: string[];
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  onlyAvailable?: boolean;
}

export type SortKey = "newest" | "price-asc" | "price-desc";

function normaliseFacetKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function titleCaseColour(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (match) => match.toUpperCase());
}

function uniqueSorted(values: string[]) {
  return uniqueValues(values).sort((a, b) => a.localeCompare(b));
}

function uniqueValues(
  values: string[],
  keyForValue: (value: string) => string = normaliseFacetKey
) {
  const seen = new Map<string, string>();

  for (const value of values) {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean) continue;
    const key = keyForValue(clean);
    if (!seen.has(key)) seen.set(key, clean);
  }

  return [...seen.values()];
}

export function splitColourValues(colour: string) {
  return uniqueSorted(
    colour
      .split(/\s*(?:,|\/|\+|\||&|;|\band\b)\s*/i)
      .map(titleCaseColour)
  );
}

const LETTER_SIZE_ORDER = new Map<string, number>([
  ["XXXXS", 0],
  ["XXXS", 1],
  ["XXS", 2],
  ["XS", 3],
  ["S", 4],
  ["M", 5],
  ["L", 6],
  ["XL", 7],
  ["XXL", 8],
  ["XXXL", 9],
  ["XXXXL", 10],
  ["OS", 20],
  ["ONESIZE", 20],
  ["ONESIZEFITSALL", 20],
]);

const SIZE_ALIASES: Record<string, string> = {
  EXTRASMALL: "XS",
  XSMALL: "XS",
  SMALL: "S",
  MEDIUM: "M",
  LARGE: "L",
  EXTRALARGE: "XL",
  XLARGE: "XL",
  DOUBLEEXTRALARGE: "XXL",
  DOUBLEXLARGE: "XXL",
  TRIPLEEXTRALARGE: "XXXL",
  TRIPLEXLARGE: "XXXL",
};

function normaliseSizeToken(value: string) {
  const token = value
    .trim()
    .toUpperCase()
    .replace(/^SIZE\s+/i, "")
    .replace(/\s+/g, "")
    .replace(/[_.]/g, "");

  const numericXl = token.match(/^(\d)XL$/);
  if (numericXl) return `${"X".repeat(Number(numericXl[1]))}L`;

  return SIZE_ALIASES[token] ?? token;
}

function letterSizeOrder(value: string) {
  const parts = value.split(/\s*(?:\/|-|\bto\b)\s*/i).map(normaliseSizeToken);
  const orders = parts
    .map((part) => LETTER_SIZE_ORDER.get(part))
    .filter((order): order is number => order !== undefined);

  if (orders.length === 0 || orders.length !== parts.length) return undefined;

  return orders.reduce((total, order) => total + order, 0) / orders.length;
}

function normaliseSizeKey(value: string) {
  const letterOrder = letterSizeOrder(value);
  if (letterOrder !== undefined) return `letter:${letterOrder}`;

  return normaliseFacetKey(value.replace(/^size\s+/i, ""));
}

function sizeSortParts(value: string) {
  const letterOrder = letterSizeOrder(value);
  if (letterOrder !== undefined) return { group: 1, order: letterOrder };

  const numeric = value.match(/\d+(?:\.\d+)?/);
  if (numeric) return { group: 0, order: Number(numeric[0]) };

  return { group: 2, order: Number.MAX_SAFE_INTEGER };
}

export function compareSizes(a: string, b: string) {
  const aParts = sizeSortParts(a);
  const bParts = sizeSortParts(b);

  if (aParts.group !== bParts.group) return aParts.group - bParts.group;
  if (aParts.order !== bParts.order) return aParts.order - bParts.order;

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function getFacets(products: Product[]) {
  const brands = uniqueSorted(products.map((p) => p.brand));
  const sizes = uniqueValues(products.map((p) => p.size), normaliseSizeKey).sort(compareSizes);
  const conditions = uniqueSorted(products.map((p) => p.condition));
  const colours = uniqueSorted(products.flatMap((p) => splitColourValues(p.colour)));
  const prices = products.map((p) => p.price);
  const minPrice = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const maxPrice = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  return { brands, sizes, conditions, colours, minPrice, maxPrice };
}

export function filterProducts(
  products: Product[],
  filters: CatalogFilters = {},
  sort: SortKey = "newest"
): Product[] {
  let result = products;

  if (filters.onlyAvailable) {
    result = result.filter((p) => p.status === "AVAILABLE" || p.status === "RESERVED");
  }

  if (filters.category === "new-in") {
    result = result.filter((p) => isRecent(p.listedAt, 30));
  } else if (filters.category === "sale") {
    result = result.filter((p) => Boolean(p.compareAtPrice));
  } else if (filters.category) {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters.brands?.length) {
    const selected = new Set(filters.brands.map(normaliseFacetKey));
    result = result.filter((p) => selected.has(normaliseFacetKey(p.brand)));
  }
  if (filters.sizes?.length) {
    const selected = new Set(filters.sizes.map(normaliseSizeKey));
    result = result.filter((p) => selected.has(normaliseSizeKey(p.size)));
  }
  if (filters.conditions?.length) {
    result = result.filter((p) => filters.conditions!.includes(p.condition));
  }
  if (filters.colours?.length) {
    const selected = new Set(filters.colours.map(normaliseFacetKey));
    result = result.filter((p) =>
      splitColourValues(p.colour).some((colour) => selected.has(normaliseFacetKey(colour)))
    );
  }
  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter((p) =>
      [p.name, p.brand, p.category, p.description, p.sku, ...p.tags]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  switch (sort) {
    case "price-asc":
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    default:
      result = [...result].sort(
        (a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
      );
  }

  return result;
}

export function getNewIn(products: Product[], limit = 8) {
  return filterProducts(products, { onlyAvailable: true }, "newest").slice(0, limit);
}

export function getPicks(products: Product[], limit = 8) {
  return products
    .filter((p) => p.isPick && p.status === "AVAILABLE")
    .sort(
      (a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
    )
    .slice(0, limit);
}

export function getRecentlySold(products: Product[], limit = 6) {
  return products
    .filter((p) => p.status === "SOLD" && p.soldAt)
    .sort((a, b) => new Date(b.soldAt!).getTime() - new Date(a.soldAt!).getTime())
    .slice(0, limit);
}

export async function getSimilar(product: Product, limit = 4) {
  const products = await listProducts();
  return products
    .filter(
      (p) =>
        p.sku !== product.sku &&
        p.status === "AVAILABLE" &&
        (p.category === product.category || p.brand === product.brand)
    )
    .sort(
      (a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
    )
    .slice(0, limit);
}

export function getBrands(products: Product[]) {
  return uniqueSorted(products.map((p) => p.brand));
}

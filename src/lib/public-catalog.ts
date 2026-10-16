import type { Product } from "@/lib/types";

/** Public-facing inventory status contract shared by shop, search and product APIs. */
export const PUBLIC_PRODUCT_STATUSES = new Set<Product["status"]>([
  "AVAILABLE", "RESERVED", "SOLD",
]);
export function isPublicProduct(product: Pick<Product,"status">): boolean {
  return PUBLIC_PRODUCT_STATUSES.has(product.status);
}
export function isPurchasableProduct(product: Pick<Product,"status">): boolean {
  return product.status === "AVAILABLE";
}
export function parsePriceFilter(raw:string|undefined):number|undefined {
  if (!raw?.trim()) return undefined;
  const value=Number(raw);
  return Number.isFinite(value)&&value>=0?value:undefined;
}

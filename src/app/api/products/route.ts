import type { NextRequest } from "next/server";
import { listProducts } from "@/lib/server/store";

const PUBLIC_STATUSES = new Set(["AVAILABLE", "RESERVED", "SOLD"]);

export async function GET(request: NextRequest) {
  const skus = (request.nextUrl.searchParams.get("skus") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const allPublicProducts = (await listProducts()).filter((p) =>
    PUBLIC_STATUSES.has(p.status)
  );

  const products = skus.length
    ? allPublicProducts.filter((p) => skus.includes(p.sku))
    : allPublicProducts;

  return Response.json({
    products: products.map((p) => ({
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category,
      size: p.size,
      colour: p.colour,
      condition: p.condition,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      status: p.status,
      listedAt: p.listedAt,
      isPick: p.isPick,
    })),
  });
}

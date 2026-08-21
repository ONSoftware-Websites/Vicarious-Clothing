import type { NextRequest } from "next/server";
import { listProducts } from "@/lib/server/store";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const products = await (await listProducts()).filter((p) => p.status !== "DRAFT");

  if (!q) {
    return Response.json({ results: [] });
  }

  const results = products
    .filter((p) =>
      [p.name, p.brand, p.category, p.description, p.sku, ...p.tags]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
    .slice(0, 8)
    .map((p) => ({
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: p.price,
      condition: p.condition,
      image: p.images[0]?.src ?? "",
      status: p.status,
    }));

  return Response.json({ results });
}

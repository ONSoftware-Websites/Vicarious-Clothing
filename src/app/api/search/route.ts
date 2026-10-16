import type { NextRequest } from "next/server";
import { isPublicProduct } from "@/lib/public-catalog";
import { listProducts } from "@/lib/server/store";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase().slice(0,100);
  const products = (await listProducts()).filter(isPublicProduct);

  if (!q) {
    return Response.json({ results: [] });
  }

  const terms=q.split(/\s+/).filter(Boolean);
  const results = products
    .map(p=>({p,score:terms.reduce((score,term)=>score+(p.sku.toLowerCase()===term?20:0)+(p.name.toLowerCase().includes(term)?8:0)+(p.brand.toLowerCase().includes(term)?6:0)+(p.category.toLowerCase().includes(term)?4:0)+(p.tags.join(" ").toLowerCase().includes(term)?3:0)+(p.description.toLowerCase().includes(term)?1:0),0)}))
    .filter(({p})=>terms.every(term=>[p.name,p.brand,p.category,p.description,p.sku,...p.tags].some(field=>field.toLowerCase().includes(term))))
    .sort((a,b)=>b.score-a.score)
    .slice(0, 8)
    .map(({p})=>p)
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

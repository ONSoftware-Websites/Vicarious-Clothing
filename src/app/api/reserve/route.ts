import type { NextRequest } from "next/server";
import { getProductBySku } from "@/lib/server/store";

function normalizeSkus(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((sku) => String(sku).trim().toUpperCase()).filter(Boolean))];
}

// This endpoint is now an availability check only. The actual stock claim is
// performed atomically when checkout creates the pending order, which prevents
// one customer's passive bag/checkout session from owning stock without an order.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { skus?: unknown };
    const skus = normalizeSkus(body.skus);
    if (skus.length === 0) {
      return Response.json({ error: "No items" }, { status: 400 });
    }

    const ok: string[] = [];
    const gone: string[] = [];
    for (const sku of skus) {
      const product = await getProductBySku(sku);
      if (product?.status === "AVAILABLE") ok.push(sku);
      else gone.push(sku);
    }

    return Response.json({ ok, gone });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

// Kept for compatibility with the current checkout page cleanup. There is no
// pre-order reservation to release anymore, so this is intentionally a no-op.
export async function DELETE() {
  return Response.json({ ok: true });
}

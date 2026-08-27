import type { NextRequest } from "next/server";
import type { Product } from "@/lib/types";
import { getProductBySku } from "@/lib/server/store";

function normalizeSkus(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((sku) => String(sku).trim().toUpperCase()).filter(Boolean))];
}

function isAvailableForCheckout(product: Product | undefined) {
  if (!product) return false;

  // This endpoint is only used for a soft customer-facing warning in checkout.
  // The real stock claim happens in /api/checkout. Treat RESERVED as not-gone
  // here because stale/manual reserved states were showing a false warning even
  // when checkout could still complete correctly.
  return product.status === "AVAILABLE" || product.status === "RESERVED";
}

// Availability check only. The actual stock claim is performed atomically when
// checkout creates the pending order.
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
      if (isAvailableForCheckout(product)) ok.push(sku);
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

import type { NextRequest } from "next/server";
import { readCheckoutHoldToken } from "@/lib/server/checkout-hold";
import { releaseCheckoutStock } from "@/lib/server/checkout-stock";

function normalizeSkus(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((sku) => String(sku).trim().toUpperCase()).filter(Boolean))];
}

async function release(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { skus?: unknown };
    const skus = normalizeSkus(body.skus);
    const holdToken = await readCheckoutHoldToken();

    if (!holdToken || skus.length === 0) {
      return Response.json({ ok: true, released: [] });
    }

    const result = await releaseCheckoutStock(skus, { holdToken });
    return Response.json({ ok: true, released: result.released });
  } catch (error) {
    console.error("Checkout hold release failed:", error);
    return Response.json({ error: "Could not release checkout hold" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return release(request);
}

export async function DELETE(request: NextRequest) {
  return release(request);
}

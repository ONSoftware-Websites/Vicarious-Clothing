import { getSupabase } from "@/lib/server/supabase";
import type { NextRequest } from "next/server";
import { enforcePublicRateLimit } from "@/lib/server/public-rate-limit";
import {
  getOrCreateCheckoutHoldToken,
  readCheckoutHoldToken,
  refreshCheckoutHoldToken,
} from "@/lib/server/checkout-hold";
import { claimCheckoutStock, releaseCheckoutStock } from "@/lib/server/checkout-stock";

function normalizeSkus(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((sku) => String(sku).trim().toUpperCase()).filter(Boolean))];
}

function bodyHoldToken(body: Record<string, unknown>) {
  return body.checkoutHoldToken ?? body.holdToken;
}

// Entering checkout now creates a real checkout hold for this browser session.
// The token is returned to the client as well as stored in a cookie so the next
// checkout call can prove it owns the same hold even if the cookie is delayed.
export async function POST(request: NextRequest) {
  const limited = await enforcePublicRateLimit(request, "reserve");
  if (limited) return limited;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const skus = normalizeSkus(body.skus);
    if (skus.length === 0) {
      return Response.json({ error: "No items" }, { status: 400 });
    }

    const holdToken = await getOrCreateCheckoutHoldToken(bodyHoldToken(body));
    await refreshCheckoutHoldToken(holdToken);

    const claim = await claimCheckoutStock(skus, { holdToken });
    if (claim.gone.length && claim.ok.length) {
      await releaseCheckoutStock(claim.ok, { holdToken });
    }

    // Expiry is server-issued and is never derived from the browser clock.
    let expiresAt: string | null = null;
    if (!claim.gone.length) {
      const db = getSupabase();
      if (db) {
        const { data: rows } = await db.from("inventory_items")
          .select("checkout_hold_started_at,checkout_hold_order_id")
          .eq("checkout_hold_token", holdToken).in("sku", skus);
        if (rows?.length === skus.length) {
          const linked = rows.some(row => Boolean(row.checkout_hold_order_id));
          const start = Math.min(...rows.map(row => Date.parse(row.checkout_hold_started_at ?? "")));
          if (Number.isFinite(start)) expiresAt = new Date(start + (linked ? 45 : 30) * 60_000).toISOString();
        }
      }
    }

    return Response.json({
      expiresAt,
      ok: claim.gone.length ? [] : claim.ok,
      gone: claim.gone,
      held: claim.gone.length === 0,
      holdToken,
    });
  } catch (error) {
    console.error("Checkout hold failed:", error);
    return Response.json({ error: "Could not hold checkout stock" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const skus = normalizeSkus(body.skus);
    const holdToken = await readCheckoutHoldToken(bodyHoldToken(body));
    if (holdToken && skus.length) {
      await releaseCheckoutStock(skus, { holdToken });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

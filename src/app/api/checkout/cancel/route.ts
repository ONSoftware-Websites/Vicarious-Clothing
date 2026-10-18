import { canSafelyCancelCheckoutIntent } from "@/lib/server/checkout-payment-state";
import type { NextRequest } from "next/server";
import { getOrder } from "@/lib/server/store";
import { getSupabase } from "@/lib/server/supabase";
import { getStripe } from "@/lib/server/payments";
import { readCheckoutHoldToken, clearCheckoutHoldToken } from "@/lib/server/checkout-hold";

function bodyHoldToken(body: Record<string, unknown>) {
  return body.checkoutHoldToken ?? body.holdToken;
}

// Cancel unpaid payment attempts, not confirmed customer orders.
// Stripe must be safely cancelled before the database releases one-of-one stock.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const orderId = String(body.orderId ?? "").trim().toUpperCase();
    if (!orderId) return Response.json({ ok: true, discarded: false });
    const token = await readCheckoutHoldToken(bodyHoldToken(body));
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const db = getSupabase();
    if (!db) return Response.json({ error: "Checkout storage unavailable" }, { status: 503 });
    const { data: ownership, error: ownerError } = await db.from("inventory_items")
      .select("sku").eq("checkout_hold_order_id", orderId).eq("checkout_hold_token", token).limit(1);
    if (ownerError || !ownership?.length) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const order = await getOrder(orderId);
    if (!order || order.status !== "PENDING_PAYMENT") {
      return Response.json({ ok: false, discarded: false, error: "Checkout is already finalised" }, { status: 409 });
    }
    if (order.paymentIntentId) {
      const stripe = getStripe();
      if (!stripe) return Response.json({ error: "Payment service unavailable" }, { status: 503 });
      const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
      if (intent.status !== "canceled") {
        if (!canSafelyCancelCheckoutIntent(intent.status)) {
          return Response.json({ error: "Payment is processing; checkout cannot be discarded yet" }, { status: 409 });
        }
        await stripe.paymentIntents.cancel(intent.id);
      }
    }
    const { data: discarded, error } = await db.rpc("discard_unpaid_checkout", {
      p_order_id: orderId, p_hold_token: token
    });
    if (error) throw error;
    if (!discarded) return Response.json({ error: "Checkout changed; refresh before retrying" }, { status: 409 });
    await clearCheckoutHoldToken();
    return Response.json({ ok: true, discarded: true });
  } catch (error) {
    console.error("Discard unpaid checkout failed:", error);
    return Response.json({ error: "Could not safely cancel the checkout" }, { status: 503 });
  }
}

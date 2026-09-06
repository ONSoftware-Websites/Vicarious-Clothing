import type { NextRequest } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/server/store";
import { releaseCheckoutStock } from "@/lib/server/checkout-stock";
import {
  clearCheckoutHoldToken,
  readCheckoutHoldToken,
} from "@/lib/server/checkout-hold";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = String(body.orderId ?? "").trim().toUpperCase();

    // Checkout cancellation must be tied to this browser's checkout hold. Email
    // only cancellation is intentionally ignored because it would let one buyer
    // disrupt another buyer's checkout.
    if (!orderId) return Response.json({ ok: true, cancelled: false });

    const order = await getOrder(orderId);
    if (!order || order.status !== "PENDING_PAYMENT") {
      return Response.json({ ok: true, cancelled: false });
    }

    const holdToken = await readCheckoutHoldToken();
    if (!holdToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skus = [...new Set(order.items.map((item) => item.sku))];
    const release = await releaseCheckoutStock(skus, {
      holdToken,
      orderId: order.id,
    });

    if (release.released.length !== skus.length) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await updateOrderStatus(order.id, "CANCELLED", "checkout-cancel");
    await clearCheckoutHoldToken();
    return Response.json({ ok: true, cancelled: true, released: release.released });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

import type { NextRequest } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/server/store";
import { releaseCheckoutStock } from "@/lib/server/checkout-stock";
import { verifyOrderAccessToken } from "@/lib/server/order-access";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = String(body.orderId ?? "").trim().toUpperCase();
    const token = String(body.token ?? "").trim();

    // Older clients sent only an email. That is intentionally ignored because
    // email-only cancellation lets one customer disrupt another customer's
    // pending checkout.
    if (!orderId) return Response.json({ ok: true, cancelled: false });

    const order = await getOrder(orderId);
    if (!order || order.status !== "PENDING_PAYMENT") {
      return Response.json({ ok: true, cancelled: false });
    }

    if (!verifyOrderAccessToken(order.id, order.email, token)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await updateOrderStatus(order.id, "CANCELLED", "checkout-cancel");
    await releaseCheckoutStock(order.items.map((item) => item.sku));
    return Response.json({ ok: true, cancelled: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

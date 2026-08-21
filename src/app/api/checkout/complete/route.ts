import type { NextRequest } from "next/server";
import { getOrder, markOrderPaid, setOrderPayment } from "@/lib/server/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    const paymentIntentId =
      typeof body.paymentIntentId === "string"
        ? body.paymentIntentId.trim()
        : "";

    if (!orderId) {
      return Response.json({ error: "Missing orderId" }, { status: 400 });
    }

    const existing = await getOrder(orderId);
    if (!existing) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (paymentIntentId) {
      await setOrderPayment(orderId, paymentIntentId);
    }

    const order = await markOrderPaid(orderId);
    return Response.json({ order: order ?? existing });
  } catch (err) {
    console.error("Finalize checkout error:", err);
    return Response.json(
      { error: "Could not finish checkout" },
      { status: 500 }
    );
  }
}

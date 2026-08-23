import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/server/payments";
import { getOrder, markOrderPaid, setOrderPayment } from "@/lib/server/store";
import { sendEmail } from "@/lib/server/mailer";

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
    if (!paymentIntentId) {
      return Response.json({ error: "Missing paymentIntentId" }, { status: 400 });
    }

    const existing = await getOrder(orderId);
    if (!existing) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return Response.json({ error: "Stripe is not configured" }, { status: 400 });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded" || intent.metadata?.orderId !== orderId) {
      return Response.json({ error: "Payment has not been confirmed" }, { status: 409 });
    }
    if (Math.round(existing.total * 100) !== intent.amount) {
      return Response.json({ error: "Payment amount does not match order total" }, { status: 409 });
    }

    const wasAlreadyPaid = existing.status === "PAID";
    await setOrderPayment(orderId, intent.id);
    const order = await markOrderPaid(orderId);
    if (order && !wasAlreadyPaid) {
      // Idempotency: check email_log so webhook + complete don't both send
      const { listEmails } = await import("@/lib/server/store");
      const recent = await listEmails(50);
      const alreadySent = recent.some((e) => e.template === "order-confirmed" && e.preview.includes(order.id));
      if (!alreadySent) {
        try {
          console.log("Sending order-confirmed email (checkout complete)", { orderId: order.id, to: order.email });
          await sendEmail({ to: order.email, template: "order-confirmed", data: { order } });
          console.log("Sent order-confirmed email", { orderId: order.id });
        } catch (err) {
          console.error("Failed to send order-confirmed email (checkout complete):", err, { orderId: order.id, to: order.email });
        }
      }
    }
    return Response.json({ order: order ?? existing });
  } catch (err) {
    console.error("Finalize checkout error:", err);
    return Response.json(
      { error: "Could not finish checkout" },
      { status: 500 }
    );
  }
}

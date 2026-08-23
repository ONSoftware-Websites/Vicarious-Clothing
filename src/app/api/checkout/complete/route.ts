import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/server/payments";
import {
  getOrder,
  markOrderPaid,
  setOrderPayment,
  updateOrderStatus,
} from "@/lib/server/store";
import { recordDiscountUsageOnce } from "@/lib/server/checkout-ledger";
import { checkoutExpired } from "@/lib/server/checkout-expiry";
import { releaseCheckoutStock } from "@/lib/server/checkout-stock";
import { sendEmail } from "@/lib/server/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    const paymentIntentId =
      typeof body.paymentIntentId === "string" ? body.paymentIntentId.trim() : "";

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
      return Response.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded" || intent.metadata?.orderId !== orderId) {
      return Response.json({ error: "Payment has not been confirmed" }, { status: 409 });
    }
    if (Math.round(existing.total * 100) !== intent.amount) {
      return Response.json({ error: "Payment amount does not match order total" }, { status: 409 });
    }

    // A stale PaymentIntent can still technically succeed after its one-of-one
    // stock reservation has expired. Never resurrect an expired/cancelled order:
    // refund the captured payment and keep the stock available for the valid buyer.
    if (existing.status === "CANCELLED" || checkoutExpired(existing)) {
      if (existing.status !== "CANCELLED") {
        await updateOrderStatus(existing.id, "CANCELLED", "checkout-expiry");
        await releaseCheckoutStock(existing.items.map((item) => item.sku));
      }
      await stripe.refunds.create(
        { payment_intent: intent.id },
        { idempotencyKey: `expired-checkout-refund-${existing.id}` }
      );
      return Response.json(
        {
          error:
            "This checkout expired before payment completed. The payment has been refunded automatically.",
          refunded: true,
        },
        { status: 409 }
      );
    }

    if (existing.status !== "PENDING_PAYMENT" && existing.status !== "PAID") {
      return Response.json({ error: "This order can no longer accept payment" }, { status: 409 });
    }

    const wasAlreadyPaid = existing.status === "PAID";
    await setOrderPayment(orderId, intent.id);
    const order = await markOrderPaid(orderId);
    let emailSent = wasAlreadyPaid;

    if (order) {
      await recordDiscountUsageOnce(order.discount?.code, order.email);
      if (!wasAlreadyPaid) {
        try {
          await sendEmail({
            to: order.email,
            template: "order-confirmed",
            data: { order },
          });
          emailSent = true;
        } catch (emailError) {
          // Payment finalisation must not be rolled back by a mail-provider issue.
          // The Stripe webhook will also retry confirmation email delivery.
          console.error("Order confirmation email failed after payment:", emailError);
          emailSent = false;
        }
      }
    }

    return Response.json({ order: order ?? existing, emailSent });
  } catch (error) {
    console.error("Checkout completion failed:", error);
    return Response.json({ error: "Could not confirm payment" }, { status: 500 });
  }
}

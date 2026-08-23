import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, getWebhookSecret } from "@/lib/server/payments";
import {
  cancelPendingOrdersForEmail,
  getOrder,
  listEmails,
  markOrderPaid,
  setOrderPayment,
} from "@/lib/server/store";
import { recordDiscountUsageOnce } from "@/lib/server/checkout-ledger";
import { sendEmail } from "@/lib/server/mailer";

async function sendConfirmationOnce(order: NonNullable<Awaited<ReturnType<typeof getOrder>>>) {
  const recent = await listEmails(100);
  const alreadySent = recent.some(
    (e) =>
      e.template === "order-confirmed" &&
      e.to.toLowerCase() === order.email.toLowerCase() &&
      (e.subject.includes(order.id) || e.preview.includes(order.id))
  );
  if (!alreadySent) {
    await sendEmail({ to: order.email, template: "order-confirmed", data: { order } });
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const secret = getWebhookSecret();
  if (!signature || !secret) {
    return Response.json({ error: "Missing signature or webhook secret" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature error:", error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (!orderId) break;

        const existing = await getOrder(orderId);
        if (!existing) throw new Error(`Order ${orderId} was not found`);
        if (Math.round(existing.total * 100) !== intent.amount) {
          throw new Error(`Stripe amount mismatch for ${orderId}`);
        }

        await setOrderPayment(orderId, intent.id);
        const order = await markOrderPaid(orderId);
        if (order) {
          await recordDiscountUsageOnce(order.discount?.code, order.email);
          if (existing.status === "PENDING_PAYMENT") await sendConfirmationOnce(order);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (!orderId) break;
        const order = await getOrder(orderId);
        if (order?.status === "PENDING_PAYMENT") {
          await cancelPendingOrdersForEmail(order.email);
        }
        break;
      }

      // Retained for compatibility if hosted Checkout is introduced later.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (!orderId) break;

        const existing = await getOrder(orderId);
        if (!existing) throw new Error(`Order ${orderId} was not found`);
        if (typeof session.payment_intent === "string") {
          await setOrderPayment(orderId, session.payment_intent);
        }
        const order = await markOrderPaid(orderId);
        if (order) {
          await recordDiscountUsageOnce(order.discount?.code, order.email);
          if (existing.status === "PENDING_PAYMENT") await sendConfirmationOnce(order);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (!orderId) break;
        const order = await getOrder(orderId);
        if (order?.status === "PENDING_PAYMENT") {
          await cancelPendingOrdersForEmail(order.email);
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook ${event.type} failed:`, error);
    // Non-2xx causes Stripe to retry transient failures rather than silently losing them.
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}

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
import { sendEmail } from "@/lib/server/mailer";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  const secret = getWebhookSecret();
  if (!signature || !secret) {
    return Response.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (!orderId) break;

      const existing = await getOrder(orderId);
      await setOrderPayment(orderId, intent.id);

      const order = await markOrderPaid(orderId);
      if (order && existing?.status === "PENDING_PAYMENT") {
        const recent = await listEmails(50);
        const alreadySent = recent.some((e) => e.template === "order-confirmed" && e.preview.includes(order.id));
        console.log("webhook payment_intent.succeeded", { orderId, alreadySent, recentCount: recent.length });
        if (!alreadySent) {
          try {
            console.log("Sending order-confirmed email (webhook)", { orderId: order.id, to: order.email });
            await sendEmail({
              to: order.email,
              template: "order-confirmed",
              data: { order },
            });
            console.log("Sent order-confirmed email (webhook)", { orderId: order.id });
          } catch (err) {
            console.error("Failed to send order-confirmed email (webhook):", err, { orderId: order.id, to: order.email });
          }
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (!orderId) break;
      const order = await getOrder(orderId);
      if (order && order.status === "PENDING_PAYMENT") {
        await cancelPendingOrdersForEmail(order.email);
      }
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId ?? session.client_reference_id;
      if (!orderId) break;

      if (typeof session.payment_intent === "string") {
        await setOrderPayment(orderId, session.payment_intent);
      }

      const existing = await getOrder(orderId);
      const order = await markOrderPaid(orderId);
      if (order && existing?.status === "PENDING_PAYMENT") {
        const recent = await listEmails(50);
        const alreadySent = recent.some((e) => e.template === "order-confirmed" && e.preview.includes(order.id));
        console.log("webhook checkout.session.completed", { orderId, alreadySent, recentCount: recent.length });
        if (!alreadySent) {
          try {
            console.log("Sending order-confirmed email (webhook checkout.session.completed)", { orderId: order.id, to: order.email });
            await sendEmail({
              to: order.email,
              template: "order-confirmed",
              data: { order },
            });
            console.log("Sent order-confirmed email (webhook checkout.session.completed)", { orderId: order.id });
          } catch (err) {
            console.error("Failed to send order-confirmed email (webhook checkout.session.completed):", err, { orderId: order.id, to: order.email });
          }
        }
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId ?? session.client_reference_id;
      if (!orderId) break;
      const order = await getOrder(orderId);
      if (order && order.status === "PENDING_PAYMENT") {
        await cancelPendingOrdersForEmail(order.email);
      }
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}

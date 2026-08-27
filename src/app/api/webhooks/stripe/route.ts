import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, getWebhookSecret } from "@/lib/server/payments";
import {
  getOrder,
  listEmails,
  markOrderPaid,
  setOrderPayment,
  updateOrderStatus,
} from "@/lib/server/store";
import { recordDiscountUsageOnce } from "@/lib/server/checkout-ledger";
import { checkoutExpired } from "@/lib/server/checkout-expiry";
import { releaseCheckoutStock } from "@/lib/server/checkout-stock";
import { sendEmail } from "@/lib/server/mailer";
import { sendAdminOrderAlertOnce } from "@/lib/server/order-alerts";
import { syncOrderSaleToSellerHq } from "@/lib/server/sellerhq-sync";

async function sendConfirmationOnce(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>
) {
  const recent = await listEmails(100);
  const alreadySent = recent.some(
    (entry) =>
      entry.template === "order-confirmed" &&
      entry.to.toLowerCase() === order.email.toLowerCase() &&
      (entry.subject.includes(order.id) || entry.preview.includes(order.id))
  );
  if (!alreadySent) {
    await sendEmail({
      to: order.email,
      template: "order-confirmed",
      data: { order },
    });
  }
}

async function sendConfirmationOnceSafely(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>
) {
  try {
    await sendConfirmationOnce(order);
  } catch (error) {
    // Henry's internal order alert and inventory sync must still run even if the
    // customer confirmation email provider has a transient problem.
    console.error("Order confirmation email failed:", error);
  }
}

async function sendAdminOrderAlertSafely(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>
) {
  try {
    await sendAdminOrderAlertOnce(order);
  } catch (error) {
    // Payment capture must not be rolled back because Henry's alert email failed.
    console.error("Admin paid-order alert failed:", error);
  }
}

async function syncOrderSaleToSellerHqSafely(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>
) {
  try {
    const result = await syncOrderSaleToSellerHq(order);
    if (!result.ok && !result.skipped) {
      console.error("SellerHQ paid-order sync failed:", result.error ?? result.data);
    }
  } catch (error) {
    // Stripe webhook processing should not retry forever just because the
    // inventory-management app is temporarily unreachable.
    console.error("SellerHQ paid-order sync failed:", error);
  }
}

async function recoverPaidOrderSideEffects(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>
) {
  if (order.status !== "PAID") return;
  await sendAdminOrderAlertSafely(order);
  await syncOrderSaleToSellerHqSafely(order);
}

async function cancelPendingOrder(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>,
  actor: string
) {
  if (order.status !== "PENDING_PAYMENT") return;
  await updateOrderStatus(order.id, "CANCELLED", actor);
  await releaseCheckoutStock(order.items.map((item) => item.sku));
}

async function refundExpiredPayment(
  stripe: Stripe,
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>,
  paymentIntentId: string
) {
  await stripe.refunds.create(
    { payment_intent: paymentIntentId },
    { idempotencyKey: `expired-checkout-refund-${order.id}` }
  );
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

        if (existing.status === "CANCELLED") {
          await refundExpiredPayment(stripe, existing, intent.id);
          break;
        }

        if (existing.status !== "PENDING_PAYMENT") {
          // Stripe retries are normal. Never regress PICKING/DISPATCHED/etc. back
          // to PAID just because the original payment event is delivered again.
          await setOrderPayment(orderId, intent.id);
          await recoverPaidOrderSideEffects(existing);
          break;
        }

        if (checkoutExpired(existing)) {
          await cancelPendingOrder(existing, "checkout-expiry");
          await refundExpiredPayment(stripe, existing, intent.id);
          break;
        }

        await setOrderPayment(orderId, intent.id);
        const order = await markOrderPaid(orderId);
        if (order) {
          await recordDiscountUsageOnce(order.discount?.code, order.email);
          await sendConfirmationOnceSafely(order);
          await sendAdminOrderAlertSafely(order);
          await syncOrderSaleToSellerHqSafely(order);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (!orderId) break;
        const order = await getOrder(orderId);
        if (order) await cancelPendingOrder(order, "stripe-payment-failed");
        break;
      }

      // Retained for compatibility if hosted Checkout is introduced later.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (!orderId) break;

        const existing = await getOrder(orderId);
        if (!existing) throw new Error(`Order ${orderId} was not found`);
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : undefined;

        if (existing.status === "CANCELLED") {
          if (paymentIntentId) {
            await refundExpiredPayment(stripe, existing, paymentIntentId);
          }
          break;
        }

        if (existing.status !== "PENDING_PAYMENT") {
          if (paymentIntentId) await setOrderPayment(orderId, paymentIntentId);
          await recoverPaidOrderSideEffects(existing);
          break;
        }

        if (checkoutExpired(existing)) {
          await cancelPendingOrder(existing, "checkout-expiry");
          if (paymentIntentId) {
            await refundExpiredPayment(stripe, existing, paymentIntentId);
          }
          break;
        }

        if (paymentIntentId) await setOrderPayment(orderId, paymentIntentId);
        const order = await markOrderPaid(orderId);
        if (order) {
          await recordDiscountUsageOnce(order.discount?.code, order.email);
          await sendConfirmationOnceSafely(order);
          await sendAdminOrderAlertSafely(order);
          await syncOrderSaleToSellerHqSafely(order);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (!orderId) break;
        const order = await getOrder(orderId);
        if (order) await cancelPendingOrder(order, "stripe-session-expired");
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

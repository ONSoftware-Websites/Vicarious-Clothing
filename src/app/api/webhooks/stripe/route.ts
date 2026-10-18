import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, getWebhookSecret } from "@/lib/server/payments";
import { getSupabase } from "@/lib/server/supabase";
import { paymentIntentMatchesOrder } from "@/lib/server/stripe-payment-validation";
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
  await releaseCheckoutStock(order.items.map((item) => item.sku), {
    orderId: order.id,
  });
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

  // Durable event claim: concurrent Stripe retries must not process the same event twice.
  const db = getSupabase();
  if (!db) return Response.json({ error: "Event ledger unavailable" }, { status: 503 });
  const {error:claimError} = await db.from("stripe_webhook_events").insert({
    event_id:event.id,event_type:event.type,status:"processing"
  });
  if (claimError) {
    if (claimError.code !== "23505")
      return Response.json({ error:"Cannot record Stripe event" }, {status:503});
    const {data:prior,error:lookupError} = await db.from("stripe_webhook_events")
      .select("status,claimed_at").eq("event_id",event.id).maybeSingle();
    if (lookupError || !prior) return Response.json({error:"Event state unavailable"},{status:503});
    if (prior.status === "completed") return Response.json({received:true,duplicate:true});
    const cutoff = new Date(Date.now()-3*60*1000).toISOString();
    const {data:reclaimed,error:reclaimError} = await db.from("stripe_webhook_events")
      .update({claimed_at:new Date().toISOString()}).eq("event_id",event.id)
      .eq("status","processing").lt("claimed_at",cutoff).select("event_id").maybeSingle();
    if (reclaimError || !reclaimed) return Response.json({error:"Event is already processing"},{status:503});
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (!orderId) break;

        const existing = await getOrder(orderId);
        if (!existing) throw new Error(`Order ${orderId} was not found`);
        if (!paymentIntentMatchesOrder(intent,existing)) {
          throw new Error(`Stripe payment mismatch for ${orderId}`);
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

        await setOrderPayment(orderId, intent.id);
        const order = await markOrderPaid(orderId);
        if (!order || order.status !== "PAID") throw new Error(`Order ${orderId} payment transition was not completed`);
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
        // A declined card is not a cancelled order. Stripe PaymentIntents
        // generally remain retryable after a failed attempt. Leave the
        // reservation intact until the customer cancels or expiry reconciles it.
        const order = await getOrder(orderId);
        if (order?.status === "PENDING_PAYMENT") {
          console.info("Retryable checkout payment failure", { orderId });
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
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : undefined;

        // Hosted checkout events must not mark unpaid or mismatched sessions as paid.
        if (session.payment_status !== "paid" || !paymentIntentId) {
          throw new Error(`Checkout session not paid for ${orderId}`);
        }
        const sessionIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (!paymentIntentMatchesOrder(sessionIntent,existing)) {
          throw new Error(`Hosted checkout payment mismatch for ${orderId}`);
        }
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

        if (paymentIntentId) await setOrderPayment(orderId, paymentIntentId);
        const order = await markOrderPaid(orderId);
        if (!order || order.status !== "PAID") throw new Error(`Order ${orderId} payment transition was not completed`);
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
    await db.from("stripe_webhook_events").delete().eq("event_id",event.id).eq("status","processing");
    // Non-2xx causes Stripe to retry transient failures rather than silently losing them.
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  const {error:doneError} = await db.from("stripe_webhook_events").update({status:"completed",completed_at:new Date().toISOString()}).eq("event_id",event.id);
  if (doneError) return Response.json({error:"Unable to complete Stripe event ledger"},{status:503});
  return Response.json({ received: true });
}

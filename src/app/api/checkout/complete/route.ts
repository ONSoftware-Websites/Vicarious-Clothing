import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/server/payments";
import { paymentIntentMatchesOrder } from "@/lib/server/stripe-payment-validation";
import {
  getOrder,
  markOrderPaid,
  setOrderPayment,
} from "@/lib/server/store";
import { recordDiscountUsageOnce } from "@/lib/server/checkout-ledger";
import { clearCheckoutHoldToken } from "@/lib/server/checkout-hold";
import { sendEmail } from "@/lib/server/mailer";
import { sendAdminOrderAlertOnce } from "@/lib/server/order-alerts";
import { syncOrderSaleToSellerHq } from "@/lib/server/sellerhq-sync";

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
    if (!paymentIntentMatchesOrder(intent, existing)) {
      return Response.json({ error: "Payment details do not match this order" }, { status: 409 });
    }

    // A successful Stripe payment is authoritative. Complete it if this
    // order still owns its reserved stock, even when the display window elapsed.
    // The reconciliation worker is the only actor that may expire an unpaid
    // attempt after confirming Stripe is cancelable.
    if (existing.status === "CANCELLED") {
      return Response.json({error:"Order is already cancelled; please contact support"},{status:409});
    }

    if (existing.status !== "PENDING_PAYMENT" && existing.status !== "PAID") {
      return Response.json({ error: "This order can no longer accept payment" }, { status: 409 });
    }

    const wasAlreadyPaid = existing.status === "PAID";
    await setOrderPayment(orderId, intent.id);
    const order = await markOrderPaid(orderId);
    if (!order || order.status !== "PAID") {
      return Response.json({ error: "Payment finalisation is still pending. Please contact support if this persists." }, { status: 409 });
    }
    let emailSent = wasAlreadyPaid;
    let adminAlertSent = false;
    let sellerHqSynced = wasAlreadyPaid;

    if (order) {
      await clearCheckoutHoldToken();
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

      try {
        const alertResult = await sendAdminOrderAlertOnce(order);
        adminAlertSent = alertResult.notified;
      } catch (alertError) {
        // Do not fail customer checkout because an internal alert failed.
        console.error("Admin paid-order alert failed after payment:", alertError);
      }

      if (!wasAlreadyPaid) {
        try {
          const syncResult = await syncOrderSaleToSellerHq(order);
          sellerHqSynced = syncResult.ok || Boolean(syncResult.skipped);
          if (!syncResult.ok && !syncResult.skipped) {
            console.error("SellerHQ paid-order sync failed after payment:", syncResult.error ?? syncResult.data);
          }
        } catch (syncError) {
          console.error("SellerHQ paid-order sync failed after payment:", syncError);
        }
      }
    }

    return Response.json({ order: order ?? existing, emailSent, adminAlertSent, sellerHqSynced });
  } catch (error) {
    console.error("Checkout completion failed:", error);
    return Response.json({ error: "Could not confirm payment" }, { status: 500 });
  }
}

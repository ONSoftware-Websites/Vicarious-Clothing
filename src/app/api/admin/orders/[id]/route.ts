import type { NextRequest } from "next/server";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { adminDeleteOrder } from "@/lib/server/admin-delete";
import { getOrder, setOrderTracking, updateOrderStatus } from "@/lib/server/store";
import { getStripe } from "@/lib/server/payments";
import { sendEmail } from "@/lib/server/mailer";
import { syncOrderSaleToSellerHq } from "@/lib/server/sellerhq-sync";

const ACTOR = "Admin";
const SELLERHQ_ORDER_SYNC_STATUSES: OrderStatus[] = [
  "PAID",
  "PICKING",
  "READY_TO_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
];

async function syncOrderToSellerHqSafely(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>
) {
  if (!SELLERHQ_ORDER_SYNC_STATUSES.includes(order.status)) {
    return { ok: false, skipped: true, error: "Order status is not part of the SellerHQ stock flow" };
  }

  try {
    const result = await syncOrderSaleToSellerHq(order);
    if (!result.ok && !result.skipped) {
      console.error("SellerHQ order status sync failed:", result.error ?? result.data);
    }
    return result;
  } catch (error) {
    console.error("SellerHQ order status sync failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SellerHQ order status sync failed",
    };
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const { id } = await params;
  try {
    const body = await request.json();

    if (body.status) {
      const status = String(body.status).toUpperCase() as OrderStatus;
      if (!ORDER_STATUSES.includes(status)) {
        return Response.json({ error: "Invalid order status" }, { status: 400 });
      }

      let existing = await getOrder(id);
      if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
      if (existing.status === status) {
        return Response.json({ ok: true, order: existing, unchanged: true });
      }

      // If tracking is supplied with dispatch, persist it before sending the email.
      if (status === "DISPATCHED" && (body.carrier || body.tracking)) {
        existing =
          (await setOrderTracking(
            id,
            String(body.carrier ?? existing.carrier ?? ""),
            String(body.tracking ?? existing.tracking ?? ""),
            ACTOR
          )) ?? existing;
      }

      if (status === "DISPATCHED" && (!existing.carrier?.trim() || !existing.tracking?.trim())) {
        return Response.json(
          { error: "Save the carrier and tracking number before marking the order dispatched." },
          { status: 409 }
        );
      }

      let refundAmount: number | undefined;
      let refundReference: string | undefined;
      if (status === "REFUNDED" && existing.paymentProvider === "stripe") {
        if (!existing.paymentIntentId) {
          return Response.json(
            { error: "This Stripe order has no payment intent to refund." },
            { status: 409 }
          );
        }
        const stripe = getStripe();
        if (!stripe) {
          return Response.json({ error: "Stripe is not configured; refund not attempted." }, { status: 503 });
        }

        // Stripe must confirm the refund before local status or customer email changes.
        const refund = await stripe.refunds.create(
          { payment_intent: existing.paymentIntentId },
          { idempotencyKey: `vicarious-refund-${existing.id}` }
        );
        if (refund.status === "failed" || refund.status === "canceled") {
          return Response.json({ error: "Stripe did not accept the refund." }, { status: 502 });
        }
        refundAmount = refund.amount / 100;
        refundReference = refund.id;
      }

      const order = await updateOrderStatus(id, status, ACTOR);
      if (!order) return Response.json({ error: "Not found" }, { status: 404 });

      const emailTemplates: Partial<
        Record<
          OrderStatus,
          "order-dispatched" | "order-delivered" | "order-refunded" | "order-cancelled"
        >
      > = {
        DISPATCHED: "order-dispatched",
        DELIVERED: "order-delivered",
        REFUNDED: "order-refunded",
        CANCELLED: "order-cancelled",
      };
      const template = emailTemplates[status];
      let emailSent = true;
      if (template) {
        try {
          await sendEmail({
            to: order.email,
            template,
            data: {
              order,
              refundAmount,
              refundReference,
              cancellationReason: body.cancellationReason,
              refundInformation: body.refundInformation,
            },
          });
        } catch (emailError) {
          emailSent = false;
          console.error(`Order ${order.id} ${template} email failed:`, emailError);
        }
      }

      const sellerHqResult = await syncOrderToSellerHqSafely(order);

      return Response.json({
        ok: true,
        order,
        refundReference,
        emailSent,
        sellerHqSynced: sellerHqResult.ok || Boolean(sellerHqResult.skipped),
      });
    }

    if (body.carrier || body.tracking) {
      const carrier = String(body.carrier ?? "").trim();
      const tracking = String(body.tracking ?? "").trim();
      if (!carrier || !tracking) {
        return Response.json({ error: "Carrier and tracking number are both required." }, { status: 400 });
      }
      const order = await setOrderTracking(id, carrier, tracking, ACTOR);
      if (!order) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ ok: true, order });
    }

    return Response.json({ error: "Nothing to update" }, { status: 400 });
  } catch (error) {
    console.error("Order update failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Order update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  const { id } = await params;
  try {
    await adminDeleteOrder(id, ACTOR);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Order delete failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Order delete failed" },
      { status: 500 }
    );
  }
}

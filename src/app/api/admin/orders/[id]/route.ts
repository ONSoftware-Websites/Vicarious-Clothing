import type { NextRequest } from "next/server";
import type { OrderStatus } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getOrder, setOrderTracking, updateOrderStatus } from "@/lib/server/store";
import { getStripe } from "@/lib/server/payments";
import { sendEmail } from "@/lib/server/mailer";

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

      if (status === "REFUNDED") {
        const existing = await getOrder(id);
        if (existing && existing.paymentIntentId) {
          const stripe = getStripe();
          if (stripe) {
            try {
              await stripe.refunds.create({
                payment_intent: existing.paymentIntentId,
              });
            } catch (err) {
              console.error("Stripe refund failed:", err);
            }
          }
        }
      }

      const order = await updateOrderStatus(id, status, "Henry");
      if (!order) return Response.json({ error: "Not found" }, { status: 404 });

      const emailTemplates: Partial<Record<OrderStatus, "order-dispatched" | "order-delivered" | "order-refunded" | "order-cancelled">> = {
        DISPATCHED: "order-dispatched",
        DELIVERED: "order-delivered",
        REFUNDED: "order-refunded",
        CANCELLED: "order-cancelled",
      };
      const template = emailTemplates[status];
      if (template) {
        await sendEmail({ to: order.email, template, data: { order } });
      }

      return Response.json({ ok: true, order });
    }

    if (body.carrier || body.tracking) {
      const order = await setOrderTracking(
        id,
        String(body.carrier ?? ""),
        String(body.tracking ?? ""),
        "Henry"
      );
      if (!order) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ ok: true, order });
    }

    return Response.json({ error: "Nothing to update" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

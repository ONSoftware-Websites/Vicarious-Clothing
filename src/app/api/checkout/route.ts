import type { NextRequest } from "next/server";
import type { Order } from "@/lib/types";
import {
  cancelPendingOrdersForEmail,
  createOrder,
  evaluateDiscount,
  getProductBySku,
  setOrderPayment,
} from "@/lib/server/store";
import { getStripe, stripeEnabled } from "@/lib/server/payments";
import { sendEmail } from "@/lib/server/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, items, deliveryCost, address, discountCode } = body;

    if (!email || !name || !Array.isArray(items) || !address) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const skus: string[] = items.map((i: { sku?: unknown }) =>
      String(i.sku).toUpperCase()
    );
    const lineItems = [];
    for (const sku of skus) {
      const product = await getProductBySku(sku);
      if (!product) {
        return Response.json({ error: `Unknown SKU ${sku}` }, { status: 400 });
      }
      lineItems.push({
        sku,
        name: product.name,
        brand: product.brand,
        image: product.images[0]?.src ?? "",
        price: product.price,
      });
    }

    const subtotal = lineItems.reduce((sum, i) => sum + i.price, 0);

    let discount: Order["discount"];
    if (discountCode) {
      const result = await evaluateDiscount(String(discountCode), {
        subtotal,
        email: String(email),
        itemSkus: skus,
      });
      if (!result.ok || !result.discount) {
        return Response.json({ error: result.error }, { status: 400 });
      }
      discount = result.discount;
    }

    const finalDelivery =
      discount?.type === "free_delivery" ? 0 : Number(deliveryCost) || 0;

    const addressData = {
      line1: String(address.line1 ?? ""),
      line2: address.line2 ? String(address.line2) : undefined,
      city: String(address.city ?? ""),
      postcode: String(address.postcode ?? ""),
      country: String(address.country ?? ""),
    };

    const stripe = stripeEnabled() ? getStripe() : null;

    if (!stripe) {
      const orderResult = await createOrder({
        email: String(email),
        name: String(name),
        items: skus.map((sku) => ({ sku })),
        deliveryCost: finalDelivery,
        address: addressData,
        discountCode: discountCode ? String(discountCode) : undefined,
        channel: "website",
        status: "PAID",
        paymentProvider: "demo",
      });

      if (orderResult.gone?.length) {
        return Response.json({ gone: orderResult.gone }, { status: 409 });
      }
      if (!orderResult.order) {
        return Response.json({ error: "Could not create order" }, { status: 500 });
      }

      const order = orderResult.order;
      await sendEmail({
        to: order.email,
        template: "order-confirmed",
        data: { order },
      });
      return Response.json({ order, mode: "demo" }, { status: 201 });
    }

    await cancelPendingOrdersForEmail(String(email));

    const orderResult = await createOrder({
      email: String(email),
      name: String(name),
      items: skus.map((sku) => ({ sku })),
      deliveryCost: finalDelivery,
      address: addressData,
      discountCode: discountCode ? String(discountCode) : undefined,
      channel: "website",
      status: "PENDING_PAYMENT",
      paymentProvider: "stripe",
    });

    if (orderResult.gone?.length) {
      return Response.json({ gone: orderResult.gone }, { status: 409 });
    }
    if (!orderResult.order) {
      return Response.json({ error: "Could not create order" }, { status: 500 });
    }

    const order = orderResult.order;

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      receipt_email: order.email,
      description: `Vicarious Clothing order ${order.id}`,
      metadata: {
        orderId: order.id,
        items: order.items.map((i) => `${i.brand} ${i.name}`).join(", ").slice(0, 450),
      },
    });

    await setOrderPayment(order.id, intent.id);

    return Response.json(
      { order, mode: "stripe", clientSecret: intent.client_secret },
      { status: 201 }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return Response.json({ error: "Checkout failed" }, { status: 500 });
  }
}

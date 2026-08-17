import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import type { Order } from "@/lib/types";
import {
  createOrder,
  evaluateDiscount,
  getProductBySku,
  reserveProducts,
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
      const product = getProductBySku(sku);
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
      const result = evaluateDiscount(String(discountCode), {
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

    const reservation = reserveProducts(skus);
    if (reservation.gone.length) {
      return Response.json({ gone: reservation.gone }, { status: 409 });
    }

    const stripe = stripeEnabled() ? getStripe() : null;

    const orderResult = createOrder({
      email: String(email),
      name: String(name),
      items: skus.map((sku) => ({ sku })),
      deliveryCost: finalDelivery,
      address: addressData,
      discountCode: discountCode ? String(discountCode) : undefined,
      channel: "website",
      status: stripe ? "PENDING_PAYMENT" : "PAID",
      paymentProvider: stripe ? "stripe" : "demo",
    });

    if (orderResult.gone?.length) {
      return Response.json({ gone: orderResult.gone }, { status: 409 });
    }
    if (!orderResult.order) {
      return Response.json({ error: "Could not create order" }, { status: 500 });
    }

    const order = orderResult.order;

    if (!stripe) {
      await sendEmail({
        to: order.email,
        template: "order-confirmed",
        data: { order },
      });
      return Response.json({ order, mode: "demo" }, { status: 201 });
    }

    const origin = request.nextUrl.origin;
    const lineItemsForStripe = lineItems.map((i) => ({
      price_data: {
        currency: "gbp",
        unit_amount: Math.round(i.price * 100),
        product_data: {
          name: `${i.brand} ${i.name}`,
          images: i.image ? [i.image] : [],
        },
      },
      quantity: 1,
    }));

    if (finalDelivery > 0) {
      lineItemsForStripe.push({
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(finalDelivery * 100),
          product_data: { name: "Delivery", images: [] },
        },
        quantity: 1,
      });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItemsForStripe,
      customer_email: order.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      success_url: `${origin}/order/${order.id}?paid=1`,
      cancel_url: `${origin}/checkout?cancelled=1`,
    };

    if (discount && discount.amount > 0) {
      let coupon: Stripe.Coupon;
      if (discount.type === "percentage") {
        const percent = discount.amount > 0 && subtotal > 0 ? Math.min(100, Math.round((discount.amount / subtotal) * 100)) : 0;
        coupon = await stripe.coupons.create({
          percent_off: percent,
          duration: "once",
          name: discount.code,
        });
      } else {
        coupon = await stripe.coupons.create({
          amount_off: Math.round(discount.amount * 100),
          currency: "gbp",
          duration: "once",
          name: discount.code,
        });
      }
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    setOrderPayment(order.id, "", session.url ?? undefined);

    return Response.json({ order, mode: "stripe", url: session.url }, { status: 201 });
  } catch (err) {
    console.error("Checkout error:", err);
    return Response.json({ error: "Checkout failed" }, { status: 500 });
  }
}

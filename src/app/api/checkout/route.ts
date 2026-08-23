import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { Order } from "@/lib/types";
import {
  cancelPendingOrdersForEmail,
  createOrder,
  evaluateDiscount,
  getProductBySku,
  listDiscounts,
  setOrderPayment,
} from "@/lib/server/store";
import { getStripe, stripeEnabled } from "@/lib/server/payments";
import {
  EXPRESS_DELIVERY_COST,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_COST,
} from "@/lib/site";
import { sendEmail } from "@/lib/server/mailer";
import { claimCheckoutStock, releaseCheckoutStock } from "@/lib/server/checkout-stock";
import { undoPendingDiscountUsage } from "@/lib/server/checkout-ledger";
import {
  createOrderAccessToken,
  orderAccessCookieName,
} from "@/lib/server/order-access";
import { productionRequiresSupabase, supabaseConfigured } from "@/lib/server/supabase";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function grantBrowserOrderAccess(order: Order) {
  const store = await cookies();
  store.set(orderAccessCookieName(order.id), createOrderAccessToken(order.id, order.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/order/${order.id}`,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function POST(request: NextRequest) {
  let claimedSkus: string[] = [];
  try {
    const body = await request.json();
    const { email, name, items, address, discountCode } = body;
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanName = String(name ?? "").trim();

    if (
      !validEmail(cleanEmail) ||
      !cleanName ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !address
    ) {
      return Response.json({ error: "Missing or invalid checkout details" }, { status: 400 });
    }

    if (productionRequiresSupabase() && !supabaseConfigured()) {
      return Response.json(
        {
          error:
            "Checkout is temporarily unavailable because the live database is not configured.",
        },
        { status: 503 }
      );
    }

    const addressData = {
      line1: String(address.line1 ?? "").trim(),
      line2: address.line2 ? String(address.line2).trim() : undefined,
      city: String(address.city ?? "").trim(),
      postcode: String(address.postcode ?? "").trim().toUpperCase(),
      country: String(address.country ?? "United Kingdom").trim(),
    };
    if (!addressData.line1 || !addressData.city || !addressData.postcode) {
      return Response.json({ error: "A complete delivery address is required" }, { status: 400 });
    }

    const skus = [
      ...new Set(
        items.map((i: { sku?: unknown }) => String(i.sku ?? "").trim().toUpperCase())
      ),
    ].filter(Boolean);
    if (skus.length !== items.length) {
      return Response.json({ error: "Invalid or duplicate items" }, { status: 400 });
    }

    const products = [];
    for (const sku of skus) {
      const product = await getProductBySku(sku);
      if (!product) {
        return Response.json({ error: `Unknown SKU ${sku}` }, { status: 400 });
      }
      products.push(product);
    }

    const subtotal =
      Math.round(products.reduce((sum, p) => sum + p.price, 0) * 100) / 100;

    let discount: Order["discount"];
    const normalizedDiscountCode = discountCode
      ? String(discountCode).trim()
      : undefined;
    if (normalizedDiscountCode) {
      const definitions = await listDiscounts();
      const definition = definitions.find(
        (d) => d.code.toLowerCase() === normalizedDiscountCode.toLowerCase()
      );
      if (definition?.categories?.length) {
        const ineligible = products.some(
          (p) => !definition.categories!.includes(p.category)
        );
        if (ineligible) {
          return Response.json(
            {
              error:
                "That code can only be used when every piece in the bag is eligible.",
            },
            { status: 400 }
          );
        }
      }

      const result = await evaluateDiscount(normalizedDiscountCode, {
        subtotal,
        email: cleanEmail,
        itemSkus: skus,
      });
      if (!result.ok || !result.discount) {
        return Response.json({ error: result.error }, { status: 400 });
      }
      discount = result.discount;
    }

    const requestedMethod = String(body.deliveryMethod ?? "").toLowerCase();
    const wantsExpress =
      requestedMethod === "express" ||
      Number(body.deliveryCost) === EXPRESS_DELIVERY_COST;
    const baseDelivery =
      subtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : wantsExpress
          ? EXPRESS_DELIVERY_COST
          : STANDARD_DELIVERY_COST;
    const finalDelivery = discount?.type === "free_delivery" ? 0 : baseDelivery;

    const stripe = stripeEnabled() ? getStripe() : null;
    if (!stripe && process.env.NODE_ENV === "production") {
      return Response.json(
        {
          error:
            "Checkout is temporarily unavailable because payments are not configured.",
        },
        { status: 503 }
      );
    }

    await cancelPendingOrdersForEmail(cleanEmail);

    const claim = await claimCheckoutStock(skus);
    claimedSkus = claim.ok;
    if (claim.gone.length) {
      if (claimedSkus.length) await releaseCheckoutStock(claimedSkus);
      claimedSkus = [];
      return Response.json({ gone: claim.gone }, { status: 409 });
    }

    const orderResult = await createOrder({
      email: cleanEmail,
      name: cleanName,
      items: skus.map((sku) => ({ sku })),
      deliveryCost: finalDelivery,
      address: addressData,
      discountCode: normalizedDiscountCode,
      channel: "website",
      status: stripe ? "PENDING_PAYMENT" : "PAID",
      paymentProvider: stripe ? "stripe" : "demo",
    });

    if (orderResult.gone?.length) {
      await releaseCheckoutStock(claimedSkus);
      claimedSkus = [];
      return Response.json({ gone: orderResult.gone }, { status: 409 });
    }
    if (!orderResult.order) {
      await releaseCheckoutStock(claimedSkus);
      claimedSkus = [];
      return Response.json(
        { error: orderResult.error ?? "Could not create order" },
        { status: 500 }
      );
    }

    const order = orderResult.order;
    await grantBrowserOrderAccess(order);

    if (!stripe) {
      claimedSkus = [];
      await sendEmail({
        to: order.email,
        template: "order-confirmed",
        data: { order },
      });
      return Response.json({ order, mode: "demo" }, { status: 201 });
    }

    await undoPendingDiscountUsage(order.discount?.code, order.email);

    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100),
        currency: "gbp",
        automatic_payment_methods: { enabled: true },
        receipt_email: order.email,
        description: `Vicarious Clothing order ${order.id}`,
        metadata: {
          orderId: order.id,
          items: order.items
            .map((i) => `${i.brand} ${i.name}`)
            .join(", ")
            .slice(0, 450),
        },
      });

      await setOrderPayment(order.id, intent.id);
      claimedSkus = [];
      return Response.json(
        { order, mode: "stripe", clientSecret: intent.client_secret },
        { status: 201 }
      );
    } catch (error) {
      await cancelPendingOrdersForEmail(order.email);
      claimedSkus = [];
      throw error;
    }
  } catch (err) {
    if (claimedSkus.length) {
      try {
        await releaseCheckoutStock(claimedSkus);
      } catch {
        // Expired reservations self-release; preserve the original failure.
      }
    }
    console.error("Checkout error:", err);
    return Response.json({ error: "Checkout failed" }, { status: 500 });
  }
}

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { enforcePublicRateLimit } from "@/lib/server/public-rate-limit";
import { getSupabase } from "@/lib/server/supabase";
import type { Order } from "@/lib/types";
import {
  createOrder,
  evaluateDiscount,
  getProductBySku,
  getOrder,
  listDiscounts,
  setOrderPayment,
  updateOrderStatus,
} from "@/lib/server/store";
import { getStripe, stripeEnabled } from "@/lib/server/payments";
import {
  EXPRESS_DELIVERY_COST,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_COST,
} from "@/lib/site";
import { sendEmail } from "@/lib/server/mailer";
import { sendAdminOrderAlertOnce } from "@/lib/server/order-alerts";
import {
  attachCheckoutHoldToOrder,
  claimCheckoutStock,
  releaseCheckoutStock,
} from "@/lib/server/checkout-stock";
import { undoPendingDiscountUsage } from "@/lib/server/checkout-ledger";
import {
  createOrderAccessToken,
  orderAccessCookieName,
} from "@/lib/server/order-access";
import {
  getOrCreateCheckoutHoldToken,
  refreshCheckoutHoldToken,
} from "@/lib/server/checkout-hold";
import { syncOrderSaleToSellerHq } from "@/lib/server/sellerhq-sync";
import {
  productionRequiresSupabase,
  supabaseConfigured,
} from "@/lib/server/supabase";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function bodyHoldToken(body: Record<string, unknown>) {
  return body.checkoutHoldToken ?? body.holdToken;
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

async function sendPaidOrderSideEffects(order: Order) {
  let emailSent = false;
  let adminAlertSent = false;
  let sellerHqSynced = false;

  try {
    await sendEmail({
      to: order.email,
      template: "order-confirmed",
      data: { order },
    });
    emailSent = true;
  } catch (error) {
    console.error("Demo order confirmation email failed:", error);
  }

  try {
    const result = await sendAdminOrderAlertOnce(order);
    adminAlertSent = result.notified;
  } catch (error) {
    console.error("Demo paid-order admin alert failed:", error);
  }

  try {
    const result = await syncOrderSaleToSellerHq(order);
    sellerHqSynced = result.ok || Boolean(result.skipped);
    if (!result.ok && !result.skipped) {
      console.error("Demo paid-order SellerHQ sync failed:", result.error ?? result.data);
    }
  } catch (error) {
    console.error("Demo paid-order SellerHQ sync failed:", error);
  }

  return { emailSent, adminAlertSent, sellerHqSynced };
}

export async function POST(request: NextRequest) {
  const limited = await enforcePublicRateLimit(request, "checkout");
  if (limited) return limited;
  let claimedSkus: string[] = [];
  let holdToken = "";
  let provisionalOrderId = "";
  try {
    const body = (await request.json()) as Record<string, unknown>;
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

    const addressRecord = address as Record<string, unknown>;
    const addressData = {
      line1: String(addressRecord.line1 ?? "").trim(),
      line2: addressRecord.line2 ? String(addressRecord.line2).trim() : undefined,
      city: String(addressRecord.city ?? "").trim(),
      postcode: String(addressRecord.postcode ?? "").trim().toUpperCase(),
      country: String(addressRecord.country ?? "United Kingdom").trim(),
    };
    if (!addressData.line1 || !addressData.city || !addressData.postcode) {
      return Response.json({ error: "A complete delivery address is required" }, { status: 400 });
    }

    const skus = [
      ...new Set(
        items.map((item: { sku?: unknown }) =>
          String(item.sku ?? "").trim().toUpperCase()
        )
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
      Math.round(products.reduce((sum, product) => sum + product.price, 0) * 100) / 100;

    let discount: Order["discount"];
    const normalizedDiscountCode = discountCode
      ? String(discountCode).trim()
      : undefined;
    if (normalizedDiscountCode) {
      const definitions = await listDiscounts();
      const definition = definitions.find(
        (item) => item.code.toLowerCase() === normalizedDiscountCode.toLowerCase()
      );
      if (definition?.categories?.length) {
        const ineligible = products.some(
          (product) => !definition.categories!.includes(product.category)
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

    holdToken = await getOrCreateCheckoutHoldToken(bodyHoldToken(body));
    await refreshCheckoutHoldToken(holdToken);

    // Recover an already-created payment attempt for this checkout hold,
    // rather than creating another order after a network retry.
    if (stripe) {
      const db = getSupabase();
      if (db) {
        const {data: held, error: heldError} = await db.from("inventory_items")
          .select("checkout_hold_order_id").eq("checkout_hold_token",holdToken)
          .not("checkout_hold_order_id","is",null).limit(1);
        if (heldError) throw heldError;
        const existingId = held?.[0]?.checkout_hold_order_id;
        if (existingId) {
          const existing = await getOrder(String(existingId));
          if (existing?.status === "PENDING_PAYMENT" && existing.email === cleanEmail &&
              existing.items.length === skus.length &&
              existing.items.every((item) => skus.includes(item.sku))) {
            if (existing.paymentIntentId) {
              const intent = await stripe.paymentIntents.retrieve(existing.paymentIntentId);
              if (intent.status === "requires_payment_method" ||
                  intent.status === "requires_confirmation" ||
                  intent.status === "requires_action") {
                await grantBrowserOrderAccess(existing);
                return Response.json({order:existing,mode:"stripe",clientSecret:intent.client_secret,holdToken}, {status:200});
              }
            }
            return Response.json({error:"Your previous checkout is being processed. Check the existing order before retrying."}, {status:409});
          }
          return Response.json({error:"This checkout is already linked to an existing order."}, {status:409});
        }
      }
    }

    const claim = await claimCheckoutStock(skus, { holdToken });
    claimedSkus = claim.ok;
    if (claim.gone.length) {
      if (claimedSkus.length) await releaseCheckoutStock(claimedSkus, { holdToken });
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
      await releaseCheckoutStock(claimedSkus, { holdToken });
      claimedSkus = [];
      return Response.json({ gone: orderResult.gone }, { status: 409 });
    }
    if (!orderResult.order) {
      await releaseCheckoutStock(claimedSkus, { holdToken });
      claimedSkus = [];
      return Response.json(
        { error: orderResult.error ?? "Could not create order" },
        { status: 500 }
      );
    }

    const order = orderResult.order;
    provisionalOrderId = order.id;
    if (stripe) {
      await attachCheckoutHoldToOrder(
        order.items.map((item) => item.sku),
        holdToken,
        order.id
      );
    }
    await grantBrowserOrderAccess(order);

    if (!stripe) {
      claimedSkus = [];
      const sideEffects = await sendPaidOrderSideEffects(order);
      return Response.json({ order, mode: "demo", ...sideEffects }, { status: 201 });
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
            .map((item) => `${item.brand} ${item.name}`)
            .join(", ")
            .slice(0, 450),
        },
      }, { idempotencyKey: `vicarious-checkout-${order.id}` });

      await setOrderPayment(order.id, intent.id);
      claimedSkus = [];
      provisionalOrderId = "";
      return Response.json(
        { order, mode: "stripe", clientSecret: intent.client_secret, holdToken },
        { status: 201 }
      );
    } catch (error) {
      await updateOrderStatus(order.id, "CANCELLED", "checkout-system");
      await releaseCheckoutStock(order.items.map((item) => item.sku), {
        holdToken,
        orderId: order.id,
      });
      claimedSkus = [];
      throw error;
    }
  } catch (err) {
    if (provisionalOrderId) {
      try {
        await updateOrderStatus(provisionalOrderId, "CANCELLED", "checkout-setup-failure");
      } catch (cleanupError) {
        console.error("Unable to cancel incomplete checkout order", cleanupError);
      }
    }
    if (claimedSkus.length) {
      try {
        await releaseCheckoutStock(claimedSkus, holdToken ? { holdToken, ...(provisionalOrderId ? { orderId: provisionalOrderId } : {}) } : {});
      } catch {
        // Preserve the original failure.
      }
    }
    console.error("Checkout error:", err);
    return Response.json({ error: "Checkout failed" }, { status: 500 });
  }
}

import { getSupabase } from "@/lib/server/supabase";
import type { Order, Product } from "@/lib/types";

const DEFAULT_TIMEOUT_MS = 12_000;

export type SellerHqSyncResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  data?: unknown;
  error?: string;
};

function integrationUrl() {
  return process.env.SELLERHQ_VICARIOUS_LINK_URL || "";
}

function integrationKey() {
  return process.env.SELLERHQ_API_KEY || "";
}

function configured() {
  return Boolean(integrationUrl() && integrationKey());
}

async function postToSellerHq(body: Record<string, unknown>): Promise<SellerHqSyncResult> {
  const url = integrationUrl();
  const key = integrationKey();

  if (!url || !key) {
    return { ok: false, skipped: true, error: "SellerHQ sync is not configured" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vicarious-Api-Key": key,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: typeof data?.error === "string" ? data.error : `SellerHQ returned ${res.status}`,
      };
    }

    return { ok: true, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Persist order delivery before contacting SellerHQ, so outages can be retried.
async function persistOrderEvent(order: Order, payload: Record<string, unknown>) {
  const db = getSupabase();
  if (!db && process.env.NODE_ENV === "production") throw new Error("SellerHQ outbox unavailable");
  if (!db) return;
  const eventKey = `order:${order.id}:${order.status}:${order.updatedAt}`;
  const { error } = await db.from("sellerhq_retry_jobs").upsert(
    { event_key: eventKey, payload, status: "pending", retry_after: new Date().toISOString() },
    { onConflict: "event_key", ignoreDuplicates: true }
  );
  if (error) throw new Error(`Could not persist SellerHQ event: ${error.message}`);
}
async function markDelivered(order: Order) {
  const db = getSupabase();
  if (!db) return;
  const eventKey = `order:${order.id}:${order.status}:${order.updatedAt}`;
  const { error } = await db.from("sellerhq_retry_jobs").update({ status: "done", updated_at: new Date().toISOString() }).eq("event_key", eventKey);
  if (error) console.error("SellerHQ outbox completion failed:", error.message);
}
function orderPayload(order: Order) {
  return {
    id: order.id,
    channel: order.channel,
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    delivery: order.delivery,
    paymentProvider: order.paymentProvider,
    paymentIntentId: order.paymentIntentId,
    carrier: order.carrier,
    tracking: order.tracking,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      sku: item.sku,
      name: item.name,
      brand: item.brand,
      size: item.size,
      condition: item.condition,
      price: item.price,
    })),
  };
}

export async function fetchProductFromSellerHq(prdCode: string): Promise<SellerHqSyncResult> {
  return postToSellerHq({ action: "get_product", prdCode });
}

export async function syncProductToSellerHq(product: Product, reason: string): Promise<SellerHqSyncResult> {
  if (!product.prdCode?.trim()) {
    return { ok: false, skipped: true, error: "Product has no SellerHQ PRD code" };
  }

  if (!configured()) {
    return { ok: false, skipped: true, error: "SellerHQ sync is not configured" };
  }

  return postToSellerHq({
    action: "product_update_from_vicarious",
    reason,
    product: {
      prdCode: product.prdCode,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      size: product.size,
      colour: product.colour,
      material: product.material,
      condition: product.condition,
      conditionNotes: product.conditionNotes,
      description: product.description,
      defects: product.defects,
      tags: product.tags,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      cost: product.cost,
      floorPrice: product.floorPrice,
      images: product.images,
      status: product.status,
      location: product.location,
      acquisitionSource: product.acquisitionSource,
      purchaseDate: product.purchaseDate,
      marketplace: product.marketplace,
      soldAt: product.soldAt,
      reservedUntil: product.reservedUntil,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function syncOrderSaleToSellerHq(order: Order): Promise<SellerHqSyncResult> {
  if (!order.items.length) {
    return { ok: false, skipped: true, error: "Order has no items" };
  }

  if (!configured()) {
    return { ok: false, skipped: true, error: "SellerHQ sync is not configured" };
  }

  const payload = { action: "record_sale", order: orderPayload(order) };
  await persistOrderEvent(order, payload);
  const result = await postToSellerHq(payload);
  if (result.ok) await markDelivered(order);
  return result;
}

export async function syncOrderStatusToSellerHq(order: Order): Promise<SellerHqSyncResult> {
  return syncOrderSaleToSellerHq(order);
}

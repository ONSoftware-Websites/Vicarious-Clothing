import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/server/supabase";

// Destructive admin actions must be fail-fast. Do not use the public store
// fallback layer here: on Vercel that fallback is temporary local memory and can
// make a failed Supabase delete look successful while leaving real rows behind.

type DbError = { message: string } | null;
type DbResult<T = unknown> = PromiseLike<{ data?: T | null; error: DbError }>;

function requireDb() {
  const db = getSupabase();
  if (!db) {
    throw new Error("Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return db;
}

function normalizeId(value: string, label: string) {
  const id = value.trim();
  if (!id) throw new Error(`${label} is required.`);
  return id;
}

function normalizeSku(value: string) {
  return normalizeId(value, "SKU").toUpperCase();
}

async function expectOk(label: string, operation: DbResult) {
  const { error } = await operation;
  if (error) throw new Error(`${label} failed: ${error.message}`);
}

async function readRows<T>(label: string, operation: DbResult<T[]>) {
  const { data, error } = await operation;
  if (error) throw new Error(`${label} failed: ${error.message}`);
  return data ?? [];
}

async function logAdminDelete(
  db: SupabaseClient,
  actor: string,
  action: string,
  detail: string
) {
  await expectOk(
    "write audit log",
    db.from("audit_logs").insert({
      id: crypto.randomUUID(),
      actor,
      action,
      detail,
      at: new Date().toISOString(),
    })
  );
}

export async function adminDeleteProduct(sku: string, actor: string) {
  const db = requireDb();
  const normalizedSku = normalizeSku(sku);

  const orderItems = await readRows<{ order_id: string }>(
    "read product order references",
    db.from("order_items").select("order_id").eq("sku", normalizedSku)
  );

  // Keep historic order lines, but detach the live product FK so the catalogue
  // row can be removed without deleting customer/order history.
  await expectOk(
    "detach product from historic order items",
    db.from("order_items").update({ sku: null }).eq("sku", normalizedSku)
  );

  await expectOk("delete wishlist items", db.from("wishlist_items").delete().eq("sku", normalizedSku));
  await expectOk("delete product images", db.from("product_images").delete().eq("product_sku", normalizedSku));
  await expectOk("delete product measurements", db.from("product_measurements").delete().eq("product_sku", normalizedSku));
  await expectOk("delete product marketplace listings", db.from("product_marketplace").delete().eq("sku", normalizedSku));
  await expectOk("delete inventory history", db.from("inventory_history").delete().eq("sku", normalizedSku));
  await expectOk("delete inventory item", db.from("inventory_items").delete().eq("sku", normalizedSku));

  const purchaseItems = await readRows<{ purchase_id: string }>(
    "read stock purchase item references",
    db.from("stock_purchase_items").select("purchase_id").eq("sku", normalizedSku)
  );
  await expectOk("delete stock purchase item references", db.from("stock_purchase_items").delete().eq("sku", normalizedSku));

  await expectOk("delete product", db.from("products").delete().eq("sku", normalizedSku));

  const detailParts = [normalizedSku];
  if (orderItems.length) detailParts.push(`detached from ${orderItems.length} order item(s)`);
  if (purchaseItems.length) detailParts.push(`removed from ${purchaseItems.length} stock purchase item(s)`);
  await logAdminDelete(db, actor, "deleted product", detailParts.join("; "));
}

export async function adminDeleteOrder(id: string, actor: string) {
  const db = requireDb();
  const orderId = normalizeId(id, "Order ID").toUpperCase();

  const orders = await readRows<{ status: string }>(
    "read order before delete",
    db.from("orders").select("status").eq("id", orderId)
  );
  const order = orders[0];
  if (!order) throw new Error(`Order ${orderId} was not found.`);

  const items = await readRows<{ sku: string | null }>(
    "read order items before delete",
    db.from("order_items").select("sku").eq("order_id", orderId)
  );
  const skus = [...new Set(items.map((item) => item.sku).filter(Boolean) as string[])];

  if (order.status === "PENDING_PAYMENT" && skus.length) {
    await expectOk(
      "release pending order stock",
      db
        .from("inventory_items")
        .update({ status: "AVAILABLE", reserved_until: null, updated_at: new Date().toISOString() })
        .in("sku", skus)
        .eq("status", "RESERVED")
    );
  }

  await expectOk("delete payments", db.from("payments").delete().eq("order_id", orderId));
  await expectOk("delete shipments", db.from("shipments").delete().eq("order_id", orderId));
  await expectOk("delete returns", db.from("returns").delete().eq("order_id", orderId));
  await expectOk("delete refunds", db.from("refunds").delete().eq("order_id", orderId));
  await expectOk("delete order items", db.from("order_items").delete().eq("order_id", orderId));
  await expectOk("delete order", db.from("orders").delete().eq("id", orderId));
  await logAdminDelete(db, actor, "deleted order", orderId);
}

export async function adminDeleteLead(id: string, actor: string) {
  const db = requireDb();
  const leadId = normalizeId(id, "Lead ID");

  // Existing and future schemas should use ON DELETE SET NULL, but do it
  // explicitly so older projects do not block lead deletion.
  await expectOk(
    "detach stock purchases from lead",
    db.from("stock_purchases").update({ lead_id: null }).eq("lead_id", leadId)
  );
  await expectOk("delete lead", db.from("purchase_leads").delete().eq("id", leadId));
  await logAdminDelete(db, actor, "deleted lead", leadId);
}

export async function adminDeletePurchase(id: string, actor: string) {
  const db = requireDb();
  const purchaseId = normalizeId(id, "Purchase ID");

  await expectOk("delete stock purchase items", db.from("stock_purchase_items").delete().eq("purchase_id", purchaseId));
  await expectOk("delete stock purchase", db.from("stock_purchases").delete().eq("id", purchaseId));
  await logAdminDelete(db, actor, "deleted purchase", purchaseId);
}

export async function adminDeleteDiscount(id: string, actor: string) {
  const db = requireDb();
  const discountId = normalizeId(id, "Discount ID");

  await expectOk("delete discount", db.from("discounts").delete().eq("id", discountId));
  await logAdminDelete(db, actor, "deleted discount", discountId);
}

export async function adminDeletePost(id: string, actor: string) {
  const db = requireDb();
  const postId = normalizeId(id, "Post ID");

  await expectOk("delete journal post", db.from("journal_posts").delete().eq("id", postId));
  await logAdminDelete(db, actor, "deleted journal post", postId);
}

export async function adminDeleteSubscriber(email: string, actor: string) {
  const db = requireDb();
  const normalizedEmail = normalizeId(email, "Email").toLowerCase();

  await expectOk(
    "delete newsletter subscriber",
    db.from("newsletter_subscribers").delete().eq("email", normalizedEmail)
  );
  await logAdminDelete(db, actor, "deleted subscriber", normalizedEmail);
}

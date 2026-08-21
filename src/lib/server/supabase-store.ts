import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuditEntry,
  Discount,
  EmailLogEntry,
  InventoryStatus,
  JournalPost,
  MarketplaceListing,
  NewsletterSubscriber,
  Order,
  OrderStatus,
  Product,
  SalesChannel,
  SellToUsLead,
  StockPurchase,
} from "@/lib/types";
import { RESERVATION_MINUTES } from "@/lib/site";

type Row = Record<string, unknown>;

const MARKETPLACE_DEFAULT: MarketplaceListing[] = [
  { channel: "website", status: "LISTED" },
  { channel: "vinted", status: "NOT_LISTED" },
  { channel: "depop", status: "NOT_LISTED" },
  { channel: "ebay", status: "NOT_LISTED" },
];

function auditEntry(actor: string, action: string, detail?: string, before?: string, after?: string): AuditEntry {
  return {
    id: crypto.randomUUID(),
    actor,
    action,
    detail,
    before,
    after,
    at: new Date().toISOString(),
  };
}

async function logAudit(
  db: SupabaseClient,
  actor: string,
  action: string,
  detail?: string,
  before?: string,
  after?: string
) {
  const entry = auditEntry(actor, action, detail, before, after);
  const { error } = await db.from("audit_logs").insert({
    id: entry.id,
    actor: entry.actor,
    action: entry.action,
    detail: entry.detail,
    before: entry.before,
    after: entry.after,
    at: entry.at,
  });
  if (error) throw new Error(error.message);
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback = ""): string {
  return value === null || value === undefined ? fallback : String(value);
}

async function fetchBySku<T extends Row>(
  db: SupabaseClient,
  table: string,
  skus: string[],
  column = "sku"
): Promise<T[]> {
  if (skus.length === 0) return [];
  const { data, error } = await db.from(table).select("*").in(column, skus);
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

function mapMarketplace(rows: Row[]): MarketplaceListing[] {
  if (rows.length === 0) return MARKETPLACE_DEFAULT;
  return MARKETPLACE_DEFAULT.map((entry) => {
    const row = rows.find((r) => str(r.channel) === entry.channel);
    return {
      channel: entry.channel,
      status: row ? (str(row.status) as "LISTED" | "NOT_LISTED") : entry.status,
    };
  });
}

function toProduct(
  p: Row,
  inv?: Row,
  images: Row[] = [],
  measurements: Row[] = [],
  marketplace: Row[] = []
): Product {
  return {
    sku: str(p.sku),
    slug: str(p.slug),
    name: str(p.name),
    brand: str(p.brand),
    category: str(p.category) as Product["category"],
    size: str(p.size),
    colour: str(p.colour),
    material: str(p.material),
    condition: str(p.condition) as Product["condition"],
    conditionNotes: str(p.condition_notes),
    description: str(p.description),
    defects: Array.isArray(p.defects) ? (p.defects as string[]) : [],
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    price: num(p.price),
    compareAtPrice: p.compare_at_price === null ? undefined : num(p.compare_at_price),
    cost: p.cost === null ? undefined : num(p.cost),
    floorPrice: p.floor_price === null ? undefined : num(p.floor_price),
    images: images.map((i) => ({ src: str(i.src), alt: i.alt ? str(i.alt) : undefined })),
    measurements: measurements.map((m) => ({
      label: str(m.label),
      value: str(m.value),
    })),
    status: (inv?.status ?? "DRAFT") as InventoryStatus,
    location: inv?.location_id ? str(inv.location_id) : undefined,
    listedAt: str(p.listed_at, new Date(0).toISOString()),
    soldAt: inv?.sold_at ? str(inv.sold_at) : undefined,
    reservedUntil: inv?.reserved_until ? str(inv.reserved_until) : undefined,
    acquisitionSource: inv?.acquisition_source ? str(inv.acquisition_source) : undefined,
    purchaseDate: inv?.purchase_date ? str(inv.purchase_date) : undefined,
    marketplace: mapMarketplace(marketplace),
    isPick: Boolean(p.is_pick),
    featured: Boolean(p.featured),
  };
}

async function loadProductData(
  db: SupabaseClient,
  rows: Row[]
): Promise<Product[]> {
  const skus = rows.map((r) => str(r.sku));
  const [inv, images, measurements, marketplace] = await Promise.all([
    fetchBySku(db, "inventory_items", skus),
    (async () => {
      const { data, error } = await db
        .from("product_images")
        .select("*")
        .in("product_sku", skus)
        .order("position");
      if (error) throw new Error(error.message);
      return (data ?? []) as Row[];
    })(),
    fetchBySku(db, "product_measurements", skus, "product_sku"),
    (async () => {
      const { data, error } = await db
        .from("product_marketplace")
        .select("*")
        .in("sku", skus);
      if (error) throw new Error(error.message);
      return (data ?? []) as Row[];
    })(),
  ]);

  return rows.map((p) =>
    toProduct(
      p,
      inv.find((i) => str(i.sku) === str(p.sku)),
      images.filter((i) => str(i.product_sku) === str(p.sku)),
      measurements.filter((m) => str(m.product_sku) === str(p.sku)),
      marketplace.filter((m) => str(m.sku) === str(p.sku))
    )
  );
}

// ---------------------------------------------------------------
// Products & inventory
// ---------------------------------------------------------------

export async function expireReservations(db: SupabaseClient) {
  const { error } = await db
    .from("inventory_items")
    .update({ status: "AVAILABLE", reserved_until: null })
    .eq("status", "RESERVED")
    .lt("reserved_until", new Date().toISOString());
  if (error) throw new Error(error.message);
}

export async function listProducts(db: SupabaseClient): Promise<Product[]> {
  const { data, error } = await db.from("products").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return loadProductData(db, (data ?? []) as Row[]);
}

export async function getProductBySku(db: SupabaseClient, sku: string): Promise<Product | undefined> {
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("sku", sku.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return (await loadProductData(db, [data as Row]))[0];
}

export async function getProductBySlug(db: SupabaseClient, slug: string): Promise<Product | undefined> {
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return (await loadProductData(db, [data as Row]))[0];
}

export async function upsertProduct(
  db: SupabaseClient,
  product: Product,
  actor: string,
  detail: string
): Promise<Product> {
  const { error: productError } = await db.from("products").upsert({
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    size: product.size,
    colour: product.colour,
    material: product.material,
    condition: product.condition,
    condition_notes: product.conditionNotes,
    description: product.description,
    defects: product.defects,
    tags: product.tags,
    price: product.price,
    compare_at_price: product.compareAtPrice ?? null,
    cost: product.cost ?? null,
    floor_price: product.floorPrice ?? null,
    is_pick: product.isPick,
    featured: product.featured,
    listed_at: product.listedAt,
    updated_at: new Date().toISOString(),
  });
  if (productError) throw new Error(productError.message);

  // Ensure location exists (FK) — auto-create ad-hoc locations like "A-04"
  if (product.location) {
    await db.from("inventory_locations").upsert(
      { id: product.location, label: product.location },
      { onConflict: "id" }
    );
  }

  const { error: invError } = await db.from("inventory_items").upsert({
    sku: product.sku,
    status: product.status,
    location_id: product.location ?? null,
    reserved_until: product.reservedUntil ?? null,
    sold_at: product.soldAt ?? null,
    acquisition_source: product.acquisitionSource ?? null,
    purchase_date: product.purchaseDate ?? null,
    updated_at: new Date().toISOString(),
  });
  if (invError) {
    // If location FK still fails, retry without location to avoid draft lock
    if (invError.message.includes("inventory_locations") || invError.message.includes("foreign key")) {
      const { error: retryErr } = await db.from("inventory_items").upsert({
        sku: product.sku,
        status: product.status,
        location_id: null,
        reserved_until: product.reservedUntil ?? null,
        sold_at: product.soldAt ?? null,
        acquisition_source: product.acquisitionSource ?? null,
        purchase_date: product.purchaseDate ?? null,
        updated_at: new Date().toISOString(),
      });
      if (retryErr) throw new Error(retryErr.message);
    } else {
      throw new Error(invError.message);
    }
  }

  await db.from("product_images").delete().eq("product_sku", product.sku);
  if (product.images.length) {
    const { error: imgError } = await db.from("product_images").insert(
      product.images.map((img, i) => ({
        product_sku: product.sku,
        position: i,
        src: img.src,
        alt: img.alt ?? null,
      }))
    );
    if (imgError) throw new Error(imgError.message);
  }

  await db.from("product_measurements").delete().eq("product_sku", product.sku);
  if (product.measurements.length) {
    const { error: mError } = await db.from("product_measurements").insert(
      product.measurements.map((m) => ({
        product_sku: product.sku,
        label: m.label,
        value: m.value,
      }))
    );
    if (mError) throw new Error(mError.message);
  }

  await db.from("product_marketplace").delete().eq("sku", product.sku);
  if (product.marketplace.length) {
    const { error: mpError } = await db.from("product_marketplace").insert(
      product.marketplace.map((m) => ({
        sku: product.sku,
        channel: m.channel,
        status: m.status,
      }))
    );
    if (mpError) throw new Error(mpError.message);
  }

  await logAudit(db, actor, detail.includes("created") ? "created product" : "updated product", detail);
  await db.from("inventory_history").insert({ sku: product.sku, actor, action: detail.includes("created") ? "created product" : "updated product", detail, at: new Date().toISOString() }).then(() => {});
  return product;
}

export async function setProductStatus(
  db: SupabaseClient,
  sku: string,
  status: InventoryStatus
) {
  const update: Row = { status, updated_at: new Date().toISOString() };
  if (status === "SOLD") update.sold_at = new Date().toISOString();
  if (status === "AVAILABLE") update.reserved_until = null;
  const { error } = await db
    .from("inventory_items")
    .update(update)
    .eq("sku", sku);
  if (error) throw new Error(error.message);
}

export async function nextSku(db: SupabaseClient): Promise<string> {
  const { data, error } = await db.from("products").select("sku");
  if (error) throw new Error(error.message);
  const max = (data ?? []).reduce((m, r) => {
    const n = Number.parseInt(str(r.sku).replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `VC-${String(max + 1).padStart(6, "0")}`;
}

export async function reserveProducts(
  db: SupabaseClient,
  skus: string[]
): Promise<{ ok: string[]; gone: string[] }> {
  await expireReservations(db);
  const { data, error } = await db
    .from("inventory_items")
    .select("sku, status")
    .in("sku", skus);
  if (error) throw new Error(error.message);
  const ok: string[] = [];
  const gone: string[] = [];
  for (const sku of skus) {
    const row = (data ?? []).find((r) => str(r.sku) === sku);
    if (!row || str(row.status) !== "AVAILABLE") gone.push(sku);
    else ok.push(sku);
  }
  if (ok.length) {
    const until = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();
    const { error: upError } = await db
      .from("inventory_items")
      .update({ status: "RESERVED", reserved_until: until })
      .in("sku", ok);
    if (upError) throw new Error(upError.message);
  }
  return { ok, gone };
}

export async function releaseProducts(db: SupabaseClient, skus: string[]) {
  if (!skus.length) return;
  const { error } = await db
    .from("inventory_items")
    .update({ status: "AVAILABLE", reserved_until: null })
    .in("sku", skus)
    .eq("status", "RESERVED");
  if (error) throw new Error(error.message);
}

export async function markSoldByOrder(db: SupabaseClient, skus: string[]) {
  if (!skus.length) return;
  const { error } = await db
    .from("inventory_items")
    .update({ status: "SOLD", sold_at: new Date().toISOString() })
    .in("sku", skus);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------
// Orders
// ---------------------------------------------------------------

function toOrder(row: Row, items: Row[]): Order {
  return {
    id: str(row.id),
    email: str(row.email),
    name: str(row.name),
    status: str(row.status) as OrderStatus,
    items: items.map((i) => ({
      sku: str(i.sku),
      name: str(i.name),
      brand: str(i.brand),
      size: str(i.size),
      condition: str(i.condition) as Order["items"][number]["condition"],
      price: num(i.price),
      image: str(i.image),
    })),
    subtotal: num(row.subtotal),
    discount: row.discount_code
      ? {
          code: str(row.discount_code),
          description: str(row.discount_description),
          amount: num(row.discount_amount),
          type: str(row.discount_type, "fixed") as "percentage" | "fixed" | "free_delivery",
        }
      : undefined,
    delivery: num(row.delivery),
    total: num(row.total),
    address: {
      line1: str(row.address_line1),
      line2: row.address_line2 ? str(row.address_line2) : undefined,
      city: str(row.address_city),
      postcode: str(row.address_postcode),
      country: str(row.address_country),
    },
    channel: str(row.channel, "website") as SalesChannel,
    carrier: row.carrier ? str(row.carrier) : undefined,
    tracking: row.tracking ? str(row.tracking) : undefined,
    paymentProvider: str(row.payment_provider, "demo") as "demo" | "stripe",
    paymentIntentId: row.payment_intent_id ? str(row.payment_intent_id) : undefined,
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

async function fetchOrders(
  db: SupabaseClient,
  filter?: { email?: string; id?: string }
): Promise<Order[]> {
  let q = db.from("orders").select("*").order("created_at", { ascending: false });
  if (filter?.email) q = q.eq("email", filter.email.toLowerCase());
  if (filter?.id) q = q.eq("id", filter.id.toUpperCase());
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => str(r.id));
  const { data: items, error: itemsError } = await db
    .from("order_items")
    .select("*")
    .in("order_id", ids);
  if (itemsError) throw new Error(itemsError.message);

  return rows.map((row) =>
    toOrder(
      row,
      (items ?? []).filter((i) => str(i.order_id) === str(row.id))
    )
  );
}

export async function nextOrderId(db: SupabaseClient): Promise<string> {
  const { data, error } = await db.from("orders").select("id");
  if (error) throw new Error(error.message);
  const max = (data ?? []).reduce((m, r) => {
    const n = Number.parseInt(str(r.id).replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `VC-${String(max + 1).padStart(4, "0")}`;
}

export interface CreateOrderInput {
  email: string;
  name: string;
  items: Array<{ sku: string }>;
  deliveryCost: number;
  address: Order["address"];
  discountCode?: string;
  channel?: SalesChannel;
  status?: OrderStatus;
  paymentProvider?: Order["paymentProvider"];
  checkoutUrl?: string;
}

export async function createOrder(
  db: SupabaseClient,
  input: CreateOrderInput
): Promise<{ order?: Order; gone?: string[] }> {
  await expireReservations(db);
  const skus = input.items.map((i) => i.sku.toUpperCase());

  const { data: invRows, error: invError } = await db
    .from("inventory_items")
    .select("sku, status")
    .in("sku", skus);
  if (invError) throw new Error(invError.message);

  const products = await loadProductData(
    db,
    (await db.from("products").select("*").in("sku", skus)).data ?? []
  );

  const gone: string[] = [];
  const items: Order["items"] = [];
  for (const sku of skus) {
    const inv = (invRows ?? []).find((r) => str(r.sku) === sku);
    if (!inv || !["AVAILABLE", "RESERVED"].includes(str(inv.status))) {
      gone.push(sku);
      continue;
    }
    const product = products.find((p) => p.sku === sku);
    items.push({
      sku,
      name: product?.name ?? sku,
      brand: product?.brand ?? "",
      size: product?.size ?? "",
      condition: product?.condition ?? "very_good",
      price: product?.price ?? 0,
      image: product?.images[0]?.src ?? "",
    });
  }
  if (gone.length) return { gone };

  let discount: Order["discount"];
  if (input.discountCode) {
    const result = await evaluateDiscount(db, input.discountCode, {
      subtotal: items.reduce((s, i) => s + i.price, 0),
      email: input.email,
      itemSkus: skus,
    });
    if (result.ok && result.discount) discount = result.discount;
  }

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const discountAmount = Math.round((discount?.amount ?? 0) * 100) / 100;
  const delivery =
    discount?.type === "free_delivery"
      ? 0
      : Math.round(input.deliveryCost * 100) / 100;
  const total = Math.max(0, subtotal - discountAmount) + delivery;
  const status: OrderStatus = input.status ?? "PAID";
  const id = await nextOrderId(db);

  const { error: orderError } = await db.from("orders").insert({
    id,
    email: input.email.toLowerCase(),
    name: input.name,
    status,
    subtotal,
    discount_code: discount?.code ?? null,
    discount_type: discount?.type ?? null,
    discount_description: discount?.description ?? null,
    discount_amount: discount?.amount ?? 0,
    delivery,
    total,
    channel: input.channel ?? "website",
    address_line1: input.address.line1,
    address_line2: input.address.line2 ?? null,
    address_city: input.address.city,
    address_postcode: input.address.postcode,
    address_country: input.address.country,
    payment_provider: input.paymentProvider ?? "demo",
    payment_intent_id: null,
  });
  if (orderError) throw new Error(orderError.message);

  const { error: itemsError } = await db.from("order_items").insert(
    items.map((i) => ({
      order_id: id,
      sku: i.sku,
      name: i.name,
      brand: i.brand,
      size: i.size,
      condition: i.condition,
      price: i.price,
      image: i.image || null,
    }))
  );
  if (itemsError) throw new Error(itemsError.message);

  if (status === "PAID") await markSoldByOrder(db, skus);
  else if (status === "PENDING_PAYMENT") {
    const until = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();
    await db.from("inventory_items").update({ status: "RESERVED", reserved_until: until }).in("sku", skus).eq("status", "AVAILABLE");
  }

  if (input.discountCode && discount) {
    await recordDiscountUsage(db, input.discountCode, input.email);
  }

  await logAudit(
    db,
    input.name,
    "placed order",
    `${id} - ${items.length} item(s) via ${input.channel ?? "website"}`,
    undefined,
    `£${total.toFixed(2)}`
  );

  const order: Order = {
    id,
    email: input.email.toLowerCase(),
    name: input.name,
    status,
    items,
    subtotal,
    discount,
    delivery,
    total,
    address: input.address,
    channel: input.channel ?? "website",
    paymentProvider: input.paymentProvider ?? "demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { order };
}

export async function getOrder(db: SupabaseClient, id: string): Promise<Order | undefined> {
  return (await fetchOrders(db, { id }))[0];
}

export async function listOrders(db: SupabaseClient, email?: string): Promise<Order[]> {
  return fetchOrders(db, email ? { email } : undefined);
}

export async function markOrderPaid(db: SupabaseClient, id: string): Promise<Order | undefined> {
  const order = await getOrder(db, id);
  if (!order) return undefined;
  if (order.status === "PAID") return order;
  const { error } = await db
    .from("orders")
    .update({ status: "PAID", updated_at: new Date().toISOString() })
    .eq("id", id.toUpperCase());
  if (error) throw new Error(error.message);
  await markSoldByOrder(db, order.items.map((i) => i.sku));
  await logAudit(db, order.name, "payment captured", order.id, undefined, `£${order.total.toFixed(2)}`);
  return { ...order, status: "PAID" };
}

export async function setOrderPayment(
  db: SupabaseClient,
  id: string,
  paymentIntentId: string
) {
  const { error } = await db
    .from("orders")
    .update({ payment_intent_id: paymentIntentId, updated_at: new Date().toISOString() })
    .eq("id", id.toUpperCase());
  if (error) throw new Error(error.message);
}

export async function cancelPendingOrdersForEmail(db: SupabaseClient, email: string) {
  const { data: pending, error: fetchError } = await db.from("orders").select("id").eq("status", "PENDING_PAYMENT").eq("email", email.toLowerCase());
  if (fetchError) throw new Error(fetchError.message);
  const ids = (pending ?? []).map((r) => String((r as Record<string, unknown>).id));
  if (ids.length) {
    const { data: items } = await db.from("order_items").select("sku").in("order_id", ids);
    const skus = [...new Set((items ?? []).map((r) => String((r as Record<string, unknown>).sku)))];
    if (skus.length) {
      await db.from("inventory_items").update({ status: "AVAILABLE", reserved_until: null }).in("sku", skus).eq("status", "RESERVED");
    }
  }
  const { error } = await db
    .from("orders")
    .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
    .eq("status", "PENDING_PAYMENT")
    .eq("email", email.toLowerCase());
  if (error) throw new Error(error.message);
}

export async function updateOrderStatus(
  db: SupabaseClient,
  id: string,
  status: OrderStatus,
  actor: string
): Promise<Order | undefined> {
  const before = await getOrder(db, id);
  if (!before) return undefined;
  const { error } = await db
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id.toUpperCase());
  if (error) throw new Error(error.message);
  await logAudit(db, actor, "updated order", before.id, before.status, status);
  return { ...before, status };
}

export async function setOrderTracking(
  db: SupabaseClient,
  id: string,
  carrier: string,
  tracking: string,
  actor: string
): Promise<Order | undefined> {
  const before = await getOrder(db, id);
  if (!before) return undefined;
  const { error } = await db
    .from("orders")
    .update({ carrier, tracking, updated_at: new Date().toISOString() })
    .eq("id", id.toUpperCase());
  if (error) throw new Error(error.message);
  await logAudit(db, actor, "set tracking", `${before.id} ${tracking}`);
  return { ...before, carrier, tracking };
}

// ---------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------

export interface DiscountContext {
  subtotal: number;
  email: string;
  itemSkus: string[];
}

export interface DiscountResult {
  ok: boolean;
  discount?: Order["discount"];
  error?: string;
}

function toDiscount(row: Row): Discount {
  return {
    id: str(row.id),
    code: str(row.code),
    type: str(row.type) as Discount["type"],
    value: num(row.value),
    description: str(row.description),
    minBasket: row.min_basket === null ? undefined : num(row.min_basket),
    categories: Array.isArray(row.categories) ? (row.categories as string[]) : undefined,
    expiresAt: row.expires_at ? str(row.expires_at) : undefined,
    usageLimit: row.usage_limit === null ? undefined : num(row.usage_limit),
    usedCount: num(row.used_count),
    usedEmails: Array.isArray(row.used_emails) ? (row.used_emails as string[]) : [],
    active: Boolean(row.active),
    createdAt: str(row.created_at),
  };
}

export async function listDiscounts(db: SupabaseClient): Promise<Discount[]> {
  const { data, error } = await db.from("discounts").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toDiscount);
}

export async function evaluateDiscount(
  db: SupabaseClient,
  code: string,
  context: DiscountContext
): Promise<DiscountResult> {
  const discounts = await listDiscounts(db);
  const discount = discounts.find(
    (d) => d.code.toLowerCase() === code.trim().toLowerCase()
  );
  if (!discount || !discount.active) {
    return { ok: false, error: "That code doesn't exist." };
  }
  if (discount.expiresAt && new Date(discount.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: "That code has expired." };
  }
  if (discount.usageLimit !== undefined && discount.usedCount >= discount.usageLimit) {
    return { ok: false, error: "That code has reached its usage limit." };
  }
  if (discount.usedEmails.includes(context.email.toLowerCase())) {
    return { ok: false, error: "That code has already been used on this email." };
  }
  if (discount.minBasket !== undefined && context.subtotal < discount.minBasket) {
    return {
      ok: false,
      error: `That code needs a basket of at least £${discount.minBasket.toFixed(0)}.`,
    };
  }
  if (discount.categories?.length) {
    const products = await loadProductData(
      db,
      (await db.from("products").select("*").in("sku", context.itemSkus)).data ?? []
    );
    const hasEligible = context.itemSkus.some((sku) => {
      const product = products.find((p) => p.sku === sku);
      return product && discount.categories!.includes(product.category);
    });
    if (!hasEligible) {
      return { ok: false, error: "That code doesn't apply to the pieces in your bag." };
    }
  }

  let amount = 0;
  if (discount.type === "percentage") {
    amount = Math.round(context.subtotal * discount.value) / 100;
  } else if (discount.type === "fixed") {
    amount = Math.min(discount.value, context.subtotal);
  }

  return {
    ok: true,
    discount: {
      code: discount.code,
      description: discount.description,
      amount,
      type: discount.type,
    },
  };
}

export async function recordDiscountUsage(db: SupabaseClient, code: string, email: string) {
  const discounts = await listDiscounts(db);
  const discount = discounts.find((d) => d.code.toLowerCase() === code.toLowerCase());
  if (!discount) return;
  const usedEmails = discount.usedEmails.includes(email.toLowerCase())
    ? discount.usedEmails
    : [...discount.usedEmails, email.toLowerCase()];
  const { error } = await db.from("discounts").update({
    used_count: discount.usedCount + 1,
    used_emails: usedEmails,
  }).eq("id", discount.id);
  if (error) throw new Error(error.message);
}

export async function upsertDiscount(db: SupabaseClient, discount: Discount, actor: string): Promise<Discount> {
  const { error } = await db.from("discounts").upsert({
    id: discount.id,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    description: discount.description,
    min_basket: discount.minBasket ?? null,
    categories: discount.categories ?? null,
    expires_at: discount.expiresAt ?? null,
    usage_limit: discount.usageLimit ?? null,
    used_count: discount.usedCount,
    used_emails: discount.usedEmails,
    active: discount.active,
    created_at: discount.createdAt,
  });
  if (error) throw new Error(error.message);
  await logAudit(db, actor, "saved discount", discount.code);
  return discount;
}

export async function deleteDiscount(db: SupabaseClient, id: string, actor: string) {
  const discounts = await listDiscounts(db);
  const discount = discounts.find((d) => d.id === id);
  await db.from("discounts").delete().eq("id", id);
  if (discount) await logAudit(db, actor, "deleted discount", discount.code);
}

// ---------------------------------------------------------------
// Leads & purchases
// ---------------------------------------------------------------

function toLead(row: Row): SellToUsLead {
  return {
    id: str(row.id),
    name: str(row.name),
    email: str(row.email),
    brand: str(row.brand),
    itemType: str(row.item_type),
    size: str(row.size),
    condition: str(row.condition),
    notes: row.notes ? str(row.notes) : undefined,
    offer: row.offer ? str(row.offer) : undefined,
    status: str(row.status) as SellToUsLead["status"],
    createdAt: str(row.created_at),
  };
}

export async function createLead(
  db: SupabaseClient,
  input: Omit<SellToUsLead, "id" | "status" | "createdAt">
): Promise<SellToUsLead> {
  const lead: SellToUsLead = {
    ...input,
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: "NEW",
    createdAt: new Date().toISOString(),
  };
  const { error } = await db.from("purchase_leads").insert({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    brand: lead.brand,
    item_type: lead.itemType,
    size: lead.size,
    condition: lead.condition,
    notes: lead.notes ?? null,
    offer: lead.offer ?? null,
    status: lead.status,
    created_at: lead.createdAt,
  });
  if (error) throw new Error(error.message);
  return lead;
}

export async function listLeads(db: SupabaseClient): Promise<SellToUsLead[]> {
  const { data, error } = await db
    .from("purchase_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toLead);
}

export async function updateLeadStatus(
  db: SupabaseClient,
  id: string,
  status: SellToUsLead["status"],
  offer?: string
): Promise<SellToUsLead | undefined> {
  const update: Row = { status };
  if (offer !== undefined) update.offer = offer;
  const { error } = await db.from("purchase_leads").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  const { data, error: fetchError } = await db
    .from("purchase_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  return data ? toLead(data as Row) : undefined;
}

function toPurchase(row: Row, items: Row[]): StockPurchase {
  return {
    id: str(row.id),
    sellerName: str(row.seller_name),
    sellerEmail: str(row.seller_email),
    amount: num(row.amount),
    status: str(row.status, "AGREED") as "AGREED" | "PAID",
    items: items.map((i) => ({
      sku: str(i.sku),
      name: str(i.name),
      brand: str(i.brand),
      cost: num(i.cost),
    })),
    notes: row.notes ? str(row.notes) : undefined,
    leadId: row.lead_id ? str(row.lead_id) : undefined,
    createdAt: str(row.created_at),
    paidAt: row.paid_at ? str(row.paid_at) : undefined,
  };
}

export async function createPurchase(
  db: SupabaseClient,
  input: Omit<StockPurchase, "id" | "createdAt">,
  actor: string
): Promise<StockPurchase> {
  const purchase: StockPurchase = {
    ...input,
    id: `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  const { error } = await db.from("stock_purchases").insert({
    id: purchase.id,
    seller_name: purchase.sellerName,
    seller_email: purchase.sellerEmail,
    amount: purchase.amount,
    status: purchase.status,
    notes: purchase.notes ?? null,
    lead_id: purchase.leadId ?? null,
    created_at: purchase.createdAt,
    paid_at: purchase.paidAt ?? null,
  });
  if (error) throw new Error(error.message);
  if (purchase.items.length) {
    const { error: itemsError } = await db.from("stock_purchase_items").insert(
      purchase.items.map((i) => ({
        purchase_id: purchase.id,
        sku: i.sku,
        name: i.name,
        brand: i.brand,
        cost: i.cost,
      }))
    );
    if (itemsError) throw new Error(itemsError.message);
  }
  await logAudit(db, actor, "recorded stock purchase", `${purchase.id} from ${purchase.sellerName}`, undefined, `£${purchase.amount.toFixed(2)}`);
  return purchase;
}

export async function listPurchases(db: SupabaseClient): Promise<StockPurchase[]> {
  const { data, error } = await db
    .from("stock_purchases")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => str(r.id));
  const { data: items, error: itemsError } = await db
    .from("stock_purchase_items")
    .select("*")
    .in("purchase_id", ids);
  if (itemsError) throw new Error(itemsError.message);
  return rows.map((row) =>
    toPurchase(
      row,
      (items ?? []).filter((i) => str(i.purchase_id) === str(row.id))
    )
  );
}

export async function markPurchasePaid(db: SupabaseClient, id: string, actor: string) {
  const purchases = await listPurchases(db);
  const purchase = purchases.find((p) => p.id === id);
  if (!purchase) return undefined;
  const { error } = await db
    .from("stock_purchases")
    .update({ status: "PAID", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(db, actor, "marked purchase paid", `${id} ${purchase.sellerName}`, undefined, `£${purchase.amount.toFixed(2)}`);
  return { ...purchase, status: "PAID" as const, paidAt: new Date().toISOString() };
}

// ---------------------------------------------------------------
// Marketing, content, telemetry, email, audit
// ---------------------------------------------------------------

export async function subscribeNewsletter(
  db: SupabaseClient,
  email: string,
  source: string
): Promise<NewsletterSubscriber> {
  const subscriber: NewsletterSubscriber = {
    email: email.toLowerCase(),
    source,
    consentedAt: new Date().toISOString(),
  };
  const { error } = await db.from("newsletter_subscribers").upsert(
    {
      email: subscriber.email,
      source: subscriber.source,
      consented_at: subscriber.consentedAt,
    },
    { onConflict: "email" }
  );
  if (error) throw new Error(error.message);
  return subscriber;
}

export async function listSubscribers(db: SupabaseClient): Promise<NewsletterSubscriber[]> {
  const { data, error } = await db
    .from("newsletter_subscribers")
    .select("*")
    .order("consented_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    email: str(r.email),
    source: str(r.source),
    consentedAt: str(r.consented_at),
  }));
}

export async function listPosts(db: SupabaseClient, includeUnpublished = false): Promise<JournalPost[]> {
  let q = db.from("journal_posts").select("*").order("published_at", { ascending: false });
  if (!includeUnpublished) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: str(r.id),
    slug: str(r.slug),
    title: str(r.title),
    excerpt: str(r.excerpt),
    body: Array.isArray(r.body) ? (r.body as string[]) : [],
    coverImage: r.cover_image ? str(r.cover_image) : undefined,
    published: Boolean(r.published),
    publishedAt: str(r.published_at),
  }));
}

export async function getPostBySlug(db: SupabaseClient, slug: string): Promise<JournalPost | undefined> {
  const { data, error } = await db
    .from("journal_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  const r = data as Row;
  return {
    id: str(r.id),
    slug: str(r.slug),
    title: str(r.title),
    excerpt: str(r.excerpt),
    body: Array.isArray(r.body) ? (r.body as string[]) : [],
    coverImage: r.cover_image ? str(r.cover_image) : undefined,
    published: Boolean(r.published),
    publishedAt: str(r.published_at),
  };
}

export async function upsertPost(db: SupabaseClient, post: JournalPost, actor: string): Promise<JournalPost> {
  const { error } = await db.from("journal_posts").upsert({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    cover_image: post.coverImage ?? null,
    published: post.published,
    published_at: post.publishedAt,
  });
  if (error) throw new Error(error.message);
  await logAudit(db, actor, "saved journal post", post.title);
  return post;
}

export async function deletePost(db: SupabaseClient, id: string, actor: string) {
  const posts = await listPosts(db, true);
  const post = posts.find((p) => p.id === id);
  await db.from("journal_posts").delete().eq("id", id);
  if (post) await logAudit(db, actor, "deleted journal post", post.title);
}

export async function logEmail(db: SupabaseClient, entry: Omit<EmailLogEntry, "id">) {
  const id = `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const { error } = await db.from("email_log").insert({
    id,
    recipient: entry.to,
    subject: entry.subject,
    template: entry.template,
    status: entry.status,
    provider: entry.provider,
    sent_at: entry.sentAt,
    preview: entry.preview,
  });
  if (error) throw new Error(error.message);
}

export async function listEmails(db: SupabaseClient, limit = 100): Promise<EmailLogEntry[]> {
  const { data, error } = await db
    .from("email_log")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: str(r.id),
    to: str(r.recipient),
    subject: str(r.subject),
    template: str(r.template),
    status: str(r.status) as "sent" | "logged",
    provider: str(r.provider),
    sentAt: str(r.sent_at),
    preview: str(r.preview),
  }));
}

export async function recordVisit(db: SupabaseClient) {
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await db.from("visits").select("count").eq("day", day).maybeSingle();
  const current = data ? num((data as Row).count) : 0;
  await db.from("visits").upsert({ day, count: current + 1 });
}

export async function getVisits(db: SupabaseClient) {
  const { data, error } = await db.from("visits").select("*");
  if (error) throw new Error(error.message);
  let total = 0;
  const byDay: Record<string, number> = {};
  for (const r of data ?? []) {
    const count = num((r as Row).count);
    total += count;
    byDay[str((r as Row).day)] = count;
  }
  return { total, byDay };
}

export async function listAuditLog(db: SupabaseClient, limit = 30): Promise<AuditEntry[]> {
  const { data, error } = await db
    .from("audit_logs")
    .select("*")
    .order("at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: str(r.id),
    actor: str(r.actor),
    action: str(r.action),
    detail: r.detail ? str(r.detail) : undefined,
    before: r.before ? str(r.before) : undefined,
    after: r.after ? str(r.after) : undefined,
    at: str(r.at),
  }));
}

export async function duplicateProduct(db: SupabaseClient, sku: string, actor: string): Promise<Product | undefined> {
  const source = await getProductBySku(db, sku);
  if (!source) return undefined;
  const newSku = await nextSku(db);
  const copy: Product = {
    ...structuredClone(source),
    sku: newSku,
    slug: `${newSku.toLowerCase()}-copy-${Date.now().toString(36)}`,
    status: "DRAFT",
    listedAt: new Date().toISOString(),
    soldAt: undefined,
    reservedUntil: undefined,
  };
  await upsertProduct(db, copy, actor, `${sku} -> ${newSku}`);
  return copy;
}

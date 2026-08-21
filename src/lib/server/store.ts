import fs from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuditEntry,
  Discount,
  EmailLogEntry,
  JournalPost,
  NewsletterSubscriber,
  Order,
  OrderStatus,
  Product,
  SellToUsLead,
  StockPurchase,
  StoreData,
} from "@/lib/types";
import { RESERVATION_MINUTES } from "@/lib/site";
import { estimateFees, PACKAGING_COST, seedImage } from "@/lib/utils";
import { buildSeedProducts } from "@/lib/server/seed";
import { getSupabase } from "@/lib/server/supabase";
import * as supabaseStore from "@/lib/server/supabase-store";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

export function persistenceEnabled() {
  return process.env.VERCEL !== "1" && process.env.DATA_STORE !== "memory";
}

function buildInitialData(): StoreData {
  // When SEED_DEMO=false (set this on Vercel for live) return empty collections.
  // Supabase is the source of truth in production — local seed is only for
  // dev and for vitest (which sets DATA_STORE=memory).
  if (process.env.SEED_DEMO === "false") {
    return {
      products: [],
      orders: [],
      auditLog: [],
      leads: [],
      orderCounter: 1000,
      discounts: [],
      emailLog: [],
      visits: { total: 0, byDay: {} },
      subscribers: [],
      purchases: [],
      posts: [],
    };
  }
  const products = buildSeedProducts();
  const now = Date.now();

  const orders: Order[] = [
    {
      id: "VC-0992",
      email: "example@customer.co.uk",
      name: "Amelia Wright",
      status: "DELIVERED",
      items: [
        {
          sku: "VC-000359",
          name: "Fleece Hoodie",
          brand: "Patagonia",
          size: "M",
          condition: "excellent",
          price: 55,
          image: products.find((p) => p.sku === "VC-000359")?.images[0].src ?? "",
        },
      ],
      subtotal: 55,
      delivery: 0,
      total: 55,
      channel: "website",
      paymentProvider: "demo",
      address: {
        line1: "14 Elm Grove",
        city: "Leeds",
        postcode: "LS6 2RT",
        country: "United Kingdom",
      },
      carrier: "Royal Mail Tracked 48",
      tracking: "RM482910376GB",
      createdAt: "2026-07-18T12:40:00Z",
      updatedAt: "2026-07-22T09:10:00Z",
    },
    {
      id: "VC-1048",
      email: "henry@example.com",
      name: "Henry Smith",
      status: "DISPATCHED",
      items: [
        {
          sku: "VC-000365",
          name: "Arctic Parka",
          brand: "The North Face",
          size: "M",
          condition: "excellent",
          price: 110,
          image: products.find((p) => p.sku === "VC-000365")?.images[0].src ?? "",
        },
      ],
      subtotal: 110,
      delivery: 0,
      total: 110,
      channel: "website",
      paymentProvider: "demo",
      address: {
        line1: "2 Wharf Street",
        city: "Manchester",
        postcode: "M1 4AL",
        country: "United Kingdom",
      },
      carrier: "Royal Mail Tracked 48",
      tracking: "RM501248092GB",
      createdAt: "2026-08-14T18:20:00Z",
      updatedAt: "2026-08-16T10:00:00Z",
    },
    {
      id: "VC-1052",
      email: "buyer@example.co.uk",
      name: "Grace Okafor",
      status: "PAID",
      items: [
        {
          sku: "VC-000354",
          name: "Denim Jacket",
          brand: "Levi's",
          size: "L",
          condition: "good",
          price: 40,
          image: products.find((p) => p.sku === "VC-000354")?.images[0].src ?? "",
        },
        {
          sku: "VC-000434",
          name: "Logo Beanie",
          brand: "Carhartt",
          size: "One Size",
          condition: "new_without_tags",
          price: 12,
          image: products.find((p) => p.sku === "VC-000434")?.images[0].src ?? "",
        },
      ],
      subtotal: 52,
      delivery: 0,
      total: 52,
      channel: "depop",
      paymentProvider: "demo",
      address: {
        line1: "88 Queens Road",
        city: "Bristol",
        postcode: "BS8 1QU",
        country: "United Kingdom",
      },
      createdAt: "2026-08-16T11:05:00Z",
      updatedAt: "2026-08-16T11:05:00Z",
    },
    {
      id: "VC-1055",
      email: "shopper@example.net",
      name: "Tom Bradley",
      status: "READY_TO_DISPATCH",
      items: [
        {
          sku: "VC-000362",
          name: "Puffer Jacket",
          brand: "The North Face",
          size: "S",
          condition: "very_good",
          price: 78,
          image: products.find((p) => p.sku === "VC-000362")?.images[0].src ?? "",
        },
      ],
      subtotal: 78,
      delivery: 0,
      total: 78,
      channel: "vinted",
      paymentProvider: "demo",
      address: {
        line1: "31 Park Road",
        city: "Sheffield",
        postcode: "S2 4NX",
        country: "United Kingdom",
      },
      createdAt: "2026-08-16T14:30:00Z",
      updatedAt: "2026-08-16T15:00:00Z",
    },
  ];

  const auditLog: AuditEntry[] = [
    {
      id: "aud-1",
      actor: "Oliver",
      action: "changed price",
      detail: "VC-000381",
      before: "£64.00",
      after: "£52.00",
      at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: "aud-2",
      actor: "Henry",
      action: "refunded order",
      detail: "VC-1048",
      before: "£64.00",
      at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "aud-3",
      actor: "Henry",
      action: "marked dispatched",
      detail: "VC-1048",
      at: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: "aud-4",
      actor: "Henry",
      action: "listed product",
      detail: "VC-000412 Supreme Box Logo Hoodie",
      at: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
    },
  ];

  const leads: SellToUsLead[] = [
    {
      id: "lead-1",
      name: "Sarah Jenkins",
      email: "sarah.j@example.com",
      brand: "Carhartt",
      itemType: "Jacket",
      size: "M",
      condition: "Good",
      notes: "Detroit jacket from around 2019, hoping for £40ish.",
      status: "NEW",
      createdAt: "2026-08-16T08:12:00Z",
    },
    {
      id: "lead-2",
      name: "Marcus Reid",
      email: "marcus.r@example.com",
      brand: "Nike",
      itemType: "Footwear",
      size: "UK 10",
      condition: "Very good",
      notes: "Two pairs of AF1s, one white one black.",
      status: "REVIEWING",
      createdAt: "2026-08-15T16:40:00Z",
    },
  ];

  const discounts: Discount[] = [
    {
      id: "disc-1",
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      description: "First-order welcome code",
      minBasket: 30,
      usageLimit: 200,
      usedCount: 0,
      usedEmails: [],
      active: true,
      createdAt: "2026-08-01T09:00:00Z",
    },
    {
      id: "disc-2",
      code: "JACKETS15",
      type: "percentage",
      value: 15,
      description: "15% off jackets",
      categories: ["jackets"],
      expiresAt: "2026-12-31T23:59:59Z",
      usageLimit: 100,
      usedCount: 0,
      usedEmails: [],
      active: true,
      createdAt: "2026-08-05T09:00:00Z",
    },
    {
      id: "disc-3",
      code: "FIVEROFF",
      type: "fixed",
      value: 5,
      description: "£5 off orders over £40",
      minBasket: 40,
      usageLimit: 50,
      usedCount: 3,
      usedEmails: ["example@customer.co.uk", "buyer@example.co.uk", "henry@example.com"],
      active: true,
      createdAt: "2026-07-20T09:00:00Z",
    },
    {
      id: "disc-4",
      code: "FREESHIP",
      type: "free_delivery",
      value: 0,
      description: "Free standard delivery",
      usageLimit: 150,
      usedCount: 0,
      usedEmails: [],
      active: true,
      createdAt: "2026-08-10T09:00:00Z",
    },
  ];

  const emailLog: EmailLogEntry[] = [
    {
      id: "email-1",
      to: "example@customer.co.uk",
      subject: "Your Vicarious order VC-0992",
      template: "order-confirmed",
      status: "sent",
      provider: "seed",
      sentAt: "2026-07-18T12:40:10Z",
      preview: "Thanks Amelia — order VC-0992 is confirmed.",
    },
    {
      id: "email-2",
      to: "henry@example.com",
      subject: "Your Vicarious order VC-1048",
      template: "order-confirmed",
      status: "sent",
      provider: "seed",
      sentAt: "2026-08-14T18:20:10Z",
      preview: "Thanks Henry — order VC-1048 is confirmed.",
    },
  ];

  const subscribers: NewsletterSubscriber[] = [
    {
      email: "amelia@example.co.uk",
      source: "seed",
      consentedAt: "2026-08-10T09:00:00Z",
    },
    {
      email: "toby@example.co.uk",
      source: "seed",
      consentedAt: "2026-08-12T18:30:00Z",
    },
  ];

  const purchases: StockPurchase[] = [
    {
      id: "pur-1",
      sellerName: "Sarah Jenkins",
      sellerEmail: "sarah.j@example.com",
      amount: 18,
      status: "PAID",
      items: [
        {
          sku: "VC-000381",
          name: "Detroit Jacket",
          brand: "Carhartt",
          cost: 18,
        },
      ],
      notes: "Carhartt Detroit jacket, collected in person.",
      createdAt: "2026-07-28T14:00:00Z",
      paidAt: "2026-07-28T14:10:00Z",
    },
    {
      id: "pur-2",
      sellerName: "Marcus Reid",
      sellerEmail: "marcus.r@example.com",
      amount: 35,
      status: "AGREED",
      items: [
        {
          sku: "VC-000363",
          name: "Beta LT Shell",
          brand: "Arc'teryx",
          cost: 85,
        },
      ],
      notes: "Agreed £35 for the shell plus a beanie.",
      createdAt: "2026-08-15T17:00:00Z",
    },
  ];

  const posts: JournalPost[] = [
    {
      id: "post-1",
      slug: "how-we-grade-condition",
      title: "How we grade condition",
      excerpt:
        "The six-grade scale behind every listing, and why we photograph every defect.",
      coverImage: seedImage("vc-journal-1", 1200, 750),
      published: true,
      publishedAt: "2026-08-10T09:00:00Z",
      body: [
        "Every piece that comes into Vicarious gets graded on the same six-point scale before it ever goes near the site. The grade is a summary, not a substitute for disclosure — so alongside the grade, every known defect gets its own photograph and a line in the listing.",
        "New with Tags means exactly that: unused, tags attached. New without Tags is the same piece minus the card. From Excellent downwards we're describing wear: minimal signs, light signs with no significant defects, noticeable wear with everything disclosed, and Fair — visible wear that's still saleable.",
        "The honest version: a grade only gets you so far. The real detail lives in the measurements and the photographs. If we wouldn't wear it, it doesn't go up.",
      ],
    },
    {
      id: "post-2",
      slug: "why-one-of-one-is-the-point",
      title: "Why one-of-one is the point",
      excerpt:
        "Most of what we sell will never restock. That's not a bug — it's the whole idea.",
      published: true,
      publishedAt: "2026-08-03T09:00:00Z",
      body: [
        "When a piece on the site sells, that's usually it. No size runs, no restock, no 'more coming soon'. It's a strange thing to build a shop around — and it's exactly why we did.",
        "One-of-one stock changes how you shop. There's no waiting for the right size to come back; there's just a decision about the one in front of you. It makes every drop feel like what it is: a small pile of good clothes that will not be here tomorrow.",
        "It also keeps us honest. Nothing stays listed that we wouldn't stand behind, because there's no volume to hide behind either.",
      ],
    },
    {
      id: "post-3",
      slug: "what-makes-a-piece-a-vicarious-pick",
      title: "What makes a piece a Vicarious Pick",
      excerpt:
        "The short answer: we'd fight over it. The longer answer involves three checks.",
      published: true,
      publishedAt: "2026-07-27T09:00:00Z",
      body: [
        "Every so often a piece lands that everyone in the studio wants to keep. When that happens twice in a row, it becomes a Vicarious Pick.",
        "The checks are simple: does it have a story worth telling, is the condition genuinely good, and would we pay our own price for it? Two out of three isn't enough — all three, every time.",
        "Picks get the first slot in our editorial edits and usually don't last long. You'll find them tagged on their product pages, and collected under the Picks edit in the shop.",
      ],
    },
  ];

  return {
    products,
    orders,
    auditLog,
    leads,
    orderCounter: 1056,
    discounts,
    emailLog,
    visits: { total: 1247, byDay: {} },
    subscribers,
    purchases,
    posts,
  };
}

let cache: StoreData | null = null;

function normalize(data: Partial<StoreData>): StoreData {
  return {
    products: data.products ?? [],
    orders: (data.orders ?? []).map((o) => ({
      ...o,
      channel: o.channel ?? "website",
      paymentProvider: o.paymentProvider ?? "demo",
    })),
    auditLog: data.auditLog ?? [],
    leads: data.leads ?? [],
    orderCounter: data.orderCounter ?? 1056,
    discounts: data.discounts ?? [],
    emailLog: data.emailLog ?? [],
    visits: data.visits ?? { total: 0, byDay: {} },
    subscribers: data.subscribers ?? [],
    purchases: data.purchases ?? [],
    posts: data.posts ?? [],
  };
}

function load(): StoreData {
  if (persistenceEnabled()) {
    try {
      if (fs.existsSync(DATA_FILE)) {
        cache = normalize(
          JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Partial<StoreData>
        );
        return cache;
      }
    } catch {
      // corrupt or unreadable file — fall through to fresh seed
    }
  }
  if (!cache) {
    cache = buildInitialData();
    save();
  }
  return cache;
}

function save() {
  if (!cache || !persistenceEnabled()) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // read-only filesystem (e.g. Vercel serverless) — keep state in memory
  }
}

async function localExpireReservations(now = Date.now()) {
  const data = load();
  let changed = false;
  for (const product of data.products) {
    if (
      product.status === "RESERVED" &&
      product.reservedUntil &&
      new Date(product.reservedUntil).getTime() < now
    ) {
      product.status = "AVAILABLE";
      product.reservedUntil = undefined;
      changed = true;
    }
  }
  if (changed) save();
}

async function localListProducts(){
  await localExpireReservations();
  return load().products;
}

async function localGetProductBySku(sku: string){
  await localExpireReservations();
  return load().products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
}

async function localGetProductBySlug(slug: string){
  await localExpireReservations();
  return load().products.find((p) => p.slug === slug);
}

async function localUpsertProduct(
  product: Product,
  actor: string,
  detail: string
){
  const data = load();
  const index = data.products.findIndex((p) => p.sku === product.sku);
  if (index >= 0) {
    data.products[index] = product;
  } else {
    data.products.push(product);
  }
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: index >= 0 ? "updated product" : "created product",
    detail,
    at: new Date().toISOString(),
  });
  save();
  return product;
}

async function localSetProductStatus(sku: string, status: Product["status"]) {
  const data = load();
  const product = data.products.find((p) => p.sku === sku);
  if (!product) return;
  product.status = status;
  if (status === "SOLD") product.soldAt = new Date().toISOString();
  if (status === "AVAILABLE") product.reservedUntil = undefined;
  save();
}

async function localNextSku(){
  const data = load();
  const max = data.products.reduce((m, p) => {
    const n = Number.parseInt(p.sku.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `VC-${String(max + 1).padStart(6, "0")}`;
}

async function localDuplicateProduct(sku: string, actor: string) {
  const data = load();
  const source = data.products.find((p) => p.sku === sku);
  if (!source) return undefined;
  const newSku = await localNextSku();
  const copy: Product = {
    ...structuredClone(source),
    sku: newSku,
    slug: `${newSku}-copy-${Date.now().toString(36)}`,
    status: "DRAFT",
    listedAt: new Date().toISOString(),
    soldAt: undefined,
    reservedUntil: undefined,
  };
  data.products.push(copy);
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: "duplicated product",
    detail: `${sku} -> ${copy.sku}`,
    at: new Date().toISOString(),
  });
  save();
  return copy;
}

async function localReserveProducts(skus: string[]) {
  await localExpireReservations();
  const data = load();
  const until = new Date(
    Date.now() + RESERVATION_MINUTES * 60 * 1000
  ).toISOString();
  const ok: string[] = [];
  const gone: string[] = [];
  for (const sku of skus) {
    const product = data.products.find((p) => p.sku === sku);
    if (!product || product.status !== "AVAILABLE") {
      gone.push(sku);
      continue;
    }
    product.status = "RESERVED";
    product.reservedUntil = until;
    ok.push(sku);
  }
  if (ok.length) save();
  return { ok, gone };
}

async function localReleaseProducts(skus: string[]) {
  const data = load();
  let changed = false;
  for (const sku of skus) {
    const product = data.products.find((p) => p.sku === sku);
    if (product && product.status === "RESERVED") {
      product.status = "AVAILABLE";
      product.reservedUntil = undefined;
      changed = true;
    }
  }
  if (changed) save();
}

async function localMarkSoldByOrder(skus: string[]) {
  const data = load();
  for (const sku of skus) {
    const product = data.products.find((p) => p.sku === sku);
    if (!product) continue;
    product.status = "SOLD";
    product.soldAt = new Date().toISOString();
  }
  save();
}

export interface CreateOrderInput {
  email: string;
  name: string;
  items: Array<{ sku: string }>;
  deliveryCost: number;
  address: Order["address"];
  discountCode?: string;
  channel?: Order["channel"];
  status?: OrderStatus;
  paymentProvider?: Order["paymentProvider"];
  checkoutUrl?: string;
}

async function localCreateOrder(input: CreateOrderInput) {
  await localExpireReservations();
  const data = load();
  const items = [];
  const gone: string[] = [];

  for (const line of input.items) {
    const product = data.products.find((p) => p.sku === line.sku);
    if (
      !product ||
      (product.status !== "AVAILABLE" && product.status !== "RESERVED")
    ) {
      gone.push(line.sku);
      continue;
    }
    items.push({
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      size: product.size,
      condition: product.condition,
      price: product.price,
      image: product.images[0]?.src ?? "",
    });
  }

  if (gone.length) return { gone };

  const subtotal = Math.round(
    items.reduce((sum, i) => sum + i.price, 0) * 100
  ) / 100;

  let discount: Order["discount"];
  if (input.discountCode) {
    const result = await localEvaluateDiscount(input.discountCode, {
      subtotal,
      email: input.email,
      itemSkus: items.map((i) => i.sku),
    });
    if (result.ok && result.discount) {
      discount = result.discount;
    }
  }

  const discountAmount = Math.round((discount?.amount ?? 0) * 100) / 100;
  const delivery =
    discount?.type === "free_delivery"
      ? 0
      : Math.round(input.deliveryCost * 100) / 100;
  const total = Math.max(0, subtotal - discountAmount) + delivery;

  const status: OrderStatus = input.status ?? "PAID";
  const order: Order = {
    id: `VC-${data.orderCounter}`,
    email: input.email,
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
    checkoutUrl: input.checkoutUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.orders.unshift(order);
  data.orderCounter += 1;

  if (status === "PAID") {
    await localMarkSoldByOrder(items.map((i) => i.sku));
  } else if (status === "PENDING_PAYMENT") {
    const until = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();
    for (const { sku } of items) {
      const product = data.products.find((p) => p.sku === sku);
      if (product && product.status === "AVAILABLE") {
        product.status = "RESERVED";
        product.reservedUntil = until;
      }
    }
    save();
  }

  if (input.discountCode && discount) {
    await localRecordDiscountUsage(input.discountCode, input.email);
  }

  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor: input.name,
    action: "placed order",
    detail: `${order.id} - ${items.length} item(s) via ${order.channel}`,
    after: `£${order.total.toFixed(2)}`,
    at: new Date().toISOString(),
  });
  save();
  return { order };
}

async function localMarkOrderPaid(id: string){
  const data = load();
  const order = data.orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
  if (!order) return undefined;
  if (order.status === "PAID") return order;
  order.status = "PAID";
  order.updatedAt = new Date().toISOString();
  await localMarkSoldByOrder(order.items.map((i) => i.sku));
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor: order.name,
    action: "payment captured",
    detail: order.id,
    after: `£${order.total.toFixed(2)}`,
    at: new Date().toISOString(),
  });
  save();
  return order;
}

async function localCancelPendingOrdersForEmail(email: string) {
  const data = load();
  let changed = false;
  const skusToRelease: string[] = [];
  for (const order of data.orders) {
    if (
      order.status === "PENDING_PAYMENT" &&
      order.email.toLowerCase() === email.toLowerCase()
    ) {
      order.status = "CANCELLED";
      order.updatedAt = new Date().toISOString();
      for (const item of order.items) skusToRelease.push(item.sku);
      changed = true;
    }
  }
  if (changed) {
    for (const sku of skusToRelease) {
      const product = data.products.find((p) => p.sku === sku);
      if (product && product.status === "RESERVED") {
        product.status = "AVAILABLE";
        product.reservedUntil = undefined;
      }
    }
    save();
  }
}

async function localSetOrderPayment(
  id: string,
  paymentIntentId: string,
  checkoutUrl?: string
) {
  const data = load();
  const order = data.orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
  if (!order) return undefined;
  order.paymentIntentId = paymentIntentId;
  if (checkoutUrl) order.checkoutUrl = checkoutUrl;
  order.updatedAt = new Date().toISOString();
  save();
  return order;
}

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

async function localEvaluateDiscount(
  code: string,
  context: DiscountContext
){
  const data = load();
  const discount = data.discounts.find(
    (d) => d.code.toLowerCase() === code.trim().toLowerCase()
  );
  if (!discount || !discount.active) {
    return { ok: false, error: "That code doesn't exist." };
  }
  if (discount.expiresAt && new Date(discount.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: "That code has expired." };
  }
  if (
    discount.usageLimit !== undefined &&
    discount.usedCount >= discount.usageLimit
  ) {
    return { ok: false, error: "That code has reached its usage limit." };
  }
  if (discount.usedEmails.includes(context.email.toLowerCase())) {
    return { ok: false, error: "That code has already been used on this email." };
  }
  if (
    discount.minBasket !== undefined &&
    context.subtotal < discount.minBasket
  ) {
    return {
      ok: false,
      error: `That code needs a basket of at least £${discount.minBasket.toFixed(0)}.`,
    };
  }
  if (discount.categories?.length) {
    const data2 = load();
    const hasEligible = context.itemSkus.some((sku) => {
      const product = data2.products.find((p) => p.sku === sku);
      return product && discount.categories!.includes(product.category);
    });
    if (!hasEligible) {
      return { ok: false, error: "That code doesn't apply to the pieces in your bag." };
    }
  }

  let amount = 0;
  const description = discount.description;
  if (discount.type === "percentage") {
    amount = Math.round(context.subtotal * discount.value) / 100;
  } else if (discount.type === "fixed") {
    amount = Math.min(discount.value, context.subtotal);
  }
  // free_delivery: amount 0, delivery handled at order creation

  return {
    ok: true,
    discount: {
      code: discount.code,
      description,
      amount,
      type: discount.type,
    },
  };
}

async function localRecordDiscountUsage(code: string, email: string) {
  const data = load();
  const discount = data.discounts.find(
    (d) => d.code.toLowerCase() === code.toLowerCase()
  );
  if (!discount) return;
  discount.usedCount += 1;
  if (!discount.usedEmails.includes(email.toLowerCase())) {
    discount.usedEmails.push(email.toLowerCase());
  }
  save();
}

async function localListDiscounts(){
  return load().discounts;
}

async function localUpsertDiscount(
  discount: Discount,
  actor: string
){
  const data = load();
  const index = data.discounts.findIndex((d) => d.id === discount.id);
  if (index >= 0) data.discounts[index] = discount;
  else data.discounts.push(discount);
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: index >= 0 ? "updated discount" : "created discount",
    detail: discount.code,
    at: new Date().toISOString(),
  });
  save();
  return discount;
}

async function localDeleteDiscount(id: string, actor: string) {
  const data = load();
  const discount = data.discounts.find((d) => d.id === id);
  if (!discount) return;
  data.discounts = data.discounts.filter((d) => d.id !== id);
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: "deleted discount",
    detail: discount.code,
    at: new Date().toISOString(),
  });
  save();
}

async function localLogEmail(entry: Omit<EmailLogEntry, "id">) {
  const data = load();
  data.emailLog.unshift({ ...entry, id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}` });
  data.emailLog = data.emailLog.slice(0, 200);
  save();
}

async function localListEmails(limit = 100){
  return load().emailLog.slice(0, limit);
}

async function localRecordVisit() {
  const data = load();
  const day = new Date().toISOString().slice(0, 10);
  data.visits.total += 1;
  data.visits.byDay[day] = (data.visits.byDay[day] ?? 0) + 1;
  save();
}

async function localGetVisits() {
  const data = load();
  return {
    total: data.visits.total,
    byDay: { ...data.visits.byDay },
  };
}

async function localGetOrder(id: string){
  return load().orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
}

async function localListOrders(email?: string){
  const orders = load().orders;
  if (email) return orders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
  return orders;
}

async function localUpdateOrderStatus(id: string, status: OrderStatus, actor: string) {
  const data = load();
  const order = data.orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
  if (!order) return undefined;
  const before = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: "updated order",
    detail: order.id,
    before,
    after: status,
    at: new Date().toISOString(),
  });
  save();
  return order;
}

async function localSetOrderTracking(
  id: string,
  carrier: string,
  tracking: string,
  actor: string
) {
  const data = load();
  const order = data.orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
  if (!order) return undefined;
  order.carrier = carrier;
  order.tracking = tracking;
  order.updatedAt = new Date().toISOString();
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: "set tracking",
    detail: `${order.id} ${tracking}`,
    at: new Date().toISOString(),
  });
  save();
  return order;
}

async function localCreateLead(
  input: Omit<SellToUsLead, "id" | "status" | "createdAt">
){
  const data = load();
  const lead: SellToUsLead = {
    ...input,
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: "NEW",
    createdAt: new Date().toISOString(),
  };
  data.leads.unshift(lead);
  save();
  return lead;
}

async function localListLeads(){
  return load().leads;
}

async function localUpdateLeadStatus(
  id: string,
  status: SellToUsLead["status"],
  offer?: string
) {
  const data = load();
  const lead = data.leads.find((l) => l.id === id);
  if (!lead) return undefined;
  lead.status = status;
  if (offer !== undefined) lead.offer = offer;
  save();
  return lead;
}

async function localListAuditLog(limit = 30){
  return load().auditLog.slice(0, limit);
}

function localProductEconomics(product: Product) {
  const price = product.price;
  const cost = product.cost ?? 0;
  const fees = estimateFees(price);
  const packaging = PACKAGING_COST;
  const profit = price - cost - fees - packaging;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  return { price, cost, fees, packaging, profit, margin };
}

async function localSubscribeNewsletter(
  email: string,
  source: string
){
  const data = load();
  const existing = data.subscribers.find(
    (s) => s.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    existing.consentedAt = new Date().toISOString();
    existing.source = source;
    save();
    return existing;
  }
  const subscriber: NewsletterSubscriber = {
    email,
    source,
    consentedAt: new Date().toISOString(),
  };
  data.subscribers.unshift(subscriber);
  save();
  return subscriber;
}

async function localListSubscribers(){
  return load().subscribers;
}

async function localCreatePurchase(
  input: Omit<StockPurchase, "id" | "createdAt">,
  actor: string
){
  const data = load();
  const purchase: StockPurchase = {
    ...input,
    id: `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  data.purchases.unshift(purchase);
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: "recorded stock purchase",
    detail: `${purchase.id} from ${purchase.sellerName}`,
    after: `£${purchase.amount.toFixed(2)}`,
    at: new Date().toISOString(),
  });
  save();
  return purchase;
}

async function localListPurchases(){
  return load().purchases;
}

async function localMarkPurchasePaid(id: string, actor: string) {
  const data = load();
  const purchase = data.purchases.find((p) => p.id === id);
  if (!purchase) return undefined;
  purchase.status = "PAID";
  purchase.paidAt = new Date().toISOString();
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: "marked purchase paid",
    detail: `${purchase.id} ${purchase.sellerName}`,
    after: `£${purchase.amount.toFixed(2)}`,
    at: new Date().toISOString(),
  });
  save();
  return purchase;
}

async function localListPosts(includeUnpublished = false){
  return load()
    .posts.filter((p) => includeUnpublished || p.published)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

async function localGetPostBySlug(slug: string){
  return load().posts.find((p) => p.slug === slug && p.published);
}

async function localUpsertPost(post: JournalPost, actor: string){
  const data = load();
  const index = data.posts.findIndex((p) => p.id === post.id);
  if (index >= 0) data.posts[index] = post;
  else data.posts.push(post);
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: index >= 0 ? "updated journal post" : "created journal post",
    detail: post.title,
    at: new Date().toISOString(),
  });
  save();
  return post;
}

async function localDeletePost(id: string, actor: string) {
  const data = load();
  const post = data.posts.find((p) => p.id === id);
  if (!post) return;
  data.posts = data.posts.filter((p) => p.id !== id);
  data.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    action: "deleted journal post",
    detail: post.title,
    at: new Date().toISOString(),
  });
  save();
}

function localResetStoreForTests() {
  cache = null;
}
// ---------------------------------------------------------------
// Public API — dispatches to Supabase when configured, otherwise
// the local file/memory backend.
// ---------------------------------------------------------------

let supabaseDisabled = false;

function disableSupabase(scope: string, error: unknown) {
  supabaseDisabled = true;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(
    `[store] Supabase failed in ${scope}; falling back to local data: ${message}`
  );
}

async function withStoreFallback<T>(
  scope: string,
  db: SupabaseClient | null,
  supabaseAction: ((db: SupabaseClient) => Promise<unknown>) | null,
  localAction: () => Promise<T>
): Promise<T> {
  if (!supabaseDisabled && db && supabaseAction) {
    try {
      return (await supabaseAction(db)) as T;
    } catch (error) {
      disableSupabase(scope, error);
    }
  }
  return localAction();
}

export async function expireReservations() {
  const db = getSupabase();
  return withStoreFallback("expireReservations", db, (client) => supabaseStore.expireReservations(client), localExpireReservations);
}

export async function listProducts(): Promise<Product[]> {
  const db = getSupabase();
  return withStoreFallback("listProducts", db, (client) => supabaseStore.listProducts(client), localListProducts);
}

export async function getProductBySku(sku: string): Promise<Product | undefined> {
  const db = getSupabase();
  return withStoreFallback("getProductBySku", db, (client) => supabaseStore.getProductBySku(client, sku), () => localGetProductBySku(sku));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const db = getSupabase();
  return withStoreFallback("getProductBySlug", db, (client) => supabaseStore.getProductBySlug(client, slug), () => localGetProductBySlug(slug));
}

export async function upsertProduct(product: Product, actor: string, detail: string): Promise<Product> {
  const db = getSupabase();
  return withStoreFallback("upsertProduct", db, (client) => supabaseStore.upsertProduct(client, product, actor, detail), () => localUpsertProduct(product, actor, detail));
}

export async function setProductStatus(sku: string, status: Product["status"]) {
  const db = getSupabase();
  return withStoreFallback("setProductStatus", db, (client) => supabaseStore.setProductStatus(client, sku, status), () => localSetProductStatus(sku, status));
}

export async function nextSku(): Promise<string> {
  const db = getSupabase();
  return withStoreFallback("nextSku", db, (client) => supabaseStore.nextSku(client), localNextSku);
}

export async function duplicateProduct(sku: string, actor: string): Promise<Product | undefined> {
  const db = getSupabase();
  return withStoreFallback("duplicateProduct", db, (client) => supabaseStore.duplicateProduct(client, sku, actor), () => localDuplicateProduct(sku, actor));
}

export async function reserveProducts(skus: string[]): Promise<{ ok: string[]; gone: string[] }> {
  const db = getSupabase();
  return withStoreFallback("reserveProducts", db, (client) => supabaseStore.reserveProducts(client, skus), () => localReserveProducts(skus));
}

export async function releaseProducts(skus: string[]) {
  const db = getSupabase();
  return withStoreFallback("releaseProducts", db, (client) => supabaseStore.releaseProducts(client, skus), () => localReleaseProducts(skus));
}

export async function markSoldByOrder(skus: string[]) {
  const db = getSupabase();
  return withStoreFallback("markSoldByOrder", db, (client) => supabaseStore.markSoldByOrder(client, skus), () => localMarkSoldByOrder(skus));
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ order?: Order; gone?: string[]; error?: string }> {
  const db = getSupabase();
  return withStoreFallback("createOrder", db, (client) => supabaseStore.createOrder(client, input), () => localCreateOrder(input));
}

export async function markOrderPaid(id: string): Promise<Order | undefined> {
  const db = getSupabase();
  return withStoreFallback("markOrderPaid", db, (client) => supabaseStore.markOrderPaid(client, id), () => localMarkOrderPaid(id));
}

export async function setOrderPayment(id: string, paymentIntentId: string, checkoutUrl?: string) {
  const db = getSupabase();
  return withStoreFallback("setOrderPayment", db, (client) => supabaseStore.setOrderPayment(client, id, paymentIntentId), () => localSetOrderPayment(id, paymentIntentId, checkoutUrl));
}

export async function cancelPendingOrdersForEmail(email: string) {
  const db = getSupabase();
  return withStoreFallback("cancelPendingOrdersForEmail", db, (client) => supabaseStore.cancelPendingOrdersForEmail(client, email), () => localCancelPendingOrdersForEmail(email));
}

export async function evaluateDiscount(
  code: string,
  context: DiscountContext
): Promise<DiscountResult> {
  const db = getSupabase();
  return withStoreFallback("evaluateDiscount", db, (client) => supabaseStore.evaluateDiscount(client, code, context), () => localEvaluateDiscount(code, context));
}

export async function recordDiscountUsage(code: string, email: string) {
  const db = getSupabase();
  return withStoreFallback("recordDiscountUsage", db, (client) => supabaseStore.recordDiscountUsage(client, code, email), () => localRecordDiscountUsage(code, email));
}

export async function listDiscounts(): Promise<Discount[]> {
  const db = getSupabase();
  return withStoreFallback("listDiscounts", db, (client) => supabaseStore.listDiscounts(client), localListDiscounts);
}

export async function upsertDiscount(discount: Discount, actor: string): Promise<Discount> {
  const db = getSupabase();
  return withStoreFallback("upsertDiscount", db, (client) => supabaseStore.upsertDiscount(client, discount, actor), () => localUpsertDiscount(discount, actor));
}

export async function deleteDiscount(id: string, actor: string) {
  const db = getSupabase();
  return withStoreFallback("deleteDiscount", db, (client) => supabaseStore.deleteDiscount(client, id, actor), () => localDeleteDiscount(id, actor));
}

export async function logEmail(entry: Omit<EmailLogEntry, "id">) {
  const db = getSupabase();
  return withStoreFallback("logEmail", db, (client) => supabaseStore.logEmail(client, entry), () => localLogEmail(entry));
}

export async function listEmails(limit = 100): Promise<EmailLogEntry[]> {
  const db = getSupabase();
  return withStoreFallback("listEmails", db, (client) => supabaseStore.listEmails(client, limit), () => localListEmails(limit));
}

export async function recordVisit() {
  const db = getSupabase();
  return withStoreFallback("recordVisit", db, (client) => supabaseStore.recordVisit(client), localRecordVisit);
}

export async function getVisits() {
  const db = getSupabase();
  return withStoreFallback("getVisits", db, (client) => supabaseStore.getVisits(client), localGetVisits);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const db = getSupabase();
  return withStoreFallback("getOrder", db, (client) => supabaseStore.getOrder(client, id), () => localGetOrder(id));
}

export async function listOrders(email?: string): Promise<Order[]> {
  const db = getSupabase();
  return withStoreFallback("listOrders", db, (client) => supabaseStore.listOrders(client, email), () => localListOrders(email));
}

export async function updateOrderStatus(id: string, status: OrderStatus, actor: string) {
  const db = getSupabase();
  return withStoreFallback("updateOrderStatus", db, (client) => supabaseStore.updateOrderStatus(client, id, status, actor), () => localUpdateOrderStatus(id, status, actor));
}

export async function setOrderTracking(id: string, carrier: string, tracking: string, actor: string) {
  const db = getSupabase();
  return withStoreFallback("setOrderTracking", db, (client) => supabaseStore.setOrderTracking(client, id, carrier, tracking, actor), () => localSetOrderTracking(id, carrier, tracking, actor));
}

export async function createLead(
  input: Omit<SellToUsLead, "id" | "status" | "createdAt">
): Promise<SellToUsLead> {
  const db = getSupabase();
  return withStoreFallback("createLead", db, (client) => supabaseStore.createLead(client, input), () => localCreateLead(input));
}

export async function listLeads(): Promise<SellToUsLead[]> {
  const db = getSupabase();
  return withStoreFallback("listLeads", db, (client) => supabaseStore.listLeads(client), localListLeads);
}

export async function updateLeadStatus(
  id: string,
  status: SellToUsLead["status"],
  offer?: string
): Promise<SellToUsLead | undefined> {
  const db = getSupabase();
  return withStoreFallback("updateLeadStatus", db, (client) => supabaseStore.updateLeadStatus(client, id, status, offer), () => localUpdateLeadStatus(id, status, offer));
}

export async function listAuditLog(limit = 30): Promise<AuditEntry[]> {
  const db = getSupabase();
  return withStoreFallback("listAuditLog", db, (client) => supabaseStore.listAuditLog(client, limit), () => localListAuditLog(limit));
}

export function productEconomics(product: Product) {
  return localProductEconomics(product);
}

export async function subscribeNewsletter(email: string, source: string): Promise<NewsletterSubscriber> {
  const db = getSupabase();
  return withStoreFallback("subscribeNewsletter", db, (client) => supabaseStore.subscribeNewsletter(client, email, source), () => localSubscribeNewsletter(email, source));
}

export async function listSubscribers(): Promise<NewsletterSubscriber[]> {
  const db = getSupabase();
  return withStoreFallback("listSubscribers", db, (client) => supabaseStore.listSubscribers(client), localListSubscribers);
}

export async function createPurchase(
  input: Omit<StockPurchase, "id" | "createdAt">,
  actor: string
): Promise<StockPurchase> {
  const db = getSupabase();
  return withStoreFallback("createPurchase", db, (client) => supabaseStore.createPurchase(client, input, actor), () => localCreatePurchase(input, actor));
}

export async function listPurchases(): Promise<StockPurchase[]> {
  const db = getSupabase();
  return withStoreFallback("listPurchases", db, (client) => supabaseStore.listPurchases(client), localListPurchases);
}

export async function markPurchasePaid(id: string, actor: string) {
  const db = getSupabase();
  return withStoreFallback("markPurchasePaid", db, (client) => supabaseStore.markPurchasePaid(client, id, actor), () => localMarkPurchasePaid(id, actor));
}

export async function listPosts(includeUnpublished = false): Promise<JournalPost[]> {
  const db = getSupabase();
  return withStoreFallback("listPosts", db, (client) => supabaseStore.listPosts(client, includeUnpublished), () => localListPosts(includeUnpublished));
}

export async function getPostBySlug(slug: string): Promise<JournalPost | undefined> {
  const db = getSupabase();
  return withStoreFallback("getPostBySlug", db, (client) => supabaseStore.getPostBySlug(client, slug), () => localGetPostBySlug(slug));
}

export async function upsertPost(post: JournalPost, actor: string): Promise<JournalPost> {
  const db = getSupabase();
  return withStoreFallback("upsertPost", db, (client) => supabaseStore.upsertPost(client, post, actor), () => localUpsertPost(post, actor));
}

export async function deletePost(id: string, actor: string) {
  const db = getSupabase();
  return withStoreFallback("deletePost", db, (client) => supabaseStore.deletePost(client, id, actor), () => localDeletePost(id, actor));
}

export function resetStoreForTests() {
  supabaseDisabled = false;
  localResetStoreForTests();
}


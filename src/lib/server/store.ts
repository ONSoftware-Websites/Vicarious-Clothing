import fs from "node:fs";
import path from "node:path";
import type {
  AuditEntry,
  Discount,
  EmailLogEntry,
  Order,
  OrderStatus,
  Product,
  SellToUsLead,
  StoreData,
} from "@/lib/types";
import { RESERVATION_MINUTES } from "@/lib/site";
import { estimateFees, PACKAGING_COST } from "@/lib/utils";
import { buildSeedProducts } from "@/lib/server/seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function buildInitialData(): StoreData {
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

  return {
    products,
    orders,
    auditLog,
    leads,
    orderCounter: 1056,
    discounts,
    emailLog,
    visits: { total: 1247, byDay: {} },
  };
}

let cache: StoreData | null = null;

function load(): StoreData {
  if (cache) return cache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      cache = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as StoreData;
      return cache;
    }
  } catch {
    // fall through to fresh seed
  }
  cache = buildInitialData();
  save();
  return cache;
}

function save() {
  if (!cache) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

export function expireReservations(now = Date.now()) {
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

export function listProducts(): Product[] {
  expireReservations();
  return load().products;
}

export function getProductBySku(sku: string): Product | undefined {
  expireReservations();
  return load().products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
}

export function getProductBySlug(slug: string): Product | undefined {
  expireReservations();
  return load().products.find((p) => p.slug === slug);
}

export function upsertProduct(
  product: Product,
  actor: string,
  detail: string
): Product {
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

export function setProductStatus(sku: string, status: Product["status"]) {
  const data = load();
  const product = data.products.find((p) => p.sku === sku);
  if (!product) return;
  product.status = status;
  if (status === "SOLD") product.soldAt = new Date().toISOString();
  if (status === "AVAILABLE") product.reservedUntil = undefined;
  save();
}

export function nextSku(): string {
  const data = load();
  const max = data.products.reduce((m, p) => {
    const n = Number.parseInt(p.sku.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `VC-${String(max + 1).padStart(6, "0")}`;
}

export function duplicateProduct(sku: string, actor: string) {
  const data = load();
  const source = data.products.find((p) => p.sku === sku);
  if (!source) return undefined;
  const newSku = nextSku();
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

export function reserveProducts(skus: string[]): { ok: string[]; gone: string[] } {
  expireReservations();
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

export function releaseProducts(skus: string[]) {
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

export function markSoldByOrder(skus: string[]) {
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

export function createOrder(input: CreateOrderInput): {
  order?: Order;
  gone?: string[];
  error?: string;
} {
  expireReservations();
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
    const result = evaluateDiscount(input.discountCode, {
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
    markSoldByOrder(items.map((i) => i.sku));
  } else {
    reserveProducts(items.map((i) => i.sku));
  }

  if (input.discountCode && discount) {
    recordDiscountUsage(input.discountCode, input.email);
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

export function markOrderPaid(id: string): Order | undefined {
  const data = load();
  const order = data.orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
  if (!order) return undefined;
  if (order.status === "PAID") return order;
  order.status = "PAID";
  order.updatedAt = new Date().toISOString();
  markSoldByOrder(order.items.map((i) => i.sku));
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

export function setOrderPayment(
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

export function evaluateDiscount(
  code: string,
  context: DiscountContext
): DiscountResult {
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

export function recordDiscountUsage(code: string, email: string) {
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

export function listDiscounts(): Discount[] {
  return load().discounts;
}

export function upsertDiscount(
  discount: Discount,
  actor: string
): Discount {
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

export function deleteDiscount(id: string, actor: string) {
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

export function logEmail(entry: Omit<EmailLogEntry, "id">) {
  const data = load();
  data.emailLog.unshift({ ...entry, id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}` });
  data.emailLog = data.emailLog.slice(0, 200);
  save();
}

export function listEmails(limit = 100): EmailLogEntry[] {
  return load().emailLog.slice(0, limit);
}

export function recordVisit() {
  const data = load();
  const day = new Date().toISOString().slice(0, 10);
  data.visits.total += 1;
  data.visits.byDay[day] = (data.visits.byDay[day] ?? 0) + 1;
  save();
}

export function getVisits() {
  const data = load();
  return {
    total: data.visits.total,
    byDay: { ...data.visits.byDay },
  };
}

export function getOrder(id: string): Order | undefined {
  return load().orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
}

export function listOrders(email?: string): Order[] {
  const orders = load().orders;
  if (email) return orders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
  return orders;
}

export function updateOrderStatus(id: string, status: OrderStatus, actor: string) {
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

export function setOrderTracking(
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

export function createLead(
  input: Omit<SellToUsLead, "id" | "status" | "createdAt">
): SellToUsLead {
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

export function listLeads(): SellToUsLead[] {
  return load().leads;
}

export function updateLeadStatus(
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

export function listAuditLog(limit = 30): AuditEntry[] {
  return load().auditLog.slice(0, limit);
}

export function productEconomics(product: Product) {
  const price = product.price;
  const cost = product.cost ?? 0;
  const fees = estimateFees(price);
  const packaging = PACKAGING_COST;
  const profit = price - cost - fees - packaging;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  return { price, cost, fees, packaging, profit, margin };
}

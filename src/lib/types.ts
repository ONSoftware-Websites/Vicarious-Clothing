export const CONDITIONS = [
  "new_with_tags",
  "new_without_tags",
  "excellent",
  "very_good",
  "good",
  "fair",
] as const;

export type Condition = (typeof CONDITIONS)[number];

export const CATEGORIES = [
  "tops",
  "hoodies",
  "knitwear",
  "jackets",
  "trousers",
  "jeans",
  "footwear",
  "accessories",
  "vintage",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const INVENTORY_STATUSES = [
  "DRAFT",
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "ARCHIVED",
] as const;

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PICKING",
  "READY_TO_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ROLES = ["CUSTOMER", "STAFF", "MANAGER", "ADMIN", "OWNER"] as const;

export type Role = (typeof ROLES)[number];

export const CHANNELS = ["website", "vinted", "depop", "ebay"] as const;

export type SalesChannel = (typeof CHANNELS)[number];

export const LEAD_STATUSES = [
  "NEW",
  "REVIEWING",
  "OFFER_SENT",
  "ACCEPTED",
  "DECLINED",
  "RECEIVED",
  "INSPECTED",
  "PAID",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const MARKETPLACES = ["website", "vinted", "depop", "ebay"] as const;

export type Marketplace = (typeof MARKETPLACES)[number];

export type MarketplaceStatus = "LISTED" | "NOT_LISTED";

export interface Measurement {
  label: string;
  value: string;
}

export interface ProductImage {
  src: string;
  alt?: string;
}

export interface MarketplaceListing {
  channel: Marketplace;
  status: MarketplaceStatus;
  url?: string;
}

export interface Product {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  size: string;
  colour: string;
  material: string;
  condition: Condition;
  conditionNotes: string;
  measurements: Measurement[];
  description: string;
  defects: string[];
  tags: string[];
  price: number;
  compareAtPrice?: number;
  cost?: number;
  floorPrice?: number;
  images: ProductImage[];
  status: InventoryStatus;
  location?: string;
  listedAt: string;
  soldAt?: string;
  reservedUntil?: string;
  acquisitionSource?: string;
  purchaseDate?: string;
  marketplace: MarketplaceListing[];
  isPick?: boolean;
  featured?: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  brand: string;
  size: string;
  condition: Condition;
  price: number;
  image: string;
}

export interface DiscountApplication {
  code: string;
  description: string;
  amount: number;
  type: DiscountType;
}

export interface Order {
  id: string;
  email: string;
  name: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount?: DiscountApplication;
  delivery: number;
  total: number;
  address: Address;
  channel: SalesChannel;
  carrier?: string;
  tracking?: string;
  paymentProvider: "demo" | "stripe";
  paymentIntentId?: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const DISCOUNT_TYPES = ["percentage", "fixed", "free_delivery"] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  description: string;
  minBasket?: number;
  categories?: string[];
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  usedEmails: string[];
  active: boolean;
  createdAt: string;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: "sent" | "logged";
  provider: string;
  sentAt: string;
  preview: string;
}

export interface VisitsData {
  total: number;
  byDay: Record<string, number>;
}

export interface NewsletterSubscriber {
  email: string;
  source: string;
  consentedAt: string;
}

export interface StockPurchaseItem {
  sku: string;
  name: string;
  brand: string;
  cost: number;
}

export interface StockPurchase {
  id: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  status: "AGREED" | "PAID";
  items: StockPurchaseItem[];
  notes?: string;
  leadId?: string;
  createdAt: string;
  paidAt?: string;
}

export interface JournalPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  coverImage?: string;
  published: boolean;
  publishedAt: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  detail: string;
  before?: string;
  after?: string;
  at: string;
}

export interface SellToUsLead {
  id: string;
  name: string;
  email: string;
  brand: string;
  itemType: string;
  size: string;
  condition: string;
  notes?: string;
  offer?: string;
  status: LeadStatus;
  createdAt: string;
}

export interface StoreData {
  products: Product[];
  orders: Order[];
  auditLog: AuditEntry[];
  leads: SellToUsLead[];
  orderCounter: number;
  discounts: Discount[];
  emailLog: EmailLogEntry[];
  visits: VisitsData;
  subscribers: NewsletterSubscriber[];
  purchases: StockPurchase[];
  posts: JournalPost[];
}

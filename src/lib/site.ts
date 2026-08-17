import type { Category, Condition } from "@/lib/types";

export const SITE_NAME = "Vicarious Clothing";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vicariousclothing.co.uk";
export const FREE_DELIVERY_THRESHOLD = 75;
export const STANDARD_DELIVERY_COST = 3.95;
export const EXPRESS_DELIVERY_COST = 6.95;

export const EMAILS = {
  owner: "henry@vicariousclothing.co.uk",
  general: "hello@vicariousclothing.co.uk",
  orders: "orders@vicariousclothing.co.uk",
  support: "support@vicariousclothing.co.uk",
  notifications: "notifications@vicariousclothing.co.uk",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  tops: "Tops",
  hoodies: "Hoodies",
  knitwear: "Knitwear",
  jackets: "Jackets",
  trousers: "Trousers",
  jeans: "Jeans",
  footwear: "Footwear",
  accessories: "Accessories",
  vintage: "Vintage",
};

export const SHOP_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export const COLLECTIONS = [
  { key: "latest", label: "Latest Drop", description: "The newest pieces in, listed this month." },
  { key: "picks", label: "Vicarious Picks", description: "The pieces we would keep for ourselves." },
  { key: "under-25", label: "Under £25", description: "Serious pieces, unserious prices." },
] as const;

export const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price low to high" },
  { key: "price-desc", label: "Price high to low" },
] as const;

export const NAV_LINKS = [
  { label: "New", href: "/shop/new-in" },
  { label: "Shop", href: "/shop" },
  { label: "Brands", href: "/brands" },
  { label: "About", href: "/about" },
];

export const HELP_TOPICS = [
  { slug: "contact", title: "Contact", description: "Get in touch with the Vicarious team." },
  { slug: "delivery", title: "Delivery", description: "How we send pieces, and what it costs." },
  { slug: "returns", title: "Returns", description: "Changed your mind? Here is how returns work." },
  { slug: "faqs", title: "FAQs", description: "Answers to the questions we get asked most." },
  { slug: "size-guide", title: "Size Guide", description: "How we measure, and how to find your fit." },
  { slug: "condition-guide", title: "Condition Guide", description: "What each condition grade actually means." },
];

export const LEGAL_TOPICS = [
  { slug: "terms", title: "Terms & Conditions" },
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "cookies", title: "Cookie Policy" },
];

export const MEASUREMENT_FIELDS: Record<string, string[]> = {
  jackets: ["Pit to pit", "Length", "Sleeve"],
  tops: ["Pit to pit", "Length", "Sleeve"],
  hoodies: ["Pit to pit", "Length", "Sleeve"],
  knitwear: ["Pit to pit", "Length", "Sleeve"],
  trousers: ["Waist", "Rise", "Inseam"],
  jeans: ["Waist", "Rise", "Inseam"],
  footwear: ["UK size", "Insole length"],
  accessories: [],
  vintage: ["Pit to pit", "Length"],
};

export const CONDITION_DESCRIPTIONS: Record<Condition, string> = {
  new_with_tags: "Unused with original tags attached.",
  new_without_tags: "Unused but no original tags.",
  excellent: "Minimal or no obvious signs of previous wear.",
  very_good:
    "Light signs of previous wear; no significant defects unless specifically disclosed.",
  good: "Noticeable signs of wear; all material defects disclosed.",
  fair: "Significant visible wear but still considered saleable.",
};

export const RESERVATION_MINUTES = 30;

export const TRENDING_TERMS = ["Carhartt", "Nike", "Jackets", "Vintage"];

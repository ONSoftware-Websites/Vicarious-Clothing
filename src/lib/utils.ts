import type { Condition, InventoryStatus } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatPrice(value: number) {
  return gbp.format(value);
}

export const CONDITION_LABELS: Record<Condition, string> = {
  new_with_tags: "New with Tags",
  new_without_tags: "New without Tags",
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
  fair: "Fair",
};

export const CONDITION_UPPER: Record<Condition, string> = {
  new_with_tags: "NEW WITH TAGS",
  new_without_tags: "NEW WITHOUT TAGS",
  excellent: "EXCELLENT",
  very_good: "VERY GOOD",
  good: "GOOD",
  fair: "FAIR",
};

export function conditionLabel(condition: Condition, upper = false) {
  return upper ? CONDITION_UPPER[condition] : CONDITION_LABELS[condition];
}

export function conditionTone(condition: Condition) {
  switch (condition) {
    case "new_with_tags":
    case "new_without_tags":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "excellent":
    case "very_good":
      return "text-ink bg-cream border-line";
    case "good":
      return "text-amber-800 bg-amber-50 border-amber-200";
    case "fair":
      return "text-orange-800 bg-orange-50 border-orange-200";
  }
}

export const STATUS_LABELS: Record<InventoryStatus, string> = {
  DRAFT: "Draft",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  ARCHIVED: "Archived",
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysAgo(iso: string) {
  return Math.max(
    0,
    Math.floor((new Date().getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function isAgedDays(iso: string, days: number) {
  return (
    new Date().getTime() - new Date(iso).getTime() > days * 24 * 60 * 60 * 1000
  );
}

export function isRecent(iso: string, days = 30) {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

export function seedImage(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export function skuFromName(value: string) {
  return slugify(value).slice(0, 48);
}

export function estimateFees(price: number) {
  return Math.round(price * 0.024 * 100) / 100 + 0.2;
}

export const PACKAGING_COST = 0.6;

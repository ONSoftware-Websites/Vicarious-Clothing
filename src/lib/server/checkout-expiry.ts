import type { Order } from "@/lib/types";

// Pending payment windows are bounded so late Stripe callbacks are refunded
// rather than resurrecting stock that may have been reclaimed.
export const PAYMENT_WINDOW_MS = 45 * 60 * 1000;
export function checkoutExpired(order: Order, now = Date.now()) {
  const created = Date.parse(order.createdAt);
  return Number.isFinite(created) && now - created > PAYMENT_WINDOW_MS;
}

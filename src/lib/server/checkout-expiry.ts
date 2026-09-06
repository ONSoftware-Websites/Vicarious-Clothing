import type { Order } from "@/lib/types";

// Checkout holds are no longer time-based. Stock is released when the customer
// leaves/cancels checkout, when payment fails, or when an admin/server process
// cancels the pending order. Keep this helper so existing payment routes can
// share one policy point without reintroducing a timer.
export function checkoutExpired(_order: Order, _now = Date.now()) {
  return false;
}

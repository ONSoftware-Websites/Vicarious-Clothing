import type { Order } from "@/lib/types";
import { RESERVATION_MINUTES } from "@/lib/site";

export function checkoutExpired(order: Order, now = Date.now()) {
  if (order.status !== "PENDING_PAYMENT") return false;
  const created = new Date(order.createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return created + RESERVATION_MINUTES * 60 * 1000 < now;
}

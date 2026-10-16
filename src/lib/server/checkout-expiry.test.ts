import { describe, expect, it } from "vitest";
import { checkoutExpired, PAYMENT_WINDOW_MS } from "./checkout-expiry";
import type { Order } from "@/lib/types";

const pending = (createdAt: string) =>
  ({status:"PENDING_PAYMENT",createdAt} as Order);

describe("checkout payment expiry", () => {
  const now = Date.parse("2026-10-16T12:00:00Z");
  it("keeps pending payments inside the 45-minute window", () => {
    expect(checkoutExpired(pending(new Date(now-PAYMENT_WINDOW_MS+1000).toISOString()),now)).toBe(false);
  });
  it("expires a checkout older than the payment window", () => {
    expect(checkoutExpired(pending(new Date(now-PAYMENT_WINDOW_MS-1000).toISOString()),now)).toBe(true);
  });
  it("does not expire malformed dates", () => {
    expect(checkoutExpired(pending("invalid-date"),now)).toBe(false);
  });
});

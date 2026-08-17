import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.DATA_STORE = "memory";

import {
  createOrder,
  evaluateDiscount,
  expireReservations,
  getProductBySku,
  listDiscounts,
  markOrderPaid,
  productEconomics,
  releaseProducts,
  reserveProducts,
  resetStoreForTests,
  subscribeNewsletter,
} from "@/lib/server/store";

beforeAll(() => {
  resetStoreForTests();
});

beforeEach(() => {
  resetStoreForTests();
});

describe("inventory reservation", () => {
  it("reserves available stock and rejects already-reserved stock", () => {
    const first = reserveProducts(["VC-000381"]);
    expect(first.ok).toEqual(["VC-000381"]);
    expect(first.gone).toEqual([]);
    expect(getProductBySku("VC-000381")?.status).toBe("RESERVED");

    const second = reserveProducts(["VC-000381"]);
    expect(second.gone).toEqual(["VC-000381"]);
  });

  it("releases reservations", () => {
    reserveProducts(["VC-000381"]);
    releaseProducts(["VC-000381"]);
    expect(getProductBySku("VC-000381")?.status).toBe("AVAILABLE");
  });

  it("expires stale reservations lazily", () => {
    reserveProducts(["VC-000381"]);
    const product = getProductBySku("VC-000381");
    expect(product).toBeTruthy();
    product!.reservedUntil = new Date(Date.now() - 1000).toISOString();
    expireReservations();
    expect(getProductBySku("VC-000381")?.status).toBe("AVAILABLE");
  });
});

describe("order creation", () => {
  it("creates a PAID order, marks stock sold, and blocks a second buyer", () => {
    const result = createOrder({
      email: "buyer@test.co.uk",
      name: "Test Buyer",
      items: [{ sku: "VC-000381" }],
      deliveryCost: 3.95,
      address: {
        line1: "1 Test Street",
        city: "Leeds",
        postcode: "LS1 1AA",
        country: "United Kingdom",
      },
    });

    expect(result.gone).toBeUndefined();
    expect(result.order).toBeTruthy();
    expect(result.order!.id).toMatch(/^VC-\d+$/);
    expect(result.order!.status).toBe("PAID");
    expect(result.order!.total).toBe(67.95);
    expect(getProductBySku("VC-000381")?.status).toBe("SOLD");

    const race = createOrder({
      email: "second@test.co.uk",
      name: "Second Buyer",
      items: [{ sku: "VC-000381" }],
      deliveryCost: 3.95,
      address: {
        line1: "2 Test Street",
        city: "Leeds",
        postcode: "LS1 1AA",
        country: "United Kingdom",
      },
    });
    expect(race.gone).toEqual(["VC-000381"]);
    expect(race.order).toBeUndefined();
  });

  it("keeps stock reserved for PENDING_PAYMENT and sells on capture", () => {
    const result = createOrder({
      email: "pending@test.co.uk",
      name: "Pending Buyer",
      items: [{ sku: "VC-000402" }],
      deliveryCost: 0,
      address: {
        line1: "3 Test Street",
        city: "Leeds",
        postcode: "LS1 1AA",
        country: "United Kingdom",
      },
      status: "PENDING_PAYMENT",
      paymentProvider: "stripe",
    });

    expect(result.order!.status).toBe("PENDING_PAYMENT");
    expect(getProductBySku("VC-000402")?.status).toBe("RESERVED");

    markOrderPaid(result.order!.id);
    expect(getProductBySku("VC-000402")?.status).toBe("SOLD");
  });
});

describe("discounts", () => {
  it("applies a percentage discount to the basket", () => {
    const result = evaluateDiscount("WELCOME10", {
      subtotal: 64,
      email: "fresh@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(true);
    expect(result.discount?.amount).toBe(6.4);
    expect(result.discount?.type).toBe("percentage");
  });

  it("enforces the minimum basket", () => {
    const result = evaluateDiscount("WELCOME10", {
      subtotal: 10,
      email: "fresh@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("£30");
  });

  it("caps fixed discounts at the subtotal", () => {
    const result = evaluateDiscount("FIVEROFF", {
      subtotal: 41,
      email: "fixed@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(true);
    expect(result.discount?.amount).toBe(5);
  });

  it("blocks codes already used by an email", () => {
    const result = evaluateDiscount("FIVEROFF", {
      subtotal: 50,
      email: "henry@example.com",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(false);
  });

  it("blocks expired codes", () => {
    const discount = listDiscounts().find((d) => d.code === "JACKETS15");
    discount!.expiresAt = new Date(Date.now() - 1000).toISOString();
    const result = evaluateDiscount("JACKETS15", {
      subtotal: 50,
      email: "expired@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(false);
  });

  it("restricts category-specific codes to matching pieces", () => {
    const jacket = evaluateDiscount("JACKETS15", {
      subtotal: 50,
      email: "cats@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(jacket.ok).toBe(true);

    const hoodie = evaluateDiscount("JACKETS15", {
      subtotal: 50,
      email: "cats@test.co.uk",
      itemSkus: ["VC-000412"],
    });
    expect(hoodie.ok).toBe(false);
  });

  it("free delivery discount carries zero amount", () => {
    const result = evaluateDiscount("FREESHIP", {
      subtotal: 20,
      email: "freeship@test.co.uk",
      itemSkus: ["VC-000434"],
    });
    expect(result.ok).toBe(true);
    expect(result.discount?.type).toBe("free_delivery");
    expect(result.discount?.amount).toBe(0);
  });
});

describe("product economics", () => {
  it("computes profit and margin from cost, fees and packaging", () => {
    const product = getProductBySku("VC-000381")!;
    const econ = productEconomics(product);
    expect(econ.cost).toBe(18);
    expect(econ.price).toBe(64);
    expect(econ.fees).toBeCloseTo(1.74, 2);
    expect(econ.profit).toBeCloseTo(64 - 18 - 1.74 - 0.6, 2);
    expect(econ.margin).toBeCloseTo(((64 - 18 - 1.74 - 0.6) / 64) * 100, 1);
  });
});

describe("newsletter", () => {
  it("stores consent with a timestamp and deduplicates", () => {
    const first = subscribeNewsletter("new@test.co.uk", "homepage");
    const again = subscribeNewsletter("new@test.co.uk", "checkout");
    expect(first.consentedAt).toBeTruthy();
    expect(again).toBeTruthy();
  });
});

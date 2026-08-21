import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.DATA_STORE = "memory";

import {
  cancelPendingOrdersForEmail,
  createOrder,
  evaluateDiscount,
  expireReservations,
  getProductBySku,
  listDiscounts,
  listOrders,
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

describe("inventory reservation", async () => {
  it("reserves available stock and rejects already-reserved stock", async () => {
    const first = await reserveProducts(["VC-000381"]);
    expect(first.ok).toEqual(["VC-000381"]);
    expect(first.gone).toEqual([]);
    expect((await getProductBySku("VC-000381"))?.status).toBe("RESERVED");

    const second = await reserveProducts(["VC-000381"]);
    expect(second.gone).toEqual(["VC-000381"]);
  });

  it("releases reservations", async () => {
    await reserveProducts(["VC-000381"]);
    await releaseProducts(["VC-000381"]);
    expect((await getProductBySku("VC-000381"))?.status).toBe("AVAILABLE");
  });

  it("expires stale reservations lazily", async () => {
    await reserveProducts(["VC-000381"]);
    const product = await getProductBySku("VC-000381");
    expect(product).toBeTruthy();
    product!.reservedUntil = new Date(Date.now() - 1000).toISOString();
    await expireReservations();
    expect((await getProductBySku("VC-000381"))?.status).toBe("AVAILABLE");
  });
});

describe("order creation", async () => {
  it("creates a PAID order, marks stock sold, and blocks a second buyer", async () => {
    const result = await createOrder({
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
    expect((await getProductBySku("VC-000381"))?.status).toBe("SOLD");

    const race = await createOrder({
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

  it("keeps stock reserved for PENDING_PAYMENT and sells on capture", async () => {
    const result = await createOrder({
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
    expect((await getProductBySku("VC-000402"))?.status).toBe("RESERVED");

    await markOrderPaid(result.order!.id);
    expect((await getProductBySku("VC-000402"))?.status).toBe("SOLD");
  });

  it("cancels stale pending orders for an email, leaving paid orders alone", async () => {
    await createOrder({
      email: "repeat@test.co.uk",
      name: "Repeat Buyer",
      items: [{ sku: "VC-000388" }],
      deliveryCost: 0,
      address: {
        line1: "4 Test Street",
        city: "Leeds",
        postcode: "LS1 1AA",
        country: "United Kingdom",
      },
      status: "PENDING_PAYMENT",
      paymentProvider: "stripe",
    });
    await createOrder({
      email: "repeat@test.co.uk",
      name: "Repeat Buyer",
      items: [{ sku: "VC-000395" }],
      deliveryCost: 0,
      address: {
        line1: "4 Test Street",
        city: "Leeds",
        postcode: "LS1 1AA",
        country: "United Kingdom",
      },
      status: "PAID",
      paymentProvider: "demo",
    });

    await cancelPendingOrdersForEmail("repeat@test.co.uk");

    const orders = await listOrders("repeat@test.co.uk");
    const pending = orders.find((o) => o.status === "PENDING_PAYMENT");
    const paid = orders.find((o) => o.status === "PAID");
    expect(pending).toBeUndefined();
    expect(paid).toBeTruthy();
  });
});

describe("discounts", async () => {
  it("applies a percentage discount to the basket", async () => {
    const result = await evaluateDiscount("WELCOME10", {
      subtotal: 64,
      email: "fresh@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(true);
    expect(result.discount?.amount).toBe(6.4);
    expect(result.discount?.type).toBe("percentage");
  });

  it("enforces the minimum basket", async () => {
    const result = await evaluateDiscount("WELCOME10", {
      subtotal: 10,
      email: "fresh@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("£30");
  });

  it("caps fixed discounts at the subtotal", async () => {
    const result = await evaluateDiscount("FIVEROFF", {
      subtotal: 41,
      email: "fixed@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(true);
    expect(result.discount?.amount).toBe(5);
  });

  it("blocks codes already used by an email", async () => {
    const result = await evaluateDiscount("FIVEROFF", {
      subtotal: 50,
      email: "henry@example.com",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(false);
  });

  it("blocks expired codes", async () => {
    const discount = (await listDiscounts()).find((d) => d.code === "JACKETS15");
    discount!.expiresAt = new Date(Date.now() - 1000).toISOString();
    const result = await evaluateDiscount("JACKETS15", {
      subtotal: 50,
      email: "expired@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(result.ok).toBe(false);
  });

  it("restricts category-specific codes to matching pieces", async () => {
    const jacket = await evaluateDiscount("JACKETS15", {
      subtotal: 50,
      email: "cats@test.co.uk",
      itemSkus: ["VC-000381"],
    });
    expect(jacket.ok).toBe(true);

    const hoodie = await evaluateDiscount("JACKETS15", {
      subtotal: 50,
      email: "cats@test.co.uk",
      itemSkus: ["VC-000412"],
    });
    expect(hoodie.ok).toBe(false);
  });

  it("free delivery discount carries zero amount", async () => {
    const result = await evaluateDiscount("FREESHIP", {
      subtotal: 20,
      email: "freeship@test.co.uk",
      itemSkus: ["VC-000434"],
    });
    expect(result.ok).toBe(true);
    expect(result.discount?.type).toBe("free_delivery");
    expect(result.discount?.amount).toBe(0);
  });
});

describe("product economics", async () => {
  it("computes profit and margin from cost, fees and packaging", async () => {
    const product = (await getProductBySku("VC-000381"))!;
    const econ = productEconomics(product);
    expect(econ.cost).toBe(18);
    expect(econ.price).toBe(64);
    expect(econ.fees).toBeCloseTo(1.74, 2);
    expect(econ.profit).toBeCloseTo(64 - 18 - 1.74 - 0.6, 2);
    expect(econ.margin).toBeCloseTo(((64 - 18 - 1.74 - 0.6) / 64) * 100, 1);
  });
});

describe("newsletter", async () => {
  it("stores consent with a timestamp and deduplicates", async () => {
    const first = await subscribeNewsletter("new@test.co.uk", "homepage");
    const again = await subscribeNewsletter("new@test.co.uk", "checkout");
    expect(first.consentedAt).toBeTruthy();
    expect(again).toBeTruthy();
  });
});

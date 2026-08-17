import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.DATA_STORE = "memory";

import {
  filterProducts,
  getFacets,
  getRecentlySold,
  getSimilar,
} from "@/lib/catalog";
import {
  getProductBySku,
  listProducts,
  resetStoreForTests,
} from "@/lib/server/store";

beforeAll(() => {
  resetStoreForTests();
});

beforeEach(() => {
  resetStoreForTests();
});

const ALL = () => listProducts().filter((p) => p.status !== "DRAFT");

describe("filterProducts", () => {
  it("filters by category", () => {
    const jackets = filterProducts(ALL(), { category: "jackets" });
    expect(jackets.length).toBeGreaterThan(0);
    expect(jackets.every((p) => p.category === "jackets")).toBe(true);
  });

  it("filters by price range", () => {
    const result = filterProducts(ALL(), { minPrice: 10, maxPrice: 20 });
    expect(result.every((p) => p.price >= 10 && p.price <= 20)).toBe(true);
  });

  it("searches across title, brand, sku and tags", () => {
    const result = filterProducts(ALL(), { q: "carhartt" });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (p) =>
          p.brand.toLowerCase().includes("carhartt") ||
          p.name.toLowerCase().includes("carhartt") ||
          p.tags.join(" ").includes("carhartt")
      )
    ).toBe(true);

    const bySku = filterProducts(ALL(), { q: "VC-000381" });
    expect(bySku.map((p) => p.sku)).toEqual(["VC-000381"]);
  });

  it("sorts by newest and by price", () => {
    const newest = filterProducts(ALL(), {}, "newest");
    const times = newest.map((p) => new Date(p.listedAt).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }

    const cheapest = filterProducts(ALL(), {}, "price-asc");
    const prices = cheapest.map((p) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("hides non-available stock when onlyAvailable is set", () => {
    const result = filterProducts(ALL(), { onlyAvailable: true });
    expect(result.every((p) => p.status !== "SOLD")).toBe(true);
    expect(result.some((p) => p.sku === "VC-000365")).toBe(false);
  });
});

describe("facets", () => {
  it("extracts brands, sizes, conditions and price bounds", () => {
    const facets = getFacets(ALL());
    expect(facets.brands).toContain("Carhartt");
    expect(facets.brands).toContain("Nike");
    expect(facets.sizes.length).toBeGreaterThan(0);
    expect(facets.conditions).toContain("very_good");
    expect(facets.minPrice).toBeLessThanOrEqual(facets.maxPrice);
  });
});

describe("recently sold", () => {
  it("returns sold pieces with soldAt dates, newest first", () => {
    const sold = getRecentlySold(ALL(), 10);
    expect(sold.length).toBeGreaterThan(0);
    expect(sold.every((p) => p.status === "SOLD" && p.soldAt)).toBe(true);
    const times = sold.map((p) => new Date(p.soldAt!).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }
  });
});

describe("similar products", () => {
  it("suggests available pieces from the same category or brand, excluding self", () => {
    const product = getProductBySku("VC-000381")!;
    const similar = getSimilar(product, 4);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.every((p) => p.sku !== product.sku)).toBe(true);
    expect(
      similar.every(
        (p) => p.category === product.category || p.brand === product.brand
      )
    ).toBe(true);
    expect(similar.every((p) => p.status === "AVAILABLE")).toBe(true);
  });
});

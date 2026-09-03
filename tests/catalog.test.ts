import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.DATA_STORE = "memory";

import {
  filterProducts,
  getFacets,
  getRecentlySold,
  getSimilar,
  splitColourValues,
} from "@/lib/catalog";
import type { Product } from "@/lib/types";
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

const ALL = async () => (await listProducts()).filter((p) => p.status !== "DRAFT");

describe("filterProducts", async () => {
  it("filters by category", async () => {
    const jackets = filterProducts(await ALL(), { category: "jackets" });
    expect(jackets.length).toBeGreaterThan(0);
    expect(jackets.every((p) => p.category === "jackets")).toBe(true);
  });

  it("filters by price range", async () => {
    const result = filterProducts(await ALL(), { minPrice: 10, maxPrice: 20 });
    expect(result.every((p) => p.price >= 10 && p.price <= 20)).toBe(true);
  });

  it("filters multi-colour products by any individual colour", async () => {
    const base = (await ALL())[0] as Product;
    const multiColourProduct: Product = {
      ...base,
      sku: "VC-MULTI",
      colour: "Black, White, Green",
    };

    expect(filterProducts([multiColourProduct], { colours: ["Black"] })).toHaveLength(1);
    expect(filterProducts([multiColourProduct], { colours: ["White"] })).toHaveLength(1);
    expect(filterProducts([multiColourProduct], { colours: ["Green"] })).toHaveLength(1);
    expect(filterProducts([multiColourProduct], { colours: ["Blue"] })).toHaveLength(0);
  });

  it("searches across title, brand, sku and tags", async () => {
    const result = filterProducts(await ALL(), { q: "carhartt" });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (p) =>
          p.brand.toLowerCase().includes("carhartt") ||
          p.name.toLowerCase().includes("carhartt") ||
          p.tags.join(" ").includes("carhartt")
      )
    ).toBe(true);

    const bySku = filterProducts(await ALL(), { q: "VC-000381" });
    expect(bySku.map((p) => p.sku)).toEqual(["VC-000381"]);
  });

  it("sorts by newest and by price", async () => {
    const newest = filterProducts(await ALL(), {}, "newest");
    const times = newest.map((p) => new Date(p.listedAt).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }

    const cheapest = filterProducts(await ALL(), {}, "price-asc");
    const prices = cheapest.map((p) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("hides non-available stock when onlyAvailable is set", async () => {
    const result = filterProducts(await ALL(), { onlyAvailable: true });
    expect(result.every((p) => p.status !== "SOLD")).toBe(true);
    expect(result.some((p) => p.sku === "VC-000365")).toBe(false);
  });
});

describe("facets", async () => {
  it("extracts brands, sizes, conditions and price bounds", async () => {
    const facets = getFacets(await ALL());
    expect(facets.brands).toContain("Carhartt");
    expect(facets.brands).toContain("Nike");
    expect(facets.sizes.length).toBeGreaterThan(0);
    expect(facets.conditions).toContain("very_good");
    expect(facets.minPrice).toBeLessThanOrEqual(facets.maxPrice);
  });

  it("splits comma-separated colours into individual deduped filters", async () => {
    const base = (await ALL())[0] as Product;
    const facets = getFacets([
      base,
      { ...base, sku: "VC-MULTI", colour: "Black, White, Green" },
      { ...base, sku: "VC-BLACK", colour: "black" },
    ]);

    expect(splitColourValues("black, Black / WHITE and green")).toEqual([
      "Black",
      "Green",
      "White",
    ]);
    expect(facets.colours).toContain("Black");
    expect(facets.colours).toContain("White");
    expect(facets.colours).toContain("Green");
    expect(facets.colours).not.toContain("Black, White, Green");
    expect(facets.colours.filter((colour) => colour === "Black")).toHaveLength(1);
  });
});

describe("recently sold", async () => {
  it("returns sold pieces with soldAt dates, newest first", async () => {
    const sold = getRecentlySold(await ALL(), 10);
    expect(sold.length).toBeGreaterThan(0);
    expect(sold.every((p) => p.status === "SOLD" && p.soldAt)).toBe(true);
    const times = sold.map((p) => new Date(p.soldAt!).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }
  });
});

describe("similar products", async () => {
  it("suggests available pieces from the same category or brand, excluding self", async () => {
    const product = (await getProductBySku("VC-000381"))!;
    const similar = await getSimilar(product, 4);
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

import { describe, expect, it } from "vitest";
import { calculatePrice } from "./pricing";
import type { Competitor, PriceResult, Product } from "./types";
import products from "../data/products.json";
import expected from "../data/expected.json";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    sku: "TEST-SKU",
    name: "Test product",
    myPrice: 100000,
    minPrice: 90000,
    maxPrice: 120000,
    step: 10,
    competitors: [],
    ...overrides,
  };
}

function inStock(price: number, seller = "Seller"): Competitor {
  return { seller, price, inStock: true };
}

function outOfStock(price: number, seller = "Seller"): Competitor {
  return { seller, price, inStock: false };
}

describe("calculatePrice", () => {
  describe("examples from the task", () => {
    it.each([
      { best: 384990, step: 10, min: 370000, max: 420000, newPrice: 384980, reason: "UNDERCUT" },
      { best: 175000, step: 100, min: 180000, max: 210000, newPrice: 180000, reason: "AT_MIN" },
      { best: 150000, step: 1, min: 100000, max: 125000, newPrice: 125000, reason: "AT_MAX" },
      { best: 349999.9, step: 0.5, min: 330000, max: 380000, newPrice: 349999, reason: "UNDERCUT" },
    ])("best=$best step=$step -> $newPrice ($reason)", ({ best, step, min, max, newPrice, reason }) => {
      const result = calculatePrice(
        makeProduct({ step, minPrice: min, maxPrice: max, competitors: [inStock(best)] }),
      );
      expect(result.newPrice).toBe(newPrice);
      expect(result.reason).toBe(reason);
    });

    it("matches data/expected.json for data/products.json", () => {
      const results = (products as Product[]).map(calculatePrice);
      expect(results).toEqual(expected as PriceResult[]);
    });
  });

  describe("NO_COMPETITORS", () => {
    it("returns maxPrice when the competitor list is empty", () => {
      const result = calculatePrice(makeProduct({ competitors: [] }));
      expect(result).toMatchObject({ newPrice: 120000, reason: "NO_COMPETITORS" });
    });

    it("returns maxPrice when every competitor is out of stock", () => {
      const result = calculatePrice(
        makeProduct({ competitors: [outOfStock(50000), outOfStock(95000)] }),
      );
      expect(result).toMatchObject({ newPrice: 120000, reason: "NO_COMPETITORS" });
    });
  });

  describe("competitor selection", () => {
    it("ignores out-of-stock competitors even if they are cheaper", () => {
      const result = calculatePrice(
        makeProduct({ competitors: [outOfStock(91000), inStock(100000)] }),
      );
      expect(result).toMatchObject({ newPrice: 99990, reason: "UNDERCUT" });
    });

    it("picks the cheapest in-stock competitor regardless of order", () => {
      const result = calculatePrice(
        makeProduct({ competitors: [inStock(110000), inStock(95000), inStock(105000)] }),
      );
      expect(result).toMatchObject({ newPrice: 94990, reason: "UNDERCUT" });
    });

    it("handles several competitors sharing the best price", () => {
      const result = calculatePrice(
        makeProduct({ competitors: [inStock(95000, "A"), inStock(95000, "B")] }),
      );
      expect(result).toMatchObject({ newPrice: 94990, reason: "UNDERCUT" });
    });
  });

  describe("range limits", () => {
    it("keeps the candidate when it equals minPrice (inclusive)", () => {
      const result = calculatePrice(makeProduct({ competitors: [inStock(90010)] }));
      expect(result).toMatchObject({ newPrice: 90000, reason: "UNDERCUT" });
    });

    it("keeps the candidate when it equals maxPrice (inclusive)", () => {
      const result = calculatePrice(makeProduct({ competitors: [inStock(120010)] }));
      expect(result).toMatchObject({ newPrice: 120000, reason: "UNDERCUT" });
    });

    it("clamps to minPrice when the candidate is one tenge below it", () => {
      const result = calculatePrice(makeProduct({ competitors: [inStock(90009)] }));
      expect(result).toMatchObject({ newPrice: 90000, reason: "AT_MIN" });
    });

    it("clamps to maxPrice when the candidate is one tenge above it", () => {
      const result = calculatePrice(makeProduct({ competitors: [inStock(120011)] }));
      expect(result).toMatchObject({ newPrice: 120000, reason: "AT_MAX" });
    });

    it("returns AT_MIN when step is larger than the competitor price", () => {
      const result = calculatePrice(
        makeProduct({ minPrice: 0, step: 100, competitors: [inStock(50)] }),
      );
      expect(result).toMatchObject({ newPrice: 0, reason: "AT_MIN" });
    });

    it("works when minPrice equals maxPrice", () => {
      const product = makeProduct({ minPrice: 100000, maxPrice: 100000 });
      expect(calculatePrice({ ...product, competitors: [inStock(100010)] })).toMatchObject({
        newPrice: 100000,
        reason: "UNDERCUT",
      });
      expect(calculatePrice({ ...product, competitors: [inStock(90000)] })).toMatchObject({
        newPrice: 100000,
        reason: "AT_MIN",
      });
      expect(calculatePrice({ ...product, competitors: [inStock(200000)] })).toMatchObject({
        newPrice: 100000,
        reason: "AT_MAX",
      });
    });
  });

  describe("rounding", () => {
    it("matches the competitor price when step is 0", () => {
      const result = calculatePrice(makeProduct({ step: 0, competitors: [inStock(100000)] }));
      expect(result).toMatchObject({ newPrice: 100000, reason: "UNDERCUT" });
    });

    it("rounds a fractional competitor price down even with step 0", () => {
      const result = calculatePrice(makeProduct({ step: 0, competitors: [inStock(100000.99)] }));
      expect(result).toMatchObject({ newPrice: 100000, reason: "UNDERCUT" });
    });

    it("rounds down a fractional step", () => {
      const result = calculatePrice(makeProduct({ step: 0.1, competitors: [inStock(100000)] }));
      expect(result).toMatchObject({ newPrice: 99999, reason: "UNDERCUT" });
    });

    // In plain JS 2.3 - 0.3 === 1.9999999999999998, so a naive Math.floor gives 1.
    it.each([
      { best: 2.3, step: 0.3, newPrice: 2 },
      { best: 2.8, step: 0.8, newPrice: 2 },
      { best: 1.4, step: 0.4, newPrice: 1 },
      { best: 1.13, step: 0.13, newPrice: 1 },
    ])(
      "is not affected by floating point noise: $best - $step = $newPrice",
      ({ best, step, newPrice }) => {
        const result = calculatePrice(
          makeProduct({ minPrice: 0, maxPrice: 10, step, competitors: [inStock(best)] }),
        );
        expect(result).toMatchObject({ newPrice, reason: "UNDERCUT" });
      },
    );

    it("always returns an integer price", () => {
      const result = calculatePrice(makeProduct({ step: 3.75, competitors: [inStock(99999.99)] }));
      expect(Number.isInteger(result.newPrice)).toBe(true);
    });
  });

  describe("result shape", () => {
    it("returns sku and myPrice as oldPrice unchanged", () => {
      const result = calculatePrice(
        makeProduct({ sku: "ABC-1", myPrice: 101234.5, competitors: [inStock(100000)] }),
      );
      expect(result).toEqual({ sku: "ABC-1", oldPrice: 101234.5, newPrice: 99990, reason: "UNDERCUT" });
    });

    it("does not depend on myPrice", () => {
      const competitors = [inStock(100000)];
      const low = calculatePrice(makeProduct({ myPrice: 1, competitors }));
      const high = calculatePrice(makeProduct({ myPrice: 999999, competitors }));
      expect(low.newPrice).toBe(high.newPrice);
      expect(low.reason).toBe(high.reason);
    });

    it("does not mutate the input product", () => {
      const product = makeProduct({ competitors: [inStock(100000), outOfStock(95000)] });
      const snapshot = structuredClone(product);
      calculatePrice(product);
      expect(product).toEqual(snapshot);
    });
  });
});

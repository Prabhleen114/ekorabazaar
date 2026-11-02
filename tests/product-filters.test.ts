import { describe, it, expect, vi } from "vitest";
import {
  normalizeSortKey,
  parsePriceBounds,
  normalizePriceRupees,
  filterAndSortCatalogProducts,
  buildPrismaProductQuery,
  SORT_COMPARATORS,
  NormalizedProduct
} from "@/lib/product-filters";
import type { PrismaClient } from "@prisma/client";

const SAMPLE_PRODUCTS: any[] = [
  {
    id: "1",
    name: "Soy Wax Flakes 1kg",
    category: "Candle Waxes & Additives",
    department: "Casting Mediums & Raw Bases",
    disciplines: ["candle-studio"],
    price: 350,
    inStock: true,
    bulkDiscountAvailable: true,
    maxDiscount: 15,
  },
  {
    id: "2",
    name: "Beeswax White Pellets 500g",
    category: "Candle Waxes & Additives",
    department: "Casting Mediums & Raw Bases",
    disciplines: ["candle-studio"],
    price: "450", // string price
    inStock: true,
    bulkDiscountAvailable: false,
    maxDiscount: 0,
  },
  {
    id: "3",
    name: "Rose Luxury Fragrance Oil 100ml",
    category: "Fragrance Oils",
    department: "Scent & Flavor Lab",
    disciplines: ["candle-studio", "soap-atelier"],
    price: 650,
    inStock: true,
    bulkDiscountAvailable: true,
    maxDiscount: 20,
  },
  {
    id: "4",
    name: "Lavender Essential Oil 30ml",
    category: "Essential Oils",
    department: "Scent & Flavor Lab",
    disciplines: ["soap-atelier"],
    price: 1200,
    inStock: false, // out of stock
    bulkDiscountAvailable: false,
    maxDiscount: 0,
  },
  {
    id: "5",
    name: "Silicone Candle Mould - Ribbed Pillar",
    category: "Candle & Pillar Moulds",
    department: "Precision Studio Moulds",
    disciplines: ["candle-studio"],
    price: 1800,
    inStock: true,
    bulkDiscountAvailable: true,
    maxDiscount: 25,
  },
  {
    id: "6",
    name: "Commercial Ultrasonic Cleaner 10L",
    category: "Studio Equipment",
    department: "Tools & Equipment Studio",
    disciplines: [],
    price: 4500,
    inStock: true,
    bulkDiscountAvailable: false,
    maxDiscount: 0,
  },
  {
    id: "7",
    name: "Skin Safe Vanilla Fragrance Oil",
    category: "Skin Safe Fragrances",
    department: "Scent & Flavor Lab",
    disciplines: ["soap-atelier"],
    price: 550,
    inStock: true,
    bulkDiscountAvailable: true,
    maxDiscount: 10,
  }
];

describe("Product Filters & Sorter - In-Memory Engine", () => {
  describe("Sort Key Normalization", () => {
    it("maps standard and legacy aliases correctly", () => {
      expect(normalizeSortKey("price_asc")).toBe("price_asc");
      expect(normalizeSortKey("price-asc")).toBe("price_asc");
      expect(normalizeSortKey("low_to_high")).toBe("price_asc");
      expect(normalizeSortKey("price_low")).toBe("price_asc");

      expect(normalizeSortKey("price_desc")).toBe("price_desc");
      expect(normalizeSortKey("price-desc")).toBe("price_desc");
      expect(normalizeSortKey("high_to_low")).toBe("price_desc");
      expect(normalizeSortKey("price_high")).toBe("price_desc");

      expect(normalizeSortKey("new")).toBe("newest");
      expect(normalizeSortKey("latest")).toBe("newest");
      expect(normalizeSortKey("newest")).toBe("newest");

      expect(normalizeSortKey("discount")).toBe("discount_desc");
      expect(normalizeSortKey("discount_high")).toBe("discount_desc");
      expect(normalizeSortKey("discount_desc")).toBe("discount_desc");

      expect(normalizeSortKey("")).toBe("recommended");
      expect(normalizeSortKey(null)).toBe("recommended");
      expect(normalizeSortKey("unknown")).toBe("recommended");
    });
  });

  describe("Price Bounds & Normalization", () => {
    it("parses preset price options correctly", () => {
      expect(parsePriceBounds("under_500")).toEqual({ max: 500 });
      expect(parsePriceBounds("500_1500")).toEqual({ min: 500, max: 1500 });
      expect(parsePriceBounds("1500_3000")).toEqual({ min: 1500, max: 3000 });
      expect(parsePriceBounds("over_3000")).toEqual({ min: 3000 });
    });

    it("parses custom price ranges correctly", () => {
      expect(parsePriceBounds("custom", "200", "800")).toEqual({ min: 200, max: 800 });
      expect(parsePriceBounds("custom", 100, 1000)).toEqual({ min: 100, max: 1000 });
      expect(parsePriceBounds("custom", "300", "")).toEqual({ min: 300 });
    });

    it("normalizes string prices and numeric prices", () => {
      expect(normalizePriceRupees(450)).toBe(450);
      expect(normalizePriceRupees("450")).toBe(450);
      expect(normalizePriceRupees("₹1,250.50")).toBe(1250.5);
      expect(normalizePriceRupees("")).toBe(0);
      expect(normalizePriceRupees(null)).toBe(0);
    });
  });

  describe("Filtering Alone", () => {
    it("filters by category alone", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { category: "Candle Waxes & Additives" });
      expect(res.total).toBe(2);
      expect(res.items.map(p => p.id)).toEqual(["1", "2"]);
    });

    it("handles fragrance oils special grouping (includes skin safe fragrances)", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { category: "Fragrance Oils" });
      expect(res.total).toBe(2);
      expect(res.items.map(p => p.id).sort()).toEqual(["3", "7"]);
    });

    it("filters by department alone", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { department: "Scent & Flavor Lab" });
      expect(res.total).toBe(3);
      expect(res.items.map(p => p.id).sort()).toEqual(["3", "4", "7"]);
    });

    it("filters by craft discipline alone", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { discipline: "candle-studio" });
      expect(res.total).toBe(4);
      expect(res.items.map(p => p.id).sort()).toEqual(["1", "2", "3", "5"]);
    });

    it("filters by stock availability alone", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { inStockOnly: "true" });
      expect(res.total).toBe(6);
      expect(res.items.some(p => p.id === "4")).toBe(false);
    });

    it("filters by price presets (e.g. under_500, 500_1500, over_3000)", () => {
      const under500 = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { priceOption: "under_500" });
      expect(under500.items.map(p => p.id)).toEqual(["1", "2"]);

      const midRange = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { priceOption: "500_1500" });
      expect(midRange.items.map(p => p.id).sort()).toEqual(["3", "4", "7"]);

      const highRange = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { priceOption: "over_3000" });
      expect(highRange.items.map(p => p.id)).toEqual(["6"]);
    });

    it("filters by search query alone", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { q: "Lavender" });
      expect(res.total).toBe(1);
      expect(res.items[0].id).toBe("4");
    });
  });

  describe("Combined Filters", () => {
    it("combines category, price range, and in-stock filter", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, {
        department: "Scent & Flavor Lab",
        priceOption: "500_1500",
        inStockOnly: "true",
      });
      // IDs in Scent Lab with 500-1500: #3 (650, in stock), #4 (1200, OUT of stock), #7 (550, in stock)
      expect(res.total).toBe(2);
      expect(res.items.map(p => p.id).sort()).toEqual(["3", "7"]);
    });

    it("combines search query with price bounds", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, {
        q: "Beeswax",
        minPrice: "400",
      });
      // Only #2 is Beeswax and price 450 (>=400)
      expect(res.total).toBe(1);
      expect(res.items[0].id).toBe("2");
    });
  });

  describe("Sorting Options", () => {
    it("sorts by price_asc (low to high)", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, {
        sort: "price_asc",
        inStockOnly: "true",
      });
      const prices = res.items.map(p => p.price);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
      }
      expect(res.items[0].price).toBe(350);
      expect(res.items[res.items.length - 1].price).toBe(4500);
    });

    it("sorts by price_desc (high to low)", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, {
        sort: "price_desc",
        inStockOnly: "true",
      });
      const prices = res.items.map(p => p.price);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
      }
      expect(res.items[0].price).toBe(4500);
      expect(res.items[res.items.length - 1].price).toBe(350);
    });

    it("sorts by newest", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { sort: "newest" });
      const ids = res.items.map(p => parseInt(p.id, 10));
      for (let i = 0; i < ids.length - 1; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i + 1]);
      }
    });

    it("sorts by discount_desc", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { sort: "discount_desc" });
      // Max discounts: #5: 25%, #3: 20%, #1: 15%, #7: 10%, #2: 0, #4: 0, #6: 0
      expect(res.items[0].id).toBe("5");
      expect(res.items[1].id).toBe("3");
      expect(res.items[2].id).toBe("1");
      expect(res.items[3].id).toBe("7");
    });

    it("handles legacy sort alias parameters seamlessly (sortBy / order)", () => {
      const ascViaSortBy = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { sortBy: "price-asc" });
      const ascViaOrder = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { order: "low_to_high" });
      expect(ascViaSortBy.items.map(p => p.id)).toEqual(ascViaOrder.items.map(p => p.id));
    });
  });

  describe("Empty Results State", () => {
    it("returns total 0 and empty items array for unmatched filters", () => {
      const res = filterAndSortCatalogProducts(SAMPLE_PRODUCTS, {
        category: "Candle Waxes & Additives",
        minPrice: "99999", // Impossible price for wax
      });
      expect(res.total).toBe(0);
      expect(res.items).toHaveLength(0);
      expect(res.totalPages).toBe(1);
    });
  });

  describe("Pure Non-Mutating Guarantee", () => {
    it("does not mutate the original array when filtering and sorting", () => {
      const originalSnap = JSON.stringify(SAMPLE_PRODUCTS);
      filterAndSortCatalogProducts(SAMPLE_PRODUCTS, { sort: "price_desc" });
      expect(JSON.stringify(SAMPLE_PRODUCTS)).toBe(originalSnap);
    });
  });
});

describe("Prisma Product Query Translation & Path", () => {
  it("translates filter and sort params into Prisma where, orderBy, take, skip with rupee-to-paise conversion", () => {
    const { where, orderBy, take, skip } = buildPrismaProductQuery({
      q: "wax",
      category: "Candle Waxes & Additives",
      priceOption: "custom",
      minPrice: "250", // ₹250
      maxPrice: "750", // ₹750
      inStockOnly: "true",
      sort: "price_asc",
      page: "2",
      limit: "20"
    });

    expect(where.title).toEqual({ contains: "wax", mode: "insensitive" });
    expect(where.category).toEqual({ equals: "Candle Waxes & Additives", mode: "insensitive" });
    // Prices converted to paise for DB (₹250 -> 25000, ₹750 -> 75000)
    expect(where.price).toEqual({ gte: 25000, lte: 75000 });
    expect(where.stock).toEqual({ gt: 0 });
    expect(orderBy).toEqual({ price: "asc" });
    expect(take).toBe(20);
    expect(skip).toBe(20); // (2 - 1) * 20
  });

  it("handles department translation into subcategories where clause", () => {
    const { where } = buildPrismaProductQuery({
      department: "Precision Studio Moulds"
    });
    expect(where.category).toHaveProperty("in");
    expect((where.category as any).in).toContain("Candle & Pillar Moulds");
    expect((where.category as any).in).toContain("Eco-Resin & Stone Moulds");
  });

  it("executes the Prisma path with a mocked PrismaClient", async () => {
    const mockDbProducts = [
      {
        id: "prod_db_1",
        title: "DB Organic Soy Wax 1kg",
        category: "Candle Waxes & Additives",
        price: 35000, // 35000 paise = ₹350
        customerPrice: 35000,
        imageUrl: "/db-soy.jpg",
        stock: 50,
        wholesaleTiers: [{ minQty: 10, price: 30000 }],
        description: "Verified supplier soy wax",
        sellerId: "seller_1",
      },
      {
        id: "prod_db_2",
        title: "DB Beeswax Pellets 1kg",
        category: "Candle Waxes & Additives",
        price: 55000, // 55000 paise = ₹550
        customerPrice: 55000,
        imageUrl: "/db-beeswax.jpg",
        stock: 20,
        wholesaleTiers: [],
        description: "Pure beeswax",
        sellerId: "seller_2",
      }
    ];

    const mockPrisma = {
      product: {
        findMany: vi.fn().mockResolvedValue(mockDbProducts),
        count: vi.fn().mockResolvedValue(2),
      }
    };

    const { where, orderBy, take, skip } = buildPrismaProductQuery({
      category: "Candle Waxes & Additives",
      sort: "price_asc",
      page: 1,
      limit: 10
    });

    const [dbProducts, total] = await Promise.all([
      mockPrisma.product.findMany({ where, orderBy, take, skip }),
      mockPrisma.product.count({ where })
    ]);

    expect(total).toBe(2);
    expect(dbProducts).toHaveLength(2);
    expect(dbProducts[0].price / 100).toBe(350);
    expect(dbProducts[1].price / 100).toBe(550);
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith({ where, orderBy, take, skip });
  });
});

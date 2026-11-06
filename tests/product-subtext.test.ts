import { describe, it, expect } from "vitest";
import {
  getProductApplicationSubtext,
  CATEGORY_APPLICATION_SUBTEXT,
  DEPARTMENT_FALLBACK_SUBTEXT,
  DEFAULT_APPLICATION_SUBTEXT,
} from "@/lib/catalog-subtext";
import catalogProducts from "@/lib/data/products.json";

describe("Product Application Subtext Mapper", () => {
  it("returns candle-specific subtext for Candle Waxes & Additives", () => {
    const subtext = getProductApplicationSubtext("Candle Waxes & Additives");
    expect(subtext).toContain("candles & wax melts");
    expect(subtext).not.toContain("reed diffusers & studio craft formulations");
  });

  it("returns packaging-specific subtext for Packaging Boxes & Mailers", () => {
    const subtext = getProductApplicationSubtext("Packaging Boxes & Mailers");
    expect(subtext).toContain("corrugated mailers & presentation packaging");
  });

  it("returns stone/eco-resin subtext for Eco-Resin & Stone Moulds", () => {
    const subtext = getProductApplicationSubtext("Eco-Resin & Stone Moulds");
    expect(subtext).toContain("Jesmonite, gypsum, acrylic composite & concrete");
  });

  it("returns culinary subtext for Food-Grade Flavor Oils", () => {
    const subtext = getProductApplicationSubtext("Food-Grade Flavor Oils");
    expect(subtext).toContain("Lip-safe & culinary-grade flavorings");
  });

  it("returns fragrance subtext for Fragrance Oils", () => {
    const subtext = getProductApplicationSubtext("Fragrance Oils");
    expect(subtext).toContain("Concentrated IFRA-compliant aroma oils");
  });

  it("falls back to department subtext when category is unknown", () => {
    const subtext = getProductApplicationSubtext("Nonexistent Category", "Vessels & Packaging Studio");
    expect(subtext).toBe(DEPARTMENT_FALLBACK_SUBTEXT["Vessels & Packaging Studio"]);
  });

  it("falls back to default subtext when both category and department are missing", () => {
    expect(getProductApplicationSubtext(null, null)).toBe(DEFAULT_APPLICATION_SUBTEXT);
    expect(getProductApplicationSubtext(undefined, undefined)).toBe(DEFAULT_APPLICATION_SUBTEXT);
  });

  it("ensures every catalog product category in products.json resolves cleanly", () => {
    const uniqueCategories = new Set(catalogProducts.map((p: any) => p.category).filter(Boolean));
    for (const cat of uniqueCategories) {
      const subtext = getProductApplicationSubtext(cat);
      expect(subtext).toBeTruthy();
      expect(typeof subtext).toBe("string");
      expect(subtext.length).toBeGreaterThan(10);
    }
  });
});

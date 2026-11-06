import { describe, it, expect } from "vitest";
import {
  roundPrice,
  getRoundingStep,
  calculateGST,
  roundTiersWithDiscountPriority,
  formatINR,
  formatPaise,
  DEFAULT_ROUNDING_CONFIG,
} from "@/lib/pricing-rounding";

describe("Price Rounding Engine (roundPrice)", () => {
  describe("Band 1: Under ₹500 (Step = ₹5)", () => {
    it("leaves already-rounded multiples of 5 unchanged", () => {
      expect(roundPrice(5)).toBe(5);
      expect(roundPrice(25)).toBe(25);
      expect(roundPrice(125)).toBe(125);
      expect(roundPrice(495)).toBe(495);
    });

    it("rounds 499 to 500 (edge under 500, +0.20% <= 2%)", () => {
      expect(roundPrice(499)).toBe(500);
    });

    it("rounds 492 to 490 (nearest 5 downward) and 493 to 495 (+0.41% <= 2%)", () => {
      expect(roundPrice(492)).toBe(490);
      expect(roundPrice(493)).toBe(495);
    });

    it("rounds 104 to 105 (+0.96% <= 2%)", () => {
      expect(roundPrice(104)).toBe(105);
    });

    it("rounds 101 to 100 (downward rounding)", () => {
      expect(roundPrice(101)).toBe(100);
    });

    it("enforces 2% cap: rounds 48 down to 45 instead of 50 (+4.17% > 2%)", () => {
      expect(roundPrice(48)).toBe(45);
    });

    it("enforces 2% cap: rounds 83 down to 80 instead of 85 (+2.41% > 2%)", () => {
      expect(roundPrice(83)).toBe(80);
    });

    it("safeguards very low prices against rounding down to 0", () => {
      expect(roundPrice(3)).toBeGreaterThan(0);
      expect(roundPrice(1)).toBeGreaterThan(0);
    });
  });

  describe("Band 2: ₹500 to ₹5,000 (Step = ₹50)", () => {
    it("leaves exact multiples of 50 unchanged", () => {
      expect(roundPrice(500)).toBe(500);
      expect(roundPrice(750)).toBe(750);
      expect(roundPrice(2400)).toBe(2400);
      expect(roundPrice(4950)).toBe(4950);
    });

    it("rounds 4990 to 5000 (+0.20% <= 2%)", () => {
      expect(roundPrice(4990)).toBe(5000);
    });

    it("rounds 520 to 500 (downward rounding)", () => {
      expect(roundPrice(520)).toBe(500);
    });

    it("enforces 2% cap: rounds 530 down to 500 instead of 550 (+3.77% > 2%)", () => {
      expect(roundPrice(530)).toBe(500);
    });

    it("rounds 3440 to 3450 (+0.29% <= 2%)", () => {
      expect(roundPrice(3440)).toBe(3450);
    });
  });

  describe("Band 3: ₹5,000 to ₹50,000 (Step = ₹100)", () => {
    it("leaves exact multiples of 100 unchanged", () => {
      expect(roundPrice(5000)).toBe(5000);
      expect(roundPrice(12500)).toBe(12500);
      expect(roundPrice(49900)).toBe(49900);
      expect(roundPrice(50000)).toBe(50000);
    });

    it("rounds 5060 to 5100 (+0.79% <= 2%)", () => {
      expect(roundPrice(5060)).toBe(5100);
    });

    it("rounds 5010 to 5000 (downward rounding)", () => {
      expect(roundPrice(5010)).toBe(5000);
    });

    it("rounds 49980 to 50000 (+0.04% <= 2%)", () => {
      expect(roundPrice(49980)).toBe(50000);
    });
  });

  describe("Band 4: Above ₹50,000 (Step = ₹500)", () => {
    it("leaves exact multiples of 500 unchanged", () => {
      expect(roundPrice(50500)).toBe(50500);
      expect(roundPrice(100000)).toBe(100000);
    });

    it("rounds 54200 to 54000 (downward rounding)", () => {
      expect(roundPrice(54200)).toBe(54000);
    });

    it("rounds 54300 to 54500 (+0.37% <= 2%)", () => {
      expect(roundPrice(54300)).toBe(54500);
    });

    it("rounds 75450 to 75500 (+0.07% <= 2%)", () => {
      expect(roundPrice(75450)).toBe(75500);
    });
  });

  describe("Invalid & Edge Inputs", () => {
    it("handles 0 or negative numbers safely", () => {
      expect(roundPrice(0)).toBe(0);
      expect(roundPrice(-10)).toBe(-10);
    });

    it("handles non-numeric safely", () => {
      expect(roundPrice(NaN as any)).toBe(0);
      expect(roundPrice("100" as any)).toBe(0);
    });
  });
});

describe("Option C: Internal GST Calculation (All-Inclusive Pricing)", () => {
  it("extracts 18% GST and taxable base from rounded gross price", () => {
    // For a rounded item price of ₹118, qty = 1:
    // Gross: ₹118
    // Taxable base: ₹118 / 1.18 = ₹100.00
    // GST (18%): ₹18.00
    // Final total: ₹118 (exact match)
    const res = calculateGST(118, 18, 1);
    expect(res.grossTotal).toBe(118);
    expect(res.taxableValue).toBe(100);
    expect(res.gstAmount).toBe(18);
    expect(res.finalTotal).toBe(118);
  });

  it("handles fractional tax extractions accurately for invoice display", () => {
    // For ₹125:
    // Taxable base: 125 / 1.18 = 105.93
    // GST (18%): 19.07
    // Total before round-off: 125.00
    // Final total: 125
    const res = calculateGST(125, 18, 1);
    expect(res.grossTotal).toBe(125);
    expect(res.taxableValue).toBe(105.93);
    expect(res.gstAmount).toBe(19.07);
    expect(res.finalTotal).toBe(125);
  });
});

describe("Bulk Slabs: % Off Prioritized Over Rounding Off", () => {
  it("prioritizes % off over rounding off and prevents slab collision", () => {
    // Product originally ₹83 (rounds down to ₹80)
    // Tier 1: ₹83 (1-9) -> ₹80
    // Tier 2: ₹79 (10-49) (target ~5% off) -> must NOT round up to ₹80!
    // Must step down to at least ₹75 (or <= ₹76) so 5% off is preserved!
    const roundedBase = 80;
    const rawBase = 83;
    const tiers = [
      { minQty: 1, price: 83, discountPct: 0 },
      { minQty: 10, price: 79, discountPct: 5 },
      { minQty: 50, price: 75, discountPct: 10 },
    ];

    const res = roundTiersWithDiscountPriority(roundedBase, rawBase, tiers);
    expect(res.hasBreaks).toBe(false);
    expect(res.tiers[0].price).toBe(80);
    expect(res.tiers[1].price).toBeLessThan(80);
    expect(res.tiers[2].price).toBeLessThan(res.tiers[1].price);

    // Verify discount % is strictly respected (>= target discount)
    expect(res.tiers[1].discountPct).toBeGreaterThanOrEqual(5);
    expect(res.tiers[2].discountPct).toBeGreaterThanOrEqual(10);
  });

  it("resolves the SKU 3084 Bentonite Clay slab collision", () => {
    // Originally ₹41 (rounds down to ₹40)
    // Tier 1: 41 (0%) -> 40
    // Tier 2: 39 (5%) -> target max: 40 * 0.95 = 38 -> floor to 35
    // Tier 3: 37 (10%) -> target max: 40 * 0.90 = 36 -> must be strictly < 35 -> step down to 30
    const roundedBase = 40;
    const rawBase = 41;
    const tiers = [
      { minQty: 1, price: 41, discountPct: 0 },
      { minQty: 10, price: 39, discountPct: 5 },
      { minQty: 50, price: 37, discountPct: 10 },
    ];

    const res = roundTiersWithDiscountPriority(roundedBase, rawBase, tiers);
    expect(res.hasBreaks).toBe(false);
    expect(res.tiers[0].price).toBe(40);
    expect(res.tiers[1].price).toBe(35);
    expect(res.tiers[2].price).toBe(30);
    expect(res.tiers[1].discountPct).toBeGreaterThanOrEqual(5);
    expect(res.tiers[2].discountPct).toBeGreaterThanOrEqual(10);
  });

  it("handles percentage-only tiers correctly", () => {
    const roundedBase = 1000;
    const rawBase = 1000;
    const tiers = [
      { minQuantity: 1, discount: 0 },
      { minQuantity: 12, discount: 10 }, // 10% off -> 900
      { minQuantity: 52, discount: 20 }, // 20% off -> 800
    ];

    const res = roundTiersWithDiscountPriority(roundedBase, rawBase, tiers);
    expect(res.hasBreaks).toBe(false);
    expect(res.tiers[0].price).toBe(1000);
    expect(res.tiers[1].price).toBe(900);
    expect(res.tiers[2].price).toBe(800);
  });
});

describe("Centralized Currency Formatter", () => {
  it("formats Indian Rupees correctly without decimals by default", () => {
    expect(formatINR(125)).toBe("₹125");
    expect(formatINR(5000)).toBe("₹5,000");
  });

  it("formats paise correctly", () => {
    expect(formatPaise(12500)).toBe("₹125");
    expect(formatPaise(500000)).toBe("₹5,000");
  });
});

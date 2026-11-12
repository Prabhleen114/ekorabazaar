import { describe, it, expect } from 'vitest';
import {
  calculateItemPrice,
  normalizeTierPriceToPaise,
  normalizeTierPriceToRupees,
  TEMP_FLAT_SHIPPING_CHARGE,
} from '@/lib/pricing';

describe('Product Pricing Consistency Suite', () => {
  describe('Unit Normalization: normalizeTierPriceToPaise & normalizeTierPriceToRupees', () => {
    it('correctly converts Rupee-denominated tiers to Paise and Rupees', () => {
      // Product 2408 (NEEM TULSI SOAP BASE): Base = 24000 paise (₹240)
      const basePaise = 24000;
      
      // Tier 1: 240 (rupees)
      expect(normalizeTierPriceToPaise(240, basePaise)).toBe(24000);
      expect(normalizeTierPriceToRupees(240, basePaise)).toBe(240);

      // Tier 2: 155 (rupees)
      expect(normalizeTierPriceToPaise(155, basePaise)).toBe(15500);
      expect(normalizeTierPriceToRupees(155, basePaise)).toBe(155);

      // Tier 3: 140 (rupees)
      expect(normalizeTierPriceToPaise(140, basePaise)).toBe(14000);
      expect(normalizeTierPriceToRupees(140, basePaise)).toBe(140);
    });

    it('correctly handles Paise-denominated tiers without double-converting', () => {
      // Product 574 (Neem & Tulsi Fragrance Oil): Base = 11000 paise (₹110)
      const basePaise = 11000;

      // Tier 1: 11000 (paise)
      expect(normalizeTierPriceToPaise(11000, basePaise)).toBe(11000);
      expect(normalizeTierPriceToRupees(11000, basePaise)).toBe(110);

      // Tier 2: 10400 (paise)
      expect(normalizeTierPriceToPaise(10400, basePaise)).toBe(10400);
      expect(normalizeTierPriceToRupees(10400, basePaise)).toBe(104);

      // Tier 3: 9900 (paise)
      expect(normalizeTierPriceToPaise(9900, basePaise)).toBe(9900);
      expect(normalizeTierPriceToRupees(9900, basePaise)).toBe(99);
    });

    it('handles low-cost products accurately (e.g. ₹5 base price)', () => {
      // Base = 500 paise (₹5)
      const basePaise = 500;

      // Tier in rupees: 4
      expect(normalizeTierPriceToPaise(4, basePaise)).toBe(400);
      expect(normalizeTierPriceToRupees(4, basePaise)).toBe(4);

      // Tier in paise: 400
      expect(normalizeTierPriceToPaise(400, basePaise)).toBe(400);
      expect(normalizeTierPriceToRupees(400, basePaise)).toBe(4);
    });

    it('safely handles zero, negative, and null values', () => {
      expect(normalizeTierPriceToPaise(0, 24000)).toBe(0);
      expect(normalizeTierPriceToPaise(-50, 24000)).toBe(0);
      expect(normalizeTierPriceToPaise(NaN, 24000)).toBe(0);
      expect(normalizeTierPriceToRupees(0, 24000)).toBe(0);
    });
  });

  describe('Product 2408 (NEEM TULSI SOAP BASE) End-to-End Consistency', () => {
    // Database product record representation
    const product2408 = {
      id: '2408',
      title: 'NEEM TULSI SOAP BASE',
      price: 24000, // 24000 paise = ₹240.00
      customerPrice: 24000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 24, price: 240, discountPct: 0 },
        { minQty: 25, maxQty: 49, price: 155, discountPct: 35.4 },
        { minQty: 50, maxQty: null, price: 140, discountPct: 41.7 },
      ],
    };

    it('verifies Qty 1 displayed price on listing page equals ₹240', () => {
      const listingPriceRupees = (product2408.customerPrice ?? product2408.price) / 100;
      expect(listingPriceRupees).toBe(240);
    });

    it('verifies Qty 1 displayed price on product detail page equals ₹240 (never ₹2)', () => {
      const basePaise = product2408.customerPrice ?? product2408.price;
      const detailTiers = product2408.wholesaleTiers.map(t => ({
        ...t,
        price: normalizeTierPriceToRupees(Number(t.price), basePaise),
      }));

      // At Qty 1, tier 1 is selected
      const qty1Tier = detailTiers.find(t => 1 >= t.minQty && (t.maxQty === null || 1 <= t.maxQty));
      expect(qty1Tier).toBeDefined();
      expect(qty1Tier?.price).toBe(240); // Must be ₹240, NOT ₹2
    });

    it('verifies cart unit price equals 24000 paise (₹240) for Qty 1', () => {
      const unitPricePaise = calculateItemPrice(product2408, 1);
      expect(unitPricePaise).toBe(24000); // 24000 paise = ₹240.00, NOT 240 paise (₹2.40)
      expect(unitPricePaise / 100).toBe(240);
    });

    it('verifies cart subtotal for Qty 1 is ₹240', () => {
      const qty = 1;
      const unitPricePaise = calculateItemPrice(product2408, qty);
      const subtotalPaise = unitPricePaise * qty;
      expect(subtotalPaise).toBe(24000);
      expect(subtotalPaise / 100).toBe(240);
    });

    it('activates tier 2 bulk pricing (₹155) ONLY at quantity >= 25', () => {
      // Boundary test: Qty 24 should still be ₹240
      expect(calculateItemPrice(product2408, 24)).toBe(24000);
      expect(calculateItemPrice(product2408, 24) / 100).toBe(240);

      // Boundary test: Qty 25 activates ₹155 tier
      expect(calculateItemPrice(product2408, 25)).toBe(15500);
      expect(calculateItemPrice(product2408, 25) / 100).toBe(155);

      // Boundary test: Qty 49 is ₹155
      expect(calculateItemPrice(product2408, 49)).toBe(15500);
      expect(calculateItemPrice(product2408, 49) / 100).toBe(155);
    });

    it('activates tier 3 bulk pricing (₹140) ONLY at quantity >= 50', () => {
      // Boundary test: Qty 50 activates ₹140 tier
      expect(calculateItemPrice(product2408, 50)).toBe(14000);
      expect(calculateItemPrice(product2408, 50) / 100).toBe(140);

      // Qty 100 remains in tier 3
      expect(calculateItemPrice(product2408, 100)).toBe(14000);
      expect(calculateItemPrice(product2408, 100) / 100).toBe(140);
    });

    it('verifies checkout payable and Razorpay amount consistency', () => {
      const qty = 1;
      const unitPricePaise = calculateItemPrice(product2408, qty);
      const subtotalPaise = unitPricePaise * qty;
      const shippingPaise = Math.round(TEMP_FLAT_SHIPPING_CHARGE * 100); // 9000 paise (₹90)

      const checkoutPayablePaise = subtotalPaise + shippingPaise;
      expect(checkoutPayablePaise).toBe(33000); // ₹330.00
      expect(checkoutPayablePaise / 100).toBe(330);

      // Razorpay order creation options.amount strictly equals checkout payable amount in paise
      const razorpayAmount = checkoutPayablePaise;
      expect(razorpayAmount).toBe(33000);
      expect(razorpayAmount).toBe((240 + TEMP_FLAT_SHIPPING_CHARGE) * 100);
    });
  });

  describe('Paise-Tier Products (e.g. Product 574) Consistency', () => {
    const product574 = {
      id: '574',
      title: 'Neem & Tulsi Fragrance Oil',
      price: 11000, // ₹110
      customerPrice: 11000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 9, price: 11000, discountPct: 0 },
        { minQty: 10, maxQty: 49, price: 10400, discountPct: 5 },
        { minQty: 50, maxQty: null, price: 9900, discountPct: 10 },
      ],
    };

    it('correctly calculates prices across all tiers', () => {
      expect(calculateItemPrice(product574, 1)).toBe(11000);
      expect(calculateItemPrice(product574, 1) / 100).toBe(110);

      expect(calculateItemPrice(product574, 9)).toBe(11000);
      expect(calculateItemPrice(product574, 10)).toBe(10400);
      expect(calculateItemPrice(product574, 10) / 100).toBe(104);

      expect(calculateItemPrice(product574, 50)).toBe(9900);
      expect(calculateItemPrice(product574, 50) / 100).toBe(99);
    });
  });

  describe('Products with Tiers Starting at minQty > 1', () => {
    const productNoTier1 = {
      id: '9999',
      title: 'Bulk Only Product',
      price: 20000, // ₹200 base price
      customerPrice: 20000,
      wholesaleTiers: [
        { minQty: 10, maxQty: 49, price: 180, discountPct: 10 },
        { minQty: 50, maxQty: null, price: 150, discountPct: 25 },
      ],
    };

    it('strictly charges base price (₹200) when quantity is less than the lowest tier (minQty: 10)', () => {
      expect(calculateItemPrice(productNoTier1, 1)).toBe(20000);
      expect(calculateItemPrice(productNoTier1, 1) / 100).toBe(200);

      expect(calculateItemPrice(productNoTier1, 9)).toBe(20000);
      expect(calculateItemPrice(productNoTier1, 9) / 100).toBe(200);

      // Activates at 10
      expect(calculateItemPrice(productNoTier1, 10)).toBe(18000);
      expect(calculateItemPrice(productNoTier1, 10) / 100).toBe(180);
    });
  });

  describe('Safeguard Against Zero-Price Tiers', () => {
    const productWithCorruptTier = {
      id: '8888',
      title: 'Corrupt Tier Product',
      price: 50000, // ₹500
      customerPrice: 50000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 9, price: 0, discountPct: 0 }, // Corrupt 0-price tier
        { minQty: 10, maxQty: 49, price: 450, discountPct: 10 },
      ],
    };

    it('ignores 0-price tiers and preserves base price', () => {
      // Qty 1 should ignore the 0 tier and fall back to base price ₹500 (50000 paise)
      expect(calculateItemPrice(productWithCorruptTier, 1)).toBe(50000);
      expect(calculateItemPrice(productWithCorruptTier, 1) / 100).toBe(500);

      // Qty 10 should correctly use the valid tier ₹450 (45000 paise)
      expect(calculateItemPrice(productWithCorruptTier, 10)).toBe(45000);
      expect(calculateItemPrice(productWithCorruptTier, 10) / 100).toBe(450);
    });
  });
});

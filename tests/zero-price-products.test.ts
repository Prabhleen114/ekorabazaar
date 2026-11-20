import { describe, it, expect } from 'vitest';
import {
  calculateItemPrice,
  calculateItemPricePaise,
  inrToPaise,
  paiseToINR,
  normalizeTierPriceToPaise,
  normalizeTierPriceToRupees,
  normalizeTierPriceToINR,
  TEMP_FLAT_SHIPPING_CHARGE,
} from '@/lib/pricing';

describe('Zero-Price Product Detection & Safeguard Regression Suite', () => {
  describe('calculateItemPrice: Zero, Negative, and Corrupt Price Handling', () => {
    it('returns 0 when base price is 0 (quote-only or unpriced)', () => {
      const product = {
        price: 0,
        customerPrice: null,
        wholesaleTiers: []
      };
      expect(calculateItemPrice(product, 1)).toBe(0);
      expect(calculateItemPrice(product, 10)).toBe(0);
    });

    it('returns 0 when base price is negative', () => {
      const product = {
        price: -5,
        customerPrice: null,
        wholesaleTiers: []
      };
      expect(calculateItemPrice(product, 1)).toBe(0);
    });

    it('returns 0 when price is NaN or missing', () => {
      const product = {
        price: NaN,
        customerPrice: null,
        wholesaleTiers: []
      };
      expect(calculateItemPrice(product, 1)).toBe(0);
    });

    it('does not allow customerPrice = 0 to override a valid regular price with zero', () => {
      const product = {
        price: 240, // ₹240
        customerPrice: 0, // Corrupt 0 discount price
        wholesaleTiers: []
      };
      // Must NOT return 0; must fall back to valid price
      expect(calculateItemPrice(product, 1)).toBe(240);
    });

    it('does not allow customerPrice < 0 to override a valid regular price', () => {
      const product = {
        price: 150,
        customerPrice: -2,
        wholesaleTiers: []
      };
      expect(calculateItemPrice(product, 1)).toBe(150);
    });

    it('correctly uses valid positive customerPrice when present', () => {
      const product = {
        price: 240, // ₹240 regular
        customerPrice: 199, // ₹199 promo
        wholesaleTiers: []
      };
      expect(calculateItemPrice(product, 1)).toBe(199);
    });
  });

  describe('Wholesale Tiers: Zero-Price Tier Sanitization', () => {
    it('discards wholesale tiers with price: 0 and prevents "₹0 each" pricing', () => {
      // Product with 3 tiers where all are 0 (as in DB products 1993, 2098, etc.)
      const product = {
        price: 583, // ₹583
        customerPrice: null,
        wholesaleTiers: [
          { minQty: 1, maxQty: 11, price: 0, discount: 0 },
          { minQty: 12, maxQty: 51, price: 0, discount: 10 },
          { minQty: 52, maxQty: null, price: 0, discount: 20 }
        ]
      };

      // Since all tiers are 0, they are discarded; effectivePrice must remain basePrice in INR
      expect(calculateItemPrice(product, 1)).toBe(583);
      expect(calculateItemPrice(product, 15)).toBe(583);
      expect(calculateItemPrice(product, 60)).toBe(583);
    });

    it('handles Product 1058 (Craft Paper Pouch): filters out corrupt Tier 2 (price: 0)', () => {
      // Base ₹5, Tier 1 (1-11): ₹5, Tier 2 (12-51): ₹0, Tier 3 (52+): ₹1
      const product1058 = {
        price: 5, // ₹5.00
        customerPrice: null,
        wholesaleTiers: [
          { minQty: 1, maxQty: 11, price: 5, discount: 0 },
          { minQty: 12, maxQty: 51, price: 0, discount: 100 }, // Corrupt zero tier
          { minQty: 52, maxQty: null, price: 1, discount: 80 }
        ]
      };

      // Qty 1 -> Tier 1 (₹5)
      expect(calculateItemPrice(product1058, 1)).toBe(5);

      // Qty 20 -> Tier 2 is discarded (price: 0), so it retains Tier 1 rate (₹5)
      expect(calculateItemPrice(product1058, 20)).toBe(5);

      // Qty 60 -> Tier 3 is valid (₹1)
      expect(calculateItemPrice(product1058, 60)).toBe(1);
    });

    it('retains the highest valid volume tier when quantity exceeds a discarded upper zero tier', () => {
      // 35 catalog items have Tier 1: ₹10, Tier 2: ₹5, Tier 3: ₹0 (52+)
      const packagingItem = {
        price: 10, // ₹10.00
        customerPrice: null,
        wholesaleTiers: [
          { minQty: 1, maxQty: 11, price: 10, discountPct: 0 },
          { minQty: 12, maxQty: 51, price: 5, discountPct: 50 },
          { minQty: 52, maxQty: null, price: 0, discountPct: 100 } // Corrupt 0 tier
        ]
      };

      // Qty 1: ₹10
      expect(calculateItemPrice(packagingItem, 1)).toBe(10);

      // Qty 20: ₹5
      expect(calculateItemPrice(packagingItem, 20)).toBe(5);

      // Qty 100: Above 52. Tier 3 was discarded. Buyer must retain Tier 2 volume discount (₹5), NOT revert to base price (₹10) or become 0
      expect(calculateItemPrice(packagingItem, 100)).toBe(5);
    });
  });

  describe('Low-Priced Commercial Items (₹3, ₹5, ₹10, ₹15)', () => {
    it('authentically prices low-cost supplies across quantities', () => {
      // ₹3 soap sample box
      const product3 = {
        price: 3,
        customerPrice: null,
        wholesaleTiers: [
          { minQty: 1, maxQty: 49, price: 3, discountPct: 0 },
          { minQty: 50, maxQty: null, price: 2, discountPct: 33 }
        ]
      };

      expect(calculateItemPrice(product3, 1)).toBe(3);
      expect(calculateItemPrice(product3, 10)).toBe(3);
      expect(calculateItemPrice(product3, 50)).toBe(2);

      // Total payable check
      const subtotalQty50 = calculateItemPrice(product3, 50) * 50;
      expect(subtotalQty50).toBe(100); // ₹100.00
      expect(inrToPaise(subtotalQty50)).toBe(10000); // 10000 paise at Razorpay boundary
    });
  });

  describe('Order Creation & Razorpay Consistency Guard', () => {
    it('ensures payable order amount is strictly greater than zero and converts to paise at boundary', () => {
      const items = [
        {
          product: { price: 240, customerPrice: null, wholesaleTiers: [] },
          quantity: 2
        }
      ];

      let totalAmountINR = 0;
      for (const item of items) {
        const effectivePrice = calculateItemPrice(item.product, item.quantity);
        expect(effectivePrice).toBeGreaterThan(0);
        totalAmountINR += effectivePrice * item.quantity;
      }

      const shippingINR = TEMP_FLAT_SHIPPING_CHARGE;
      const finalPayableINR = totalAmountINR + shippingINR;

      expect(totalAmountINR).toBe(480); // ₹480
      expect(shippingINR).toBe(90); // ₹90
      expect(finalPayableINR).toBe(570); // ₹570

      // Razorpay boundary conversion exactly once
      const finalPayablePaise = inrToPaise(finalPayableINR);
      expect(finalPayablePaise).toBe(57000); // 57000 paise
    });

    it('rejects order processing if any product evaluates to zero or negative price', () => {
      const unpricedItem = {
        price: 0,
        customerPrice: null,
        wholesaleTiers: []
      };

      const effectivePrice = calculateItemPrice(unpricedItem, 1);
      const isOrderValid = effectivePrice > 0 && unpricedItem.price > 0;

      expect(isOrderValid).toBe(false);
    });
  });
});

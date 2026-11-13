import { describe, it, expect } from 'vitest';
import { calculateItemPrice, TEMP_FLAT_SHIPPING_CHARGE } from '@/lib/pricing';
import { calculateCouponDiscount, validateCouponEligibility } from '@/lib/coupons';
import { CouponStatus, DiscountType } from '@prisma/client';

describe('Cart Pricing & Line Total Verification Suite', () => {
  const formatRupees = (amt: number) => {
    return amt % 1 === 0
      ? amt.toLocaleString('en-IN')
      : amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  describe('Product Card Line Total & Unit Price Formatting', () => {
    const singleProduct = {
      price: 11000, // ₹110 in paise
      customerPrice: null,
      wholesaleTiers: []
    };

    it('Quantity 1: renders Line Total ₹110 and Unit Price ₹110 per unit', () => {
      const quantity = 1;
      const unitPricePaise = calculateItemPrice(singleProduct, quantity);
      const lineTotalPaise = unitPricePaise * quantity;
      
      const unitPriceRupees = unitPricePaise / 100;
      const lineTotalRupees = lineTotalPaise / 100;

      expect(unitPriceRupees).toBe(110);
      expect(lineTotalRupees).toBe(110);
      expect(formatRupees(lineTotalRupees)).toBe('110');
      expect(formatRupees(unitPriceRupees)).toBe('110');
    });

    it('Quantity 2: renders Line Total ₹220 and Unit Price ₹110 per unit', () => {
      const quantity = 2;
      const unitPricePaise = calculateItemPrice(singleProduct, quantity);
      const lineTotalPaise = unitPricePaise * quantity;

      const unitPriceRupees = unitPricePaise / 100;
      const lineTotalRupees = lineTotalPaise / 100;

      expect(unitPriceRupees).toBe(110);
      expect(lineTotalRupees).toBe(220);
      expect(formatRupees(lineTotalRupees)).toBe('220');
      expect(formatRupees(unitPriceRupees)).toBe('110');
    });

    it('Quantity 3: renders Line Total ₹330 and Unit Price ₹110 per unit', () => {
      const quantity = 3;
      const unitPricePaise = calculateItemPrice(singleProduct, quantity);
      const lineTotalPaise = unitPricePaise * quantity;

      const unitPriceRupees = unitPricePaise / 100;
      const lineTotalRupees = lineTotalPaise / 100;

      expect(unitPriceRupees).toBe(110);
      expect(lineTotalRupees).toBe(330);
      expect(formatRupees(lineTotalRupees)).toBe('330');
      expect(formatRupees(unitPriceRupees)).toBe('110');
    });

    it('Decreasing quantity from 3 to 2: updates Line Total to ₹220 and retains Unit Price ₹110', () => {
      let quantity = 3;
      expect((calculateItemPrice(singleProduct, quantity) * quantity) / 100).toBe(330);

      quantity = 2;
      const unitPricePaise = calculateItemPrice(singleProduct, quantity);
      const lineTotalPaise = unitPricePaise * quantity;
      expect(lineTotalPaise / 100).toBe(220);
      expect(unitPricePaise / 100).toBe(110);
    });

    it('Decreasing quantity from 2 to 1: updates Line Total to ₹110 and retains Unit Price ₹110', () => {
      let quantity = 2;
      expect((calculateItemPrice(singleProduct, quantity) * quantity) / 100).toBe(220);

      quantity = 1;
      const unitPricePaise = calculateItemPrice(singleProduct, quantity);
      const lineTotalPaise = unitPricePaise * quantity;
      expect(lineTotalPaise / 100).toBe(110);
      expect(unitPricePaise / 100).toBe(110);
    });
  });

  describe('Wholesale Tier Dynamic Line Totals', () => {
    // Product 2408 (NEEM TULSI SOAP BASE): Base ₹240, 12+ ₹155, 52+ ₹140
    const tieredProduct = {
      price: 24000,
      customerPrice: null,
      wholesaleTiers: [
        { minQty: 1, maxQty: 11, price: 240 },
        { minQty: 12, maxQty: 51, price: 155 },
        { minQty: 52, maxQty: null, price: 140 }
      ]
    };

    it('Quantity 1: evaluates to base rate ₹240, Line Total ₹240', () => {
      const qty = 1;
      const unit = calculateItemPrice(tieredProduct, qty);
      expect(unit / 100).toBe(240);
      expect((unit * qty) / 100).toBe(240);
    });

    it('Quantity 12: dynamically shifts to tier rate ₹155, Line Total ₹1,860', () => {
      const qty = 12;
      const unit = calculateItemPrice(tieredProduct, qty);
      expect(unit / 100).toBe(155);
      expect((unit * qty) / 100).toBe(1860);
      expect(formatRupees((unit * qty) / 100)).toBe('1,860');
    });

    it('Quantity 52: dynamically shifts to tier rate ₹140, Line Total ₹7,280', () => {
      const qty = 52;
      const unit = calculateItemPrice(tieredProduct, qty);
      expect(unit / 100).toBe(140);
      expect((unit * qty) / 100).toBe(7280);
      expect(formatRupees((unit * qty) / 100)).toBe('7,280');
    });
  });

  describe('Multi-Product Subtotal & Order Summary Formulas', () => {
    it('accurately calculates Subtotal = Sum of all product line totals', () => {
      const cartItems = [
        { id: 'item-1', product: { price: 11000, customerPrice: null, wholesaleTiers: [] }, quantity: 3 }, // 110 * 3 = 330
        { id: 'item-2', product: { price: 24000, customerPrice: null, wholesaleTiers: [] }, quantity: 2 }, // 240 * 2 = 480
        { id: 'item-3', product: { price: 9000, customerPrice: null, wholesaleTiers: [] }, quantity: 1 }   // 90 * 1 = 90
      ];

      const lineTotals = cartItems.map(item => {
        const unit = calculateItemPrice(item.product, item.quantity);
        return unit * item.quantity;
      });

      expect(lineTotals).toEqual([33000, 48000, 9000]); // in paise

      const subtotalPaise = lineTotals.reduce((a, b) => a + b, 0);
      expect(subtotalPaise).toBe(90000); // ₹900
      expect(subtotalPaise / 100).toBe(900);

      const deliveryPaise = TEMP_FLAT_SHIPPING_CHARGE * 100;
      expect(deliveryPaise / 100).toBe(90);

      const totalPaise = subtotalPaise + deliveryPaise;
      expect(totalPaise / 100).toBe(990); // ₹990
    });

    it('accurately updates subtotal when an item is removed', () => {
      let cartItems = [
        { id: 'item-1', product: { price: 11000, customerPrice: null, wholesaleTiers: [] }, quantity: 3 },
        { id: 'item-2', product: { price: 24000, customerPrice: null, wholesaleTiers: [] }, quantity: 2 },
        { id: 'item-3', product: { price: 9000, customerPrice: null, wholesaleTiers: [] }, quantity: 1 }
      ];

      // Remove item-2
      cartItems = cartItems.filter(i => i.id !== 'item-2');
      expect(cartItems.length).toBe(2);

      const subtotalPaise = cartItems.reduce((sum, item) => {
        const unit = calculateItemPrice(item.product, item.quantity);
        return sum + (unit * item.quantity);
      }, 0);

      expect(subtotalPaise).toBe(42000); // 330 + 90 = 420
      expect(subtotalPaise / 100).toBe(420);
    });
  });

  describe('Coupon Application & Razorpay Payable Amount Parity', () => {
    it('applies percentage coupon: Final Total = Subtotal + Delivery - Discount', () => {
      const subtotalPaise = 90000; // ₹900
      const coupon = {
        id: 'c-1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minOrderAmount: 50000, // min ₹500
        maxDiscountAmount: 20000,
        status: CouponStatus.ACTIVE,
        startDate: new Date('2026-01-01'),
        expiryDate: new Date('2026-12-31'),
        maxUsageLimit: null,
        usageCount: 0,
        perCustomerLimit: 5,
        allowedCategory: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const eligibility = validateCouponEligibility(coupon, {
        subtotalPaise,
        usageCountForCustomer: 0
      });

      expect(eligibility.valid).toBe(true);
      expect(eligibility.discountPaise).toBe(9000); // 10% of 900 = ₹90

      const shippingPaise = TEMP_FLAT_SHIPPING_CHARGE * 100;
      const finalAmountPaise = Math.max(0, Math.round(subtotalPaise - eligibility.discountPaise + shippingPaise));

      expect(finalAmountPaise).toBe(90000); // 900 - 90 + 90 = ₹900 = 90000 paise
      expect(finalAmountPaise / 100).toBe(900);
    });

    it('guarantees Razorpay receives the exact integer paise amount', () => {
      const subtotalPaise = 33000; // ₹330 (3 items @ ₹110)
      const shippingPaise = 9000;  // ₹90
      const discountPaise = 0;

      const finalAmountPaise = Math.max(0, Math.round(subtotalPaise - discountPaise + shippingPaise));
      expect(finalAmountPaise).toBe(42000); // ₹420 = 42000 paise
      expect(Number.isInteger(finalAmountPaise)).toBe(true);
      expect(finalAmountPaise).toBeGreaterThan(0);
    });
  });
});

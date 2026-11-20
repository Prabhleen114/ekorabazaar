import { describe, it, expect } from 'vitest';
import { calculateItemPrice, inrToPaise, paiseToINR, TEMP_FLAT_SHIPPING_CHARGE } from '@/lib/pricing';
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
      id: '574',
      source: 'CATALOG',
      price: 11000, // ₹110 in DB paise
      customerPrice: null,
      wholesaleTiers: []
    };

    it('Quantity 1: renders Line Total ₹110 and Unit Price ₹110 per unit', () => {
      const quantity = 1;
      const unitPriceINR = calculateItemPrice(singleProduct, quantity);
      const lineTotalINR = unitPriceINR * quantity;

      expect(unitPriceINR).toBe(110);
      expect(lineTotalINR).toBe(110);
      expect(formatRupees(lineTotalINR)).toBe('110');
      expect(formatRupees(unitPriceINR)).toBe('110');
    });

    it('Quantity 2: renders Line Total ₹220 and Unit Price ₹110 per unit', () => {
      const quantity = 2;
      const unitPriceINR = calculateItemPrice(singleProduct, quantity);
      const lineTotalINR = unitPriceINR * quantity;

      expect(unitPriceINR).toBe(110);
      expect(lineTotalINR).toBe(220);
      expect(formatRupees(lineTotalINR)).toBe('220');
      expect(formatRupees(unitPriceINR)).toBe('110');
    });

    it('Quantity 3: renders Line Total ₹330 and Unit Price ₹110 per unit', () => {
      const quantity = 3;
      const unitPriceINR = calculateItemPrice(singleProduct, quantity);
      const lineTotalINR = unitPriceINR * quantity;

      expect(unitPriceINR).toBe(110);
      expect(lineTotalINR).toBe(330);
      expect(formatRupees(lineTotalINR)).toBe('330');
      expect(formatRupees(unitPriceINR)).toBe('110');
    });

    it('Decreasing quantity from 3 to 2: updates Line Total to ₹220 and retains Unit Price ₹110', () => {
      let quantity = 3;
      expect(calculateItemPrice(singleProduct, quantity) * quantity).toBe(330);

      quantity = 2;
      const unitPriceINR = calculateItemPrice(singleProduct, quantity);
      const lineTotalINR = unitPriceINR * quantity;
      expect(lineTotalINR).toBe(220);
      expect(unitPriceINR).toBe(110);
    });

    it('Decreasing quantity from 2 to 1: updates Line Total to ₹110 and retains Unit Price ₹110', () => {
      let quantity = 2;
      expect(calculateItemPrice(singleProduct, quantity) * quantity).toBe(220);

      quantity = 1;
      const unitPriceINR = calculateItemPrice(singleProduct, quantity);
      const lineTotalINR = unitPriceINR * quantity;
      expect(lineTotalINR).toBe(110);
      expect(unitPriceINR).toBe(110);
    });
  });

  describe('Wholesale Tier Dynamic Line Totals', () => {
    // Product 2408 (NEEM TULSI SOAP BASE): Base ₹240, 12+ ₹155, 52+ ₹140
    const tieredProduct = {
      id: '2408',
      source: 'CATALOG',
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
      expect(unit).toBe(240);
      expect(unit * qty).toBe(240);
    });

    it('Quantity 12: dynamically shifts to tier rate ₹155, Line Total ₹1,860', () => {
      const qty = 12;
      const unit = calculateItemPrice(tieredProduct, qty);
      expect(unit).toBe(155);
      expect(unit * qty).toBe(1860);
      expect(formatRupees(unit * qty)).toBe('1,860');
    });

    it('Quantity 52: dynamically shifts to tier rate ₹140, Line Total ₹7,280', () => {
      const qty = 52;
      const unit = calculateItemPrice(tieredProduct, qty);
      expect(unit).toBe(140);
      expect(unit * qty).toBe(7280);
      expect(formatRupees(unit * qty)).toBe('7,280');
    });
  });

  describe('Multi-Product Subtotal & Order Summary Formulas', () => {
    it('accurately calculates Subtotal = Sum of all product line totals in INR', () => {
      const cartItems = [
        { id: 'item-1', product: { source: 'CATALOG', price: 11000, customerPrice: null, wholesaleTiers: [] }, quantity: 3 }, // 110 * 3 = 330
        { id: 'item-2', product: { source: 'CATALOG', price: 24000, customerPrice: null, wholesaleTiers: [] }, quantity: 2 }, // 240 * 2 = 480
        { id: 'item-3', product: { source: 'CATALOG', price: 9000, customerPrice: null, wholesaleTiers: [] }, quantity: 1 }   // 90 * 1 = 90
      ];

      const lineTotals = cartItems.map(item => {
        const unit = calculateItemPrice(item.product, item.quantity);
        return unit * item.quantity;
      });

      expect(lineTotals).toEqual([330, 480, 90]); // in INR

      const subtotalINR = lineTotals.reduce((a, b) => a + b, 0);
      expect(subtotalINR).toBe(900); // ₹900

      const deliveryINR = TEMP_FLAT_SHIPPING_CHARGE;
      expect(deliveryINR).toBe(90);

      const totalINR = subtotalINR + deliveryINR;
      expect(totalINR).toBe(990); // ₹990

      // Razorpay boundary check
      expect(inrToPaise(totalINR)).toBe(99000);
    });

    it('accurately updates subtotal when an item is removed', () => {
      let cartItems = [
        { id: 'item-1', product: { source: 'CATALOG', price: 11000, customerPrice: null, wholesaleTiers: [] }, quantity: 3 },
        { id: 'item-2', product: { source: 'CATALOG', price: 24000, customerPrice: null, wholesaleTiers: [] }, quantity: 2 },
        { id: 'item-3', product: { source: 'CATALOG', price: 9000, customerPrice: null, wholesaleTiers: [] }, quantity: 1 }
      ];

      // Remove item-2
      cartItems = cartItems.filter(i => i.id !== 'item-2');
      expect(cartItems.length).toBe(2);

      const subtotalINR = cartItems.reduce((sum, item) => {
        const unit = calculateItemPrice(item.product, item.quantity);
        return sum + (unit * item.quantity);
      }, 0);

      expect(subtotalINR).toBe(420); // 330 + 90 = 420
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
      const subtotalINR = 330; // ₹330 (3 items @ ₹110)
      const shippingINR = 90;  // ₹90
      const discountINR = 0;

      const finalAmountINR = Math.max(0, subtotalINR - discountINR + shippingINR);
      const finalAmountPaise = inrToPaise(finalAmountINR);
      expect(finalAmountPaise).toBe(42000); // ₹420 = 42000 paise
      expect(Number.isInteger(finalAmountPaise)).toBe(true);
      expect(finalAmountPaise).toBeGreaterThan(0);
    });
  });
});

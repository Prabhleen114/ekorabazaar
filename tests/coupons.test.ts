import { describe, it, expect } from 'vitest';
import {
  normalizeCouponCode,
  getCouponComputedStatus,
  calculateCouponDiscount,
  validateCouponEligibility,
  CouponData
} from '@/lib/coupons';
import {
  ValidateCouponSchema,
  CreateCouponSchema,
  UpdateCouponSchema,
  CreateOrderSchema,
  validateBody
} from '@/lib/validation';
import { CouponStatus, DiscountType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

describe('Coupon System — Core Calculation & Logic', () => {
  describe('normalizeCouponCode', () => {
    it('normalizes coupon code to uppercase and trims surrounding whitespace', () => {
      expect(normalizeCouponCode('  ekora10  ')).toBe('EKORA10');
      expect(normalizeCouponCode('welcome_2026')).toBe('WELCOME_2026');
      expect(normalizeCouponCode('')).toBe('');
    });
  });

  describe('getCouponComputedStatus', () => {
    const baseCoupon = {
      status: CouponStatus.ACTIVE,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // yesterday
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
      maxUsageLimit: 100,
      usageCount: 5
    };

    it('returns ACTIVE for a healthy coupon within valid dates and under limit', () => {
      expect(getCouponComputedStatus(baseCoupon)).toBe('ACTIVE');
    });

    it('returns PAUSED when status is PAUSED, regardless of dates', () => {
      expect(getCouponComputedStatus({ ...baseCoupon, status: CouponStatus.PAUSED })).toBe('PAUSED');
    });

    it('returns ARCHIVED when status is ARCHIVED', () => {
      expect(getCouponComputedStatus({ ...baseCoupon, status: CouponStatus.ARCHIVED })).toBe('ARCHIVED');
    });

    it('returns SCHEDULED when startDate is in the future', () => {
      const futureStart = new Date(Date.now() + 1000 * 60 * 60 * 24);
      expect(getCouponComputedStatus({ ...baseCoupon, startDate: futureStart })).toBe('SCHEDULED');
    });

    it('returns EXPIRED when expiryDate has passed', () => {
      const pastExpiry = new Date(Date.now() - 1000 * 60 * 60);
      expect(getCouponComputedStatus({ ...baseCoupon, expiryDate: pastExpiry })).toBe('EXPIRED');
    });

    it('returns EXHAUSTED when usageCount reaches or exceeds maxUsageLimit', () => {
      expect(getCouponComputedStatus({ ...baseCoupon, maxUsageLimit: 10, usageCount: 10 })).toBe('EXHAUSTED');
      expect(getCouponComputedStatus({ ...baseCoupon, maxUsageLimit: 10, usageCount: 12 })).toBe('EXHAUSTED');
    });
  });

  describe('calculateCouponDiscount', () => {
    it('calculates percentage discount accurately without cap', () => {
      // 10% of ₹1,000 (100000 paise) = ₹100 (10000 paise)
      const discount = calculateCouponDiscount(
        { discountType: DiscountType.PERCENTAGE, discountValue: 10 },
        100000
      );
      expect(discount).toBe(10000);
    });

    it('respects maxDiscountAmount cap on percentage discounts', () => {
      // 20% of ₹5,000 (500000 paise) = ₹1,000 (100000 paise), capped at ₹300 (30000 paise)
      const discount = calculateCouponDiscount(
        { discountType: DiscountType.PERCENTAGE, discountValue: 20, maxDiscountAmount: 30000 },
        500000
      );
      expect(discount).toBe(30000);
    });

    it('calculates fixed amount discount in paise', () => {
      // ₹150 fixed discount (15000 paise) on ₹2,000 subtotal (200000 paise)
      const discount = calculateCouponDiscount(
        { discountType: DiscountType.FIXED_AMOUNT, discountValue: 15000 },
        200000
      );
      expect(discount).toBe(15000);
    });

    it('caps fixed discount at the subtotal so payable cannot become negative', () => {
      // ₹500 discount on a ₹300 order subtotal -> discount is capped at ₹300 (30000 paise)
      const discount = calculateCouponDiscount(
        { discountType: DiscountType.FIXED_AMOUNT, discountValue: 50000 },
        30000
      );
      expect(discount).toBe(30000);
    });

    it('returns 0 for non-positive subtotals', () => {
      expect(calculateCouponDiscount({ discountType: DiscountType.PERCENTAGE, discountValue: 10 }, 0)).toBe(0);
      expect(calculateCouponDiscount({ discountType: DiscountType.FIXED_AMOUNT, discountValue: 1000 }, -500)).toBe(0);
    });
  });

  describe('validateCouponEligibility', () => {
    const validCoupon: CouponData = {
      id: 'coupon-1',
      code: 'EKORA15',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      minOrderAmount: 50000, // ₹500
      maxDiscountAmount: 20000, // ₹200
      startDate: new Date(Date.now() - 100000),
      expiryDate: new Date(Date.now() + 10000000),
      maxUsageLimit: 50,
      perCustomerLimit: 1,
      usageCount: 10,
      status: CouponStatus.ACTIVE
    };

    it('validates an eligible order successfully and calculates correct discount', () => {
      const res = validateCouponEligibility(validCoupon, {
        subtotalPaise: 100000, // ₹1,000 >= ₹500 min
        usageCountForCustomer: 0
      });
      expect(res.valid).toBe(true);
      expect(res.discountPaise).toBe(15000); // 15% of ₹1000 = ₹150 (<= ₹200 cap)
    });

    it('rejects order that does not meet the minimum order amount', () => {
      const res = validateCouponEligibility(validCoupon, {
        subtotalPaise: 30000, // ₹300 < ₹500
        usageCountForCustomer: 0
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Minimum order amount of ₹500');
    });

    it('rejects customer who has exceeded the per-customer usage limit', () => {
      const res = validateCouponEligibility(validCoupon, {
        subtotalPaise: 100000,
        usageCountForCustomer: 1 // >= perCustomerLimit (1)
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('maximum allowed number of times');
    });

    it('rejects paused coupon with clear message', () => {
      const res = validateCouponEligibility({ ...validCoupon, status: CouponStatus.PAUSED }, {
        subtotalPaise: 100000,
        usageCountForCustomer: 0
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('currently inactive');
    });

    it('rejects expired coupon with clear message', () => {
      const res = validateCouponEligibility(
        { ...validCoupon, expiryDate: new Date(Date.now() - 5000) },
        { subtotalPaise: 100000, usageCountForCustomer: 0 }
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain('code has expired');
    });

    it('rejects exhausted coupon with clear message', () => {
      const res = validateCouponEligibility(
        { ...validCoupon, maxUsageLimit: 5, usageCount: 5 },
        { subtotalPaise: 100000, usageCountForCustomer: 0 }
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain('maximum total usage limit');
    });
  });
});

describe('Coupon System — Validation Schemas', () => {
  it('validates ValidateCouponSchema correctly', () => {
    const valid = validateBody(ValidateCouponSchema, { code: 'SAVE10', subtotalPaise: 50000 });
    expect(valid.success).toBe(true);

    const empty = validateBody(ValidateCouponSchema, { code: '' });
    expect(empty.success).toBe(false);
  });

  it('validates CreateCouponSchema for percentage and fixed discount', () => {
    const validPercentage = validateBody(CreateCouponSchema, {
      code: 'EKORA20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: 1000,
      maxDiscountAmount: 500,
      perCustomerLimit: 2,
      status: 'ACTIVE'
    });
    expect(validPercentage.success).toBe(true);

    const validFixed = validateBody(CreateCouponSchema, {
      code: 'FLAT100',
      discountType: 'FIXED_AMOUNT',
      discountValue: 100,
      minOrderAmount: 500,
      perCustomerLimit: 1,
      status: 'ACTIVE'
    });
    expect(validFixed.success).toBe(true);

    // Rejects invalid characters in code
    const invalidCode = validateBody(CreateCouponSchema, {
      code: 'INVALID CODE!',
      discountType: 'PERCENTAGE',
      discountValue: 10
    });
    expect(invalidCode.success).toBe(false);
  });

  it('validates CreateOrderSchema accepting optional couponCode', () => {
    const orderWithCoupon = validateBody(CreateOrderSchema, {
      items: [{ productId: 'prod_123', quantity: 2 }],
      addressId: 'addr_123',
      couponCode: 'DISCOUNT10'
    });
    expect(orderWithCoupon.success).toBe(true);
    if (orderWithCoupon.success) {
      expect(orderWithCoupon.data.couponCode).toBe('DISCOUNT10');
    }
  });
});

describe('Coupon System — Integration Files Inspection', () => {
  it('Admin layout includes Coupons navigation item', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/admin/layout.tsx');
    const layoutSource = fs.readFileSync(layoutPath, 'utf8');
    expect(layoutSource).toContain('/admin/coupons');
    expect(layoutSource).toContain('Coupons');
  });

  it('Admin coupons page exists and provides management controls', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/admin/coupons/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
    const pageSource = fs.readFileSync(pagePath, 'utf8');
    expect(pageSource).toContain('Create Coupon');
    expect(pageSource).toContain('Coupon Code');
    expect(pageSource).toContain('Discount Type');
    expect(pageSource).toContain('Archive');
    expect(pageSource).toContain('ACTIVE');
  });

  it('Cart and Checkout pages integrate CouponSection', () => {
    const cartPath = path.resolve(process.cwd(), 'src/app/cart/page.tsx');
    const cartSource = fs.readFileSync(cartPath, 'utf8');
    expect(cartSource).toContain('CouponSection');
    expect(cartSource).toContain('appliedCoupon');
    expect(cartSource).toContain('sessionStorage');

    const checkoutPath = path.resolve(process.cwd(), 'src/app/checkout/page.tsx');
    const checkoutSource = fs.readFileSync(checkoutPath, 'utf8');
    expect(checkoutSource).toContain('CouponSection');
    expect(checkoutSource).toContain('appliedCoupon');
    expect(checkoutSource).toContain('couponCode: appliedCoupon');
  });
});

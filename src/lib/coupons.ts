import { CouponStatus, DiscountType } from '@prisma/client';

export interface CouponData {
  id?: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number; // percentage (e.g. 10) or fixed amount in paise (e.g. 10000)
  minOrderAmount: number; // in paise
  maxDiscountAmount?: number | null; // in paise
  startDate: Date | string;
  expiryDate?: Date | string | null;
  maxUsageLimit?: number | null;
  perCustomerLimit: number;
  usageCount: number;
  status: CouponStatus;
}

export type ComputedCouponStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'EXHAUSTED' | 'ARCHIVED' | 'SCHEDULED';

/**
 * Normalizes a coupon code: trims whitespace and converts to uppercase.
 */
export function normalizeCouponCode(code: string): string {
  if (!code) return '';
  return code.trim().toUpperCase();
}

/**
 * Computes the real-time operational status of a coupon.
 */
export function getCouponComputedStatus(coupon: {
  status: CouponStatus;
  startDate: Date | string;
  expiryDate?: Date | string | null;
  maxUsageLimit?: number | null;
  usageCount: number;
}): ComputedCouponStatus {
  if (coupon.status === CouponStatus.ARCHIVED) {
    return 'ARCHIVED';
  }
  if (coupon.status === CouponStatus.PAUSED) {
    return 'PAUSED';
  }

  const now = new Date();
  const start = new Date(coupon.startDate);
  if (start > now) {
    return 'SCHEDULED';
  }

  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    if (expiry < now) {
      return 'EXPIRED';
    }
  }

  if (coupon.maxUsageLimit && coupon.usageCount >= coupon.maxUsageLimit) {
    return 'EXHAUSTED';
  }

  return 'ACTIVE';
}

/**
 * Calculates the exact discount in paise for a given coupon and subtotal.
 * Never exceeds subtotalPaise.
 */
export function calculateCouponDiscount(
  coupon: {
    discountType: DiscountType;
    discountValue: number; // percentage (e.g. 10) or fixed amount in paise (e.g. 10000)
    maxDiscountAmount?: number | null; // in paise
  },
  subtotalPaise: number
): number {
  if (!subtotalPaise || subtotalPaise <= 0) return 0;

  let discountPaise = 0;

  if (coupon.discountType === DiscountType.PERCENTAGE) {
    // discountValue is 0-100
    const rawDiscount = Math.round((subtotalPaise * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discountPaise = Math.min(rawDiscount, coupon.maxDiscountAmount);
    } else {
      discountPaise = rawDiscount;
    }
  } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
    // discountValue is in paise
    discountPaise = coupon.discountValue;
  }

  // Discount can never exceed the order subtotal
  return Math.max(0, Math.min(discountPaise, subtotalPaise));
}

/**
 * Validates a coupon's eligibility against order subtotal and customer redemption limits.
 */
export function validateCouponEligibility(
  coupon: CouponData,
  context: {
    subtotalPaise: number;
    usageCountForCustomer?: number;
  }
): { valid: boolean; error?: string; discountPaise: number } {
  const computedStatus = getCouponComputedStatus(coupon);

  if (computedStatus === 'ARCHIVED') {
    return { valid: false, error: 'Coupon not found or is no longer available.', discountPaise: 0 };
  }
  if (computedStatus === 'PAUSED') {
    return { valid: false, error: 'This coupon is currently inactive.', discountPaise: 0 };
  }
  if (computedStatus === 'SCHEDULED') {
    return { valid: false, error: 'This coupon offer has not started yet.', discountPaise: 0 };
  }
  if (computedStatus === 'EXPIRED') {
    return { valid: false, error: 'This coupon code has expired.', discountPaise: 0 };
  }
  if (computedStatus === 'EXHAUSTED') {
    return { valid: false, error: 'This coupon has reached its maximum total usage limit.', discountPaise: 0 };
  }

  // Minimum Order Amount Check
  if (coupon.minOrderAmount && context.subtotalPaise < coupon.minOrderAmount) {
    const requiredRupees = Math.ceil(coupon.minOrderAmount / 100);
    return {
      valid: false,
      error: `Minimum order amount of ₹${requiredRupees.toLocaleString('en-IN')} is required to apply this coupon.`,
      discountPaise: 0
    };
  }

  // Per-Customer Usage Check
  if (context.usageCountForCustomer !== undefined && context.usageCountForCustomer >= coupon.perCustomerLimit) {
    return {
      valid: false,
      error: `You have already redeemed this coupon the maximum allowed number of times (${coupon.perCustomerLimit}).`,
      discountPaise: 0
    };
  }

  const discountPaise = calculateCouponDiscount(coupon, context.subtotalPaise);
  if (discountPaise <= 0) {
    return { valid: false, error: 'This coupon provides no discount on this order.', discountPaise: 0 };
  }

  return { valid: true, discountPaise };
}

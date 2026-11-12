import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/session';
import { validateBody, ValidateCouponSchema } from '@/lib/validation';
import {
  normalizeCouponCode,
  validateCouponEligibility,
  calculateCouponDiscount,
  getCouponComputedStatus
} from '@/lib/coupons';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const validation = validateBody(ValidateCouponSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ valid: false, error: validation.error }, { status: 400 });
    }

    const { code } = validation.data;
    const normalizedCode = normalizeCouponCode(code);

    let subtotalPaise = 0;
    if (validation.data.subtotalPaise !== undefined) {
      subtotalPaise = Math.round(validation.data.subtotalPaise);
    } else if (validation.data.subtotal !== undefined) {
      subtotalPaise = Math.round(validation.data.subtotal * 100);
    }

    // Lookup coupon by normalized unique code
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode }
    });

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Invalid coupon code. Please check and try again.' },
        { status: 404 }
      );
    }

    // Check optional authenticated user usage
    let customerUsageCount = 0;
    const session = await getSession();
    if (session?.userId) {
      customerUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: session.userId }
      });
    }

    const eligibility = validateCouponEligibility(coupon, {
      subtotalPaise,
      usageCountForCustomer: session?.userId ? customerUsageCount : undefined
    });

    if (!eligibility.valid) {
      return NextResponse.json(
        { valid: false, error: eligibility.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmountPaise: eligibility.discountPaise,
        discountAmountRupees: eligibility.discountPaise / 100,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount
      }
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Unable to validate coupon at this time.' },
      { status: 500 }
    );
  }
}

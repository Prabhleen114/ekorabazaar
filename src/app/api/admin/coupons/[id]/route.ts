import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { validateBody, UpdateCouponSchema } from '@/lib/validation';
import { getCouponComputedStatus } from '@/lib/coupons';
import { CouponStatus, DiscountType } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true }
            },
            order: {
              select: { id: true, total: true, subtotal: true, status: true, createdAt: true }
            }
          }
        },
        _count: {
          select: { usages: true, orders: true }
        }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    return NextResponse.json({
      coupon: {
        ...coupon,
        computedStatus: getCouponComputedStatus(coupon),
        minOrderAmountRupees: coupon.minOrderAmount / 100,
        maxDiscountAmountRupees: coupon.maxDiscountAmount ? coupon.maxDiscountAmount / 100 : null,
        discountValueDisplay:
          coupon.discountType === DiscountType.PERCENTAGE
            ? `${coupon.discountValue}%`
            : `₹${(coupon.discountValue / 100).toLocaleString('en-IN')}`
      }
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Admin coupon GET by ID error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupon details' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    const rawBody = await req.json();
    const validation = validateBody(UpdateCouponSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const updatePayload: any = {};

    if (data.description !== undefined) {
      updatePayload.description = data.description?.trim() || null;
    }

    const effectiveDiscountType = data.discountType || existing.discountType;

    if (data.discountValue !== undefined) {
      if (effectiveDiscountType === DiscountType.PERCENTAGE) {
        if (data.discountValue <= 0 || data.discountValue > 100) {
          return NextResponse.json(
            { error: 'Percentage discount must be between 1% and 100%.' },
            { status: 400 }
          );
        }
        updatePayload.discountValue = Math.round(data.discountValue);
      } else {
        updatePayload.discountValue = Math.round(data.discountValue * 100);
      }
    }

    if (data.discountType !== undefined) {
      updatePayload.discountType = data.discountType;
    }

    if (data.minOrderAmount !== undefined) {
      updatePayload.minOrderAmount = Math.round(data.minOrderAmount * 100);
    }

    if (data.maxDiscountAmount !== undefined) {
      updatePayload.maxDiscountAmount =
        data.maxDiscountAmount !== null ? Math.round(data.maxDiscountAmount * 100) : null;
    }

    if (data.startDate !== undefined) {
      updatePayload.startDate = data.startDate ? new Date(data.startDate) : new Date();
    }

    if (data.expiryDate !== undefined) {
      updatePayload.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }

    if (data.maxUsageLimit !== undefined) {
      updatePayload.maxUsageLimit = data.maxUsageLimit;
    }

    if (data.perCustomerLimit !== undefined) {
      updatePayload.perCustomerLimit = data.perCustomerLimit;
    }

    if (data.status !== undefined) {
      updatePayload.status = data.status;
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: updatePayload
    });

    return NextResponse.json({
      coupon: {
        ...updated,
        computedStatus: getCouponComputedStatus(updated)
      }
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Admin coupon PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true, usages: true }
        }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    const hasHistory = coupon._count.orders > 0 || coupon._count.usages > 0;

    if (hasHistory) {
      // Safe archival: never destroy historical order or usage records
      await prisma.coupon.update({
        where: { id },
        data: { status: CouponStatus.ARCHIVED }
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: 'Coupon has historical order redemptions. It was safely archived to preserve records.'
      });
    } else {
      // Completely unused coupon can be cleanly deleted
      await prisma.coupon.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        archived: false,
        message: 'Coupon deleted successfully.'
      });
    }
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Admin coupon DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}

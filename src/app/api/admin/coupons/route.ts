import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { validateBody, CreateCouponSchema } from '@/lib/validation';
import { normalizeCouponCode, getCouponComputedStatus } from '@/lib/coupons';
import { CouponStatus, DiscountType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim().toLowerCase() || '';
    const statusFilter = searchParams.get('status')?.trim().toUpperCase() || 'ALL';

    // Fetch all non-archived coupons (or all including archived if requested)
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usages: true, orders: true }
        }
      }
    });

    // Compute status and totals
    const formatted = coupons.map((c) => {
      const computedStatus = getCouponComputedStatus(c);
      return {
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        // For UI convenience:
        discountDisplay:
          c.discountType === DiscountType.PERCENTAGE
            ? `${c.discountValue}%`
            : `₹${(c.discountValue / 100).toLocaleString('en-IN')}`,
        minOrderAmountPaise: c.minOrderAmount,
        minOrderAmountRupees: c.minOrderAmount / 100,
        maxDiscountAmountPaise: c.maxDiscountAmount,
        maxDiscountAmountRupees: c.maxDiscountAmount ? c.maxDiscountAmount / 100 : null,
        startDate: c.startDate.toISOString(),
        expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
        maxUsageLimit: c.maxUsageLimit,
        perCustomerLimit: c.perCustomerLimit,
        usageCount: c.usageCount,
        dbStatus: c.status,
        status: computedStatus,
        ordersCount: c._count.orders,
        usagesCount: c._count.usages,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      };
    });

    // Calculate tab counts across all coupons
    const counts = {
      ALL: 0,
      ACTIVE: 0,
      PAUSED: 0,
      EXPIRED: 0,
      EXHAUSTED: 0,
      ARCHIVED: 0
    };

    formatted.forEach((c) => {
      if (c.status !== 'ARCHIVED') {
        counts.ALL += 1;
      }
      if (c.status === 'ACTIVE') counts.ACTIVE += 1;
      if (c.status === 'PAUSED') counts.PAUSED += 1;
      if (c.status === 'EXPIRED') counts.EXPIRED += 1;
      if (c.status === 'EXHAUSTED') counts.EXHAUSTED += 1;
      if (c.status === 'ARCHIVED') counts.ARCHIVED += 1;
    });

    // Filter by search and status
    let filtered = formatted;

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.code.toLowerCase().includes(search) ||
          (c.description && c.description.toLowerCase().includes(search))
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    } else {
      // By default in 'ALL' tab, hide archived coupons unless specifically viewing ARCHIVED tab
      filtered = filtered.filter((c) => c.status !== 'ARCHIVED');
    }

    return NextResponse.json({
      coupons: filtered,
      counts,
      total: filtered.length
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const rawBody = await req.json();
    const validation = validateBody(CreateCouponSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const normalizedCode = normalizeCouponCode(data.code);

    // Check unique code
    const existing = await prisma.coupon.findUnique({
      where: { code: normalizedCode }
    });

    if (existing) {
      return NextResponse.json(
        { error: `Coupon code "${normalizedCode}" already exists.` },
        { status: 409 }
      );
    }

    // Convert values:
    // If FIXED_AMOUNT: discountValue is entered in Rupees in UI/Admin, store in paise
    // If PERCENTAGE: discountValue is entered as percentage (1-100)
    let discountValuePaiseOrPercent: number;
    if (data.discountType === 'PERCENTAGE') {
      if (data.discountValue <= 0 || data.discountValue > 100) {
        return NextResponse.json(
          { error: 'Percentage discount must be between 1% and 100%.' },
          { status: 400 }
        );
      }
      discountValuePaiseOrPercent = Math.round(data.discountValue);
    } else {
      discountValuePaiseOrPercent = Math.round(data.discountValue * 100);
    }

    const minOrderAmountPaise = Math.round((data.minOrderAmount || 0) * 100);
    const maxDiscountAmountPaise =
      data.discountType === 'PERCENTAGE' && data.maxDiscountAmount
        ? Math.round(data.maxDiscountAmount * 100)
        : null;

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    if (expiryDate && expiryDate <= startDate) {
      return NextResponse.json(
        { error: 'Expiry date must be after start date.' },
        { status: 400 }
      );
    }

    const created = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        description: data.description?.trim() || null,
        discountType: data.discountType as DiscountType,
        discountValue: discountValuePaiseOrPercent,
        minOrderAmount: minOrderAmountPaise,
        maxDiscountAmount: maxDiscountAmountPaise,
        startDate,
        expiryDate,
        maxUsageLimit: data.maxUsageLimit ?? null,
        perCustomerLimit: data.perCustomerLimit ?? 1,
        status: data.status as CouponStatus
      }
    });

    return NextResponse.json(
      {
        coupon: {
          ...created,
          status: getCouponComputedStatus(created)
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Admin coupon create error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

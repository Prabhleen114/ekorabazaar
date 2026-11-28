import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import {
  validateBody,
  CreateCouponSchema,
  UpdateCouponSchema,
  OrderShipmentCreateSchema,
  OrderShipmentUpdateSchema,
  OrderAdminNoteSchema,
  UpdateLeadSchema,
} from '@/lib/validation';
import {
  CONFIRMED_ORDER_STATUSES,
  CONFIRMED_ORDER_WHERE,
  isConfirmedOrder,
  syncLeadsFromExistingData,
  upsertOrderLead,
  markCustomerLeadsConverted,
} from '@/lib/leads-server';
import { normalizeCouponCode, getCouponComputedStatus } from '@/lib/coupons';
import {
  CouponStatus,
  DiscountType,
  ProductStatus,
  SellerAccountStatus,
  SellerApplicationStatus,
  ShippingStatus,
} from '@prisma/client';
import { restoreExpiredOrders } from '@/lib/orders-server';
import { createShiprocketOrder, generateAWB, requestPickup, generateLabel } from '@/lib/shiprocket';
import { logAudit } from '@/lib/audit';
import { roundPrice } from '@/lib/pricing-rounding';
import { RouteContext, handleAuthError } from '../types';

export async function handleGetAdminCoupons(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim().toLowerCase() || '';
    const statusFilter = searchParams.get('status')?.trim().toUpperCase() || 'ALL';

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usages: true, orders: true },
        },
      },
    });

    const formatted = coupons.map((c) => {
      const computedStatus = getCouponComputedStatus(c);
      return {
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
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
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    const counts = {
      ALL: 0,
      ACTIVE: 0,
      PAUSED: 0,
      EXPIRED: 0,
      EXHAUSTED: 0,
      ARCHIVED: 0,
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
      filtered = filtered.filter((c) => c.status !== 'ARCHIVED');
    }

    return NextResponse.json({
      coupons: filtered,
      counts,
      total: filtered.length,
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function handlePostAdminCoupons(req: NextRequest) {
  try {
    await requireAdmin();

    const rawBody = await req.json();
    const validation = validateBody(CreateCouponSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const normalizedCode = normalizeCouponCode(data.code);

    const existing = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Coupon code "${normalizedCode}" already exists.` },
        { status: 409 }
      );
    }

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
      return NextResponse.json({ error: 'Expiry date must be after start date.' }, { status: 400 });
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
        status: data.status as CouponStatus,
      },
    });

    return NextResponse.json(
      {
        coupon: {
          ...created,
          status: getCouponComputedStatus(created),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error('Admin coupon create error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function handleGetAdminCouponById(_req: NextRequest, { params }: RouteContext) {
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
              select: { id: true, name: true, email: true, phone: true },
            },
            order: {
              select: { id: true, total: true, subtotal: true, status: true, createdAt: true },
            },
          },
        },
        _count: {
          select: { usages: true, orders: true },
        },
      },
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
            : `₹${(coupon.discountValue / 100).toLocaleString('en-IN')}`,
      },
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error('Admin coupon GET by ID error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupon details' }, { status: 500 });
  }
}

export async function handlePatchAdminCouponById(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.coupon.findUnique({
      where: { id },
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
      data: updatePayload,
    });

    return NextResponse.json({
      coupon: {
        ...updated,
        computedStatus: getCouponComputedStatus(updated),
      },
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error('Admin coupon PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function handleDeleteAdminCouponById(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true, usages: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    const hasHistory = coupon._count.orders > 0 || coupon._count.usages > 0;

    if (hasHistory) {
      await prisma.coupon.update({
        where: { id },
        data: { status: CouponStatus.ARCHIVED },
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message:
          'Coupon has historical order redemptions. It was safely archived to preserve records.',
      });
    } else {
      await prisma.coupon.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        archived: false,
        message: 'Coupon deleted successfully.',
      });
    }
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error('Admin coupon DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}

export async function handleGetAdminLeads(req: NextRequest) {
  try {
    await requireAdmin();
    await syncLeadsFromExistingData();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const sourceFilter = searchParams.get('source')?.trim().toUpperCase() || 'ALL';
    const statusFilter = searchParams.get('status')?.trim().toUpperCase() || 'ALL';
    const q = searchParams.get('q')?.trim() || '';

    const VALID_SOURCES = ['CANCELLED_ORDER', 'INCOMPLETE_CHECKOUT', 'ABANDONED_CHECKOUT'];
    const VALID_STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'LOST'];

    const where: any = {};
    if (sourceFilter !== 'ALL' && VALID_SOURCES.includes(sourceFilter)) {
      where.source = sourceFilter;
    }
    if (statusFilter !== 'ALL' && VALID_STATUSES.includes(statusFilter)) {
      where.status = statusFilter;
    }
    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
        { orderId: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [leads, total, groupedBySource, groupedByStatus] = await Promise.all([
      prisma.lead.findMany({
        skip,
        take: limit,
        where,
        orderBy: { lastActivityAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              cancellationReason: true,
              payments: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  status: true,
                  amount: true,
                  currency: true,
                  razorpayOrderId: true,
                  failureReason: true,
                },
              },
            },
          },
          convertedOrder: {
            select: { id: true, status: true, total: true, createdAt: true },
          },
        },
      }),
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ['source'],
        _count: { _all: true },
      }).catch(() => []),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { _all: true },
      }).catch(() => []),
    ]);

    const sourceCounts: Record<string, number> = {
      ALL: 0,
      CANCELLED_ORDER: 0,
      INCOMPLETE_CHECKOUT: 0,
      ABANDONED_CHECKOUT: 0,
    };
    for (const row of groupedBySource as any[]) {
      sourceCounts[row.source] = row._count._all;
      sourceCounts.ALL += row._count._all;
    }

    const statusCounts: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      CONVERTED: 0,
      LOST: 0,
    };
    for (const row of groupedByStatus as any[]) {
      statusCounts[row.status] = row._count._all;
    }

    return NextResponse.json({
      leads,
      counts: {
        bySource: sourceCounts,
        byStatus: statusCounts,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin leads fetch error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleGetAdminOrders(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const status = searchParams.get('status') || null;

    const VALID_CONFIRMED_STATUSES = CONFIRMED_ORDER_STATUSES.map(String);
    const where: any =
      status && VALID_CONFIRMED_STATUSES.includes(status)
        ? { AND: [CONFIRMED_ORDER_WHERE, { status: status as any }] }
        : CONFIRMED_ORDER_WHERE;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          shippingStatus: true,
          total: true,
          currency: true,
          createdAt: true,
          addressSnapshot: true,
          customer: { select: { email: true } },
          _count: {
            select: { shipments: true, adminNotes: true },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              razorpayOrderId: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAdminOrdersRestoreExpired() {
  try {
    await requireAdmin();
    const restoredCount = await restoreExpiredOrders(30);
    return NextResponse.json({ success: true, restoredCount });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleGetAdminOrderById(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const baseInclude = {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      payments: { orderBy: { createdAt: 'desc' as const } },
      statusHistory: { orderBy: { createdAt: 'desc' as const } },
      shipments: { orderBy: { createdAt: 'asc' as const } },
      adminNotes: {
        orderBy: { createdAt: 'desc' as const },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
    };

    let order;
    try {
      order = await prisma.order.findUnique({
        where: { id },
        include: {
          ...baseInclude,
          items: {
            include: {
              review: { select: { id: true, status: true, rating: true, createdAt: true } },
              reviewToken: { select: { id: true, token: true, usedAt: true, expiresAt: true, revokedAt: true } },
            },
          },
        },
      });
    } catch (relationErr: any) {
      // Preserve order details availability even if review tables/columns are unavailable
      console.warn('Admin order detail review relation lookup failed; falling back to base items:', relationErr?.message || relationErr);
      order = await prisma.order.findUnique({
        where: { id },
        include: {
          ...baseInclude,
          items: true,
        },
      });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Admin order detail fetch error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePatchAdminOrderById(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const VALID_STATUSES = [
      'PAYMENT_PENDING',
      'PAID',
      'PROCESSING',
      'SHIPPED',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED',
      'REFUND_INITIATED',
      'REFUNDED',
    ];

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: { select: { status: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
        },
      });

      return updatedOrder;
    });

    // Keep Lead status synchronized when order is cancelled or confirmed
    if (status === 'CANCELLED' || status === 'PAYMENT_PENDING') {
      await upsertOrderLead(id).catch(() => {});
    } else if (isConfirmedOrder({ status, paymentStatus: updated.paymentStatus, payments: order.payments })) {
      await markCustomerLeadsConverted({ orderId: id, customerId: updated.customerId }).catch(() => {});
    }

    return NextResponse.json({ order: updated });
  } catch (error: any) {
    console.error('Admin order status update error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAdminOrderShip(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'PAYMENT_PENDING' || order.paymentStatus !== 'CAPTURED') {
      return NextResponse.json({ error: 'Cannot ship an unpaid order' }, { status: 400 });
    }

    if (action === 'CREATE') {
      if (order.shiprocketOrderId || order.shippingStatus !== ShippingStatus.NOT_CREATED) {
        return NextResponse.json({
          error: 'Shiprocket order already exists or in progress',
          order,
        });
      }

      const snap = order.addressSnapshot as any;
      if (!snap || !snap.name || !snap.line1 || !snap.city || !snap.state || !snap.pincode) {
        return NextResponse.json({ error: 'Incomplete shipping address' }, { status: 400 });
      }

      if (!snap.phone || snap.phone.length < 10) {
        return NextResponse.json(
          { error: 'A valid customer phone number is required in the delivery address' },
          { status: 400 }
        );
      }

      const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION;
      if (!pickupLocation) {
        return NextResponse.json(
          { error: 'Server misconfiguration: SHIPROCKET_PICKUP_LOCATION is missing' },
          { status: 500 }
        );
      }

      const productIds = order.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalWeightKg = 0;
      let maxLength = 0;
      let maxBreadth = 0;
      let totalHeight = 0;

      for (const item of order.items) {
        const prod = productMap.get(item.productId);
        const itemWeightKg = prod?.weightKg != null && prod.weightKg > 0 ? prod.weightKg : 0.25;
        const itemLengthCm = prod?.lengthCm != null && prod.lengthCm > 0 ? prod.lengthCm : 15;
        const itemBreadthCm = prod?.breadthCm != null && prod.breadthCm > 0 ? prod.breadthCm : 10;
        const itemHeightCm = prod?.heightCm != null && prod.heightCm > 0 ? prod.heightCm : 5;

        totalWeightKg += itemWeightKg * item.quantity;
        maxLength = Math.max(maxLength, itemLengthCm);
        maxBreadth = Math.max(maxBreadth, itemBreadthCm);
        totalHeight += itemHeightCm * item.quantity;
      }

      if (totalWeightKg < 0.05) totalWeightKg = 0.05;
      if (maxLength < 0.5) maxLength = 0.5;
      if (maxBreadth < 0.5) maxBreadth = 0.5;
      if (totalHeight < 0.5) totalHeight = 0.5;

      const nameParts = snap.name.trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        order_id: order.id,
        order_date: new Date(order.createdAt).toISOString().split('T')[0],
        pickup_location: pickupLocation,
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: snap.line1,
        billing_address_2: snap.line2 || '',
        billing_city: snap.city,
        billing_pincode: String(snap.pincode),
        billing_state: snap.state,
        billing_country: snap.country || 'India',
        billing_email: order.customer.email,
        billing_phone: snap.phone,
        shipping_is_billing: true,
        order_items: order.items.map((item: any) => ({
          name: item.productNameSnapshot || 'Product',
          sku: item.productId,
          units: item.quantity,
          selling_price: item.priceSnapshot / 100,
        })),
        payment_method: 'Prepaid',
        sub_total: order.subtotal / 100,
        length: parseFloat(maxLength.toFixed(2)),
        breadth: parseFloat(maxBreadth.toFixed(2)),
        height: parseFloat(totalHeight.toFixed(2)),
        weight: parseFloat(totalWeightKg.toFixed(3)),
      };

      const lock = await prisma.order.updateMany({
        where: { id: order.id, shippingStatus: ShippingStatus.NOT_CREATED },
        data: { shippingStatus: ShippingStatus.CREATED },
      });

      if (lock.count === 0) {
        return NextResponse.json(
          { error: 'Shiprocket order creation already in progress or completed' },
          { status: 400 }
        );
      }

      let srRes;
      try {
        srRes = await createShiprocketOrder(payload);
      } catch (err: any) {
        await prisma.order.update({
          where: { id: order.id },
          data: { shippingStatus: ShippingStatus.NOT_CREATED },
        });
        throw err;
      }

      try {
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            shiprocketOrderId: String(srRes.order_id),
            shipmentId: String(srRes.shipment_id),
          },
        });
        return NextResponse.json({ message: 'Shiprocket order created', order: updated });
      } catch (dbErr: any) {
        console.error('CRITICAL: Shiprocket order created but DB update failed!', srRes, dbErr);
        return NextResponse.json(
          {
            error:
              'Order created in Shiprocket but DB update failed. Manual reconciliation required.',
          },
          { status: 500 }
        );
      }
    }

    if (action === 'ASSIGN_AWB') {
      if (order.shippingStatus !== ShippingStatus.CREATED) {
        return NextResponse.json({ error: 'Invalid state for AWB assignment' }, { status: 400 });
      }
      if (!order.shipmentId || order.awbCode) {
        return NextResponse.json(
          { error: 'Shipment ID not found or AWB already assigned' },
          { status: 400 }
        );
      }

      const lock = await prisma.order.updateMany({
        where: { id: order.id, shippingStatus: ShippingStatus.CREATED },
        data: { shippingStatus: ShippingStatus.AWB_ASSIGNED },
      });

      if (lock.count === 0) {
        return NextResponse.json(
          { error: 'AWB assignment already in progress or completed' },
          { status: 400 }
        );
      }

      let awbRes;
      try {
        awbRes = await generateAWB(order.shipmentId);
      } catch (err: any) {
        await prisma.order.update({
          where: { id: order.id },
          data: { shippingStatus: ShippingStatus.CREATED },
        });
        throw err;
      }

      const awbCode = awbRes.response?.data?.awb_code;
      const courierName = awbRes.response?.data?.courier_name;

      if (!awbCode) {
        return NextResponse.json(
          { error: 'Failed to extract AWB code from response' },
          { status: 500 }
        );
      }

      const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          awbCode,
          courierName,
          trackingUrl,
          shippingStatus: ShippingStatus.AWB_ASSIGNED,
        },
      });

      // Record in multi-shipment OrderShipment table without overwriting existing shipments
      const existingShipmentsCount = await prisma.orderShipment.count({
        where: { orderId: order.id },
      });
      await prisma.orderShipment.create({
        data: {
          orderId: order.id,
          shipmentNumber: existingShipmentsCount + 1,
          courierName: courierName || 'Shiprocket',
          awbCode,
          trackingUrl,
          status: ShippingStatus.AWB_ASSIGNED,
        },
      });

      return NextResponse.json({ message: 'AWB Assigned', order: updated });
    }

    if (action === 'REQUEST_PICKUP') {
      if (order.shippingStatus !== ShippingStatus.AWB_ASSIGNED) {
        return NextResponse.json(
          { error: 'Invalid state for pickup request. AWB must be assigned.' },
          { status: 400 }
        );
      }
      if (!order.shipmentId) {
        return NextResponse.json({ error: 'Shipment ID not found' }, { status: 400 });
      }

      const lock = await prisma.order.updateMany({
        where: { id: order.id, shippingStatus: ShippingStatus.AWB_ASSIGNED },
        data: { shippingStatus: ShippingStatus.PICKUP_SCHEDULED },
      });

      if (lock.count === 0) {
        return NextResponse.json(
          { error: 'Pickup scheduling already in progress or completed' },
          { status: 400 }
        );
      }

      try {
        await requestPickup(order.shipmentId);
      } catch (err: any) {
        await prisma.order.update({
          where: { id: order.id },
          data: { shippingStatus: ShippingStatus.AWB_ASSIGNED },
        });
        throw err;
      }

      const updated = await prisma.order.findUnique({ where: { id: order.id } });
      return NextResponse.json({ message: 'Pickup requested', order: updated });
    }

    if (action === 'GENERATE_LABEL') {
      if (!order.shipmentId) {
        return NextResponse.json({ error: 'Shipment ID not found' }, { status: 400 });
      }
      const labelRes = await generateLabel(order.shipmentId);
      if (labelRes.label_created === 0 || !labelRes.label_url) {
        return NextResponse.json({ error: 'Label generation failed' }, { status: 500 });
      }
      return NextResponse.json({ message: 'Label generated', labelUrl: labelRes.label_url });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Shiprocket ship action error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function handlePostAdminPriceRequest(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const priceReq = await prisma.priceChangeRequest.findUnique({ where: { id } });

    if (!priceReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (priceReq.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      await prisma.$transaction([
        prisma.priceChangeRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: admin.userId,
          },
        }),
        prisma.product.update({
          where: { id: priceReq.productId },
          data: { price: priceReq.requestedPrice },
        }),
      ]);
    } else if (action === 'REJECT') {
      await prisma.priceChangeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: admin.userId,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Price Request Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAdminProductApprove(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { productId } = await params;
    const body = await req.json().catch(() => ({}));

    const customerPrice = body.customerPrice ? parseInt(body.customerPrice, 10) : undefined;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.status !== ProductStatus.PENDING_APPROVAL) {
      return NextResponse.json({ error: 'Product is not pending approval' }, { status: 400 });
    }

    let finalCustomerPrice = product.price;
    if (customerPrice !== undefined) {
      if (isNaN(customerPrice) || customerPrice <= 0) {
        return NextResponse.json({ error: 'Invalid customerPrice provided' }, { status: 400 });
      }
      // customerPrice input is in Indian Rupees (INR)
      if (product.source === 'CATALOG' || product.source === 'EKORA_OFFICIAL') {
        finalCustomerPrice = Math.round(customerPrice * 100);
      } else {
        finalCustomerPrice = Math.round(customerPrice);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.PUBLISHED,
        customerPrice: finalCustomerPrice,
      },
    });

    await logAudit(session.userId!, 'ADMIN_APPROVE_PRODUCT', productId, {
      sellerPrice: product.price,
      customerPrice: finalCustomerPrice,
    });

    if (finalCustomerPrice !== product.price) {
      await logAudit(session.userId!, 'ADMIN_PRICE_CHANGE', productId, {
        oldCustomerPrice: product.customerPrice,
        newCustomerPrice: finalCustomerPrice,
      });
    }

    try {
      revalidatePath(`/products/${productId}`);
      revalidatePath('/sitemap_index.xml');
    } catch {}

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Admin Approve Product Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAdminProductReject(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { productId } = await params;
    const body = await req.json().catch(() => ({}));
    const { rejectionReason } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    if (
      !rejectionReason ||
      typeof rejectionReason !== 'string' ||
      rejectionReason.trim().length === 0
    ) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.REJECTED,
        rejectionReason: rejectionReason.trim(),
      },
    });

    await logAudit(session.userId!, 'ADMIN_REJECT_PRODUCT', productId, {
      reason: rejectionReason,
    });

    try {
      revalidatePath(`/products/${productId}`);
    } catch {}

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Admin Reject Product Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAdminSellerApprove(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { sellerId } = await params;

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing sellerId' }, { status: 400 });
    }

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: {
        applicationStatus: SellerApplicationStatus.APPROVED,
        accountStatus: SellerAccountStatus.ACTIVE,
      },
    });

    await logAudit(session.userId!, 'ADMIN_APPROVE_SELLER', sellerId, {
      oldAppStatus: seller.applicationStatus,
      newAppStatus: updatedSeller.applicationStatus,
      oldAccStatus: seller.accountStatus,
      newAccStatus: updatedSeller.accountStatus,
    });

    try {
      revalidatePath('/sitemap_index.xml');
      revalidatePath(`/store/${sellerId}`);
    } catch {}

    return NextResponse.json({ success: true, seller: updatedSeller });
  } catch (error: any) {
    console.error('Admin Approve Seller Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAdminSellerReactivate(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { sellerId } = await params;

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing sellerId' }, { status: 400 });
    }

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (seller.applicationStatus !== SellerApplicationStatus.APPROVED) {
      return NextResponse.json(
        { error: 'Cannot reactivate a seller who is not approved' },
        { status: 400 }
      );
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: {
        accountStatus: SellerAccountStatus.ACTIVE,
      },
    });

    await logAudit(session.userId!, 'ADMIN_REACTIVATE_SELLER', sellerId, {
      oldAccStatus: seller.accountStatus,
    });

    return NextResponse.json({ success: true, seller: updatedSeller });
  } catch (error: any) {
    console.error('Admin Reactivate Seller Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAdminSellerReject(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { sellerId } = await params;
    const body = await req.json().catch(() => ({}));
    const { rejectionReason } = body;

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing sellerId' }, { status: 400 });
    }

    if (
      !rejectionReason ||
      typeof rejectionReason !== 'string' ||
      rejectionReason.trim().length === 0
    ) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: {
        applicationStatus: SellerApplicationStatus.REJECTED,
        accountStatus: SellerAccountStatus.DISABLED,
        rejectionReason: rejectionReason.trim(),
      },
    });

    await logAudit(session.userId!, 'ADMIN_REJECT_SELLER', sellerId, {
      reason: rejectionReason,
      oldAppStatus: seller.applicationStatus,
      oldAccStatus: seller.accountStatus,
    });

    return NextResponse.json({ success: true, seller: updatedSeller });
  } catch (error: any) {
    console.error('Admin Reject Seller Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handlePostAdminSellerSuspend(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { sellerId } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing sellerId' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 });
    }

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: {
        accountStatus: SellerAccountStatus.DISABLED,
      },
    });

    await logAudit(session.userId!, 'ADMIN_SUSPEND_SELLER', sellerId, {
      reason: reason.trim(),
      oldAccStatus: seller.accountStatus,
    });

    return NextResponse.json({ success: true, seller: updatedSeller });
  } catch (error: any) {
    console.error('Admin Suspend Seller Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 19. GET /api/admin/overview
// ---------------------------------------------------------------------------
export async function handleGetAdminOverview(_req: NextRequest) {
  try {
    await requireAdmin();

    const [
      totalSellers,
      pendingSellers,
      activeSellers,
      suspendedSellers,
      totalProducts,
      pendingProducts,
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      salesData
    ] = await Promise.all([
      prisma.seller.count(),
      prisma.seller.count({ where: { applicationStatus: 'UNDER_REVIEW' } }),
      prisma.seller.count({ where: { accountStatus: 'ACTIVE' } }),
      prisma.seller.count({ where: { accountStatus: 'SUSPENDED' } }),
      prisma.product.count({
        where: {
          status: 'PUBLISHED',
          OR: [
            { sellerId: null },
            { seller: { accountStatus: 'ACTIVE' } }
          ]
        }
      }),
      prisma.product.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PAID' as any } }),
      prisma.order.count({ where: { status: 'PAYMENT_PENDING' as any } }),
      prisma.order.count({ where: { status: { in: ['CANCELLED' as any] } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'PAID' as any }
      })
    ]);

    const totalSalesINR = (salesData._sum.total || 0) / 100;

    return NextResponse.json({
      totalSalesINR,
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      totalSellers,
      pendingSellers,
      activeSellers,
      suspendedSellers,
      totalProducts,
      pendingProducts,
    });
  } catch (error: any) {
    console.error('Admin Overview Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to fetch admin overview' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 20. GET /api/admin/products
// ---------------------------------------------------------------------------
export async function handleGetAdminProducts(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');

    const products = await prisma.product.findMany({
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
      where: sellerId ? { sellerId } : { status: 'PENDING_APPROVAL' }
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Admin Products Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 21. GET /api/admin/sellers
// ---------------------------------------------------------------------------
export async function handleGetAdminSellers(_req: NextRequest) {
  try {
    await requireAdmin();

    const sellers = await prisma.seller.findMany({
      include: { 
        businessDetails: true,
        user: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ sellers });
  } catch (error: any) {
    console.error('Admin Sellers Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 22. GET /api/admin/price-requests
// ---------------------------------------------------------------------------
export async function handleGetAdminPriceRequests(_req: NextRequest) {
  try {
    await requireAdmin();

    const requests = await prisma.priceChangeRequest.findMany({
      include: { product: true, seller: true },
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Admin Price Requests Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to fetch price requests' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 23. GET / PATCH /api/admin/leads/:id
// ---------------------------------------------------------------------------
export async function handleGetAdminLeadById(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    let lead = await prisma.lead.findFirst({
      where: {
        OR: [{ id }, { orderId: id }, { dedupeKey: `order:${id}` }],
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        order: {
          include: {
            items: true,
            payments: { orderBy: { createdAt: 'desc' } },
            adminNotes: {
              orderBy: { createdAt: 'desc' },
              include: { author: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        convertedOrder: {
          select: { id: true, status: true, total: true, createdAt: true },
        },
      },
    });

    if (!lead) {
      // Check if an un-synced Order exists with this ID and sync it on demand
      const order = await prisma.order.findUnique({ where: { id } });
      if (order) {
        await upsertOrderLead(order.id);
        lead = await prisma.lead.findFirst({
          where: { OR: [{ id }, { orderId: id }] },
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            order: {
              include: {
                items: true,
                payments: { orderBy: { createdAt: 'desc' } },
                adminNotes: {
                  orderBy: { createdAt: 'desc' },
                  include: { author: { select: { id: true, name: true, email: true } } },
                },
              },
            },
            convertedOrder: {
              select: { id: true, status: true, total: true, createdAt: true },
            },
          },
        });
      }
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    console.error('Admin Lead Detail Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

export async function handlePatchAdminLeadById(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(UpdateLeadSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await prisma.lead.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: {
        ...(validation.data.status !== undefined && { status: validation.data.status as any }),
        ...(validation.data.reason !== undefined && { reason: validation.data.reason }),
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error('Admin Lead Update Error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 24. Multi-Shipment Order Tracking Management (Admin-only)
// ---------------------------------------------------------------------------
export async function handlePostAdminOrderShipment(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id: orderId } = await params;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(OrderShipmentCreateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipments: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const data = validation.data;
    const maxNum = order.shipments.reduce((max, s) => Math.max(max, s.shipmentNumber || 0), 0);
    const now = new Date();
    const shippedAt =
      data.status === 'SHIPPED' || data.status === 'IN_TRANSIT' || data.status === 'DELIVERED'
        ? now
        : null;
    const deliveredAt = data.status === 'DELIVERED' ? now : null;

    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.orderShipment.create({
        data: {
          orderId,
          shipmentNumber: maxNum + 1,
          courierName: data.courierName,
          awbCode: data.awbCode,
          trackingUrl: data.trackingUrl || null,
          status: data.status as ShippingStatus,
          shippedAt,
          deliveredAt,
        },
      });

      // Keep existing order/payment info intact; only initialize shippingStatus if NOT_CREATED
      const orderUpdateData: any = {};
      if (order.shippingStatus === ShippingStatus.NOT_CREATED) {
        orderUpdateData.shippingStatus = data.status as ShippingStatus;
        if (!order.awbCode) orderUpdateData.awbCode = data.awbCode;
        if (!order.courierName) orderUpdateData.courierName = data.courierName;
        if (!order.trackingUrl && data.trackingUrl) orderUpdateData.trackingUrl = data.trackingUrl;
      }

      if (
        data.updateOrderStatus &&
        (order.status === 'PAID' || order.status === 'PROCESSING')
      ) {
        orderUpdateData.status = 'SHIPPED';
        if (!order.shippedAt) orderUpdateData.shippedAt = now;
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: 'SHIPPED',
            notes: `Shipment #${maxNum + 1} added (${data.courierName}: ${data.awbCode})`,
          },
        });
      }

      if (Object.keys(orderUpdateData).length > 0) {
        await tx.order.update({
          where: { id: orderId },
          data: orderUpdateData,
        });
      }

      return created;
    });

    await logAudit(admin.userId!, 'ADMIN_ADD_ORDER_SHIPMENT', orderId, {
      shipmentId: shipment.id,
      courierName: shipment.courierName,
      awbCode: shipment.awbCode,
    });

    return NextResponse.json({ success: true, shipment }, { status: 201 });
  } catch (error: any) {
    console.error('Admin add order shipment error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to add shipment' }, { status: 500 });
  }
}

export async function handlePatchAdminOrderShipment(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id: orderId, shipmentId } = await params;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(OrderShipmentUpdateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await prisma.orderShipment.findUnique({
      where: { id: shipmentId },
    });
    if (!existing || existing.orderId !== orderId) {
      return NextResponse.json({ error: 'Shipment not found for this order' }, { status: 404 });
    }

    const data = validation.data;
    const now = new Date();
    const updatePayload: any = {};
    if (data.courierName !== undefined) updatePayload.courierName = data.courierName;
    if (data.awbCode !== undefined) updatePayload.awbCode = data.awbCode;
    if (data.trackingUrl !== undefined) updatePayload.trackingUrl = data.trackingUrl || null;
    if (data.status !== undefined) {
      updatePayload.status = data.status as ShippingStatus;
      if (
        (data.status === 'SHIPPED' || data.status === 'IN_TRANSIT') &&
        !existing.shippedAt
      ) {
        updatePayload.shippedAt = now;
      }
      if (data.status === 'DELIVERED' && !existing.deliveredAt) {
        updatePayload.deliveredAt = now;
      }
    }

    const updated = await prisma.orderShipment.update({
      where: { id: shipmentId },
      data: updatePayload,
    });

    await logAudit(admin.userId!, 'ADMIN_UPDATE_ORDER_SHIPMENT', orderId, {
      shipmentId,
      courierName: updated.courierName,
      awbCode: updated.awbCode,
      status: updated.status,
    });

    return NextResponse.json({ success: true, shipment: updated });
  } catch (error: any) {
    console.error('Admin update order shipment error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}

export async function handleDeleteAdminOrderShipment(_req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id: orderId, shipmentId } = await params;

    const existing = await prisma.orderShipment.findUnique({
      where: { id: shipmentId },
    });
    if (!existing || existing.orderId !== orderId) {
      return NextResponse.json({ error: 'Shipment not found for this order' }, { status: 404 });
    }

    await prisma.orderShipment.delete({
      where: { id: shipmentId },
    });

    await logAudit(admin.userId!, 'ADMIN_DELETE_ORDER_SHIPMENT', orderId, {
      shipmentId,
      awbCode: existing.awbCode,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete order shipment error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to delete shipment' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 25. Private Admin Order Notes (Strictly Admin-only)
// ---------------------------------------------------------------------------
export async function handleGetAdminOrderNotes(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const notes = await prisma.orderAdminNote.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error('Admin get order notes error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to fetch admin notes' }, { status: 500 });
  }
}

export async function handlePostAdminOrderNote(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id: orderId } = await params;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(OrderAdminNoteSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const note = await prisma.orderAdminNote.create({
      data: {
        orderId,
        authorId: admin.userId || null,
        content: validation.data.content,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error: any) {
    console.error('Admin create order note error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to create admin note' }, { status: 500 });
  }
}

export async function handlePatchAdminOrderNote(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id: orderId, noteId } = await params;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(OrderAdminNoteSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await prisma.orderAdminNote.findUnique({
      where: { id: noteId },
    });
    if (!existing || existing.orderId !== orderId) {
      return NextResponse.json({ error: 'Note not found for this order' }, { status: 404 });
    }

    const note = await prisma.orderAdminNote.update({
      where: { id: noteId },
      data: { content: validation.data.content },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('Admin update order note error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to update admin note' }, { status: 500 });
  }
}

export async function handleDeleteAdminOrderNote(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id: orderId, noteId } = await params;

    const existing = await prisma.orderAdminNote.findUnique({
      where: { id: noteId },
    });
    if (!existing || existing.orderId !== orderId) {
      return NextResponse.json({ error: 'Note not found for this order' }, { status: 404 });
    }

    await prisma.orderAdminNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete order note error:', error);
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: 'Failed to delete admin note' }, { status: 500 });
  }
}


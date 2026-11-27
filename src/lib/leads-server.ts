import prisma from '@/lib/db';
import { calculateItemPricePaise } from '@/lib/pricing';
import { LeadSource, LeadStatus, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

export const CONFIRMED_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
  OrderStatus.REFUND_INITIATED,
  OrderStatus.REFUNDED,
];

export const CONFIRMED_ORDER_WHERE: Prisma.OrderWhereInput = {
  status: { in: CONFIRMED_ORDER_STATUSES },
  OR: [
    { paymentStatus: { in: [PaymentStatus.CAPTURED, PaymentStatus.REFUNDED] } },
    { payments: { some: { status: { in: [PaymentStatus.CAPTURED, PaymentStatus.REFUNDED] } } } },
  ],
};

export function isConfirmedOrder(order: {
  status: OrderStatus | string;
  paymentStatus: PaymentStatus | string;
  payments?: Array<{ status: PaymentStatus | string }>;
}): boolean {
  if (!CONFIRMED_ORDER_STATUSES.includes(order.status as OrderStatus)) {
    return false;
  }
  if (
    order.paymentStatus === PaymentStatus.CAPTURED ||
    order.paymentStatus === PaymentStatus.REFUNDED
  ) {
    return true;
  }
  if (Array.isArray(order.payments)) {
    return order.payments.some(
      (p) => p.status === PaymentStatus.CAPTURED || p.status === PaymentStatus.REFUNDED
    );
  }
  return false;
}

export async function markCustomerLeadsConverted(params: {
  orderId: string;
  customerId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
}) {
  const { orderId, customerId, customerEmail, customerPhone } = params;
  const now = new Date();

  try {
    // 1. Mark the lead directly associated with this order as CONVERTED
    await prisma.lead.updateMany({
      where: {
        OR: [{ orderId }, { dedupeKey: `order:${orderId}` }],
      },
      data: {
        status: LeadStatus.CONVERTED,
        convertedOrderId: orderId,
        convertedAt: now,
        lastActivityAt: now,
      },
    });

    // 2. Mark any other open leads for the same customer (cart abandon, previous incomplete checkout) as CONVERTED
    const orClauses: Prisma.LeadWhereInput[] = [];
    if (customerId && !customerId.startsWith('guest_')) {
      orClauses.push({ customerId });
    }
    if (customerEmail && !customerEmail.startsWith('guest_') && !customerEmail.endsWith('@ekorabazaar.in')) {
      orClauses.push({ customerEmail });
    }
    if (customerPhone && customerPhone.trim().length >= 8) {
      orClauses.push({ customerPhone: customerPhone.trim() });
    }

    if (orClauses.length > 0) {
      await prisma.lead.updateMany({
        where: {
          status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED] },
          OR: orClauses,
        },
        data: {
          status: LeadStatus.CONVERTED,
          convertedOrderId: orderId,
          convertedAt: now,
          lastActivityAt: now,
        },
      });
    }
  } catch (err) {
    console.error('Failed to mark customer leads converted:', err);
  }
}

export async function upsertOrderLead(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order || order.isSynthetic) return null;

    const snap = (order.addressSnapshot as Record<string, string | undefined> | null) || null;
    const rawEmail = order.customer?.email || snap?.email || null;
    const customerEmail =
      rawEmail && rawEmail.startsWith('guest_') && snap?.email ? String(snap.email) : rawEmail;
    const customerName = snap?.name || snap?.fullName || order.customer?.name || null;
    const customerPhone = snap?.phone || order.customer?.phone || null;

    if (isConfirmedOrder(order)) {
      await markCustomerLeadsConverted({
        orderId: order.id,
        customerId: order.customerId,
        customerEmail,
        customerPhone,
      });
      return null;
    }

    const source =
      order.status === OrderStatus.CANCELLED
        ? LeadSource.CANCELLED_ORDER
        : LeadSource.INCOMPLETE_CHECKOUT;

    const latestPayment = order.payments?.[0];
    const reason =
      order.cancellationReason ||
      latestPayment?.failureReason ||
      (latestPayment?.status === PaymentStatus.FAILED
        ? 'Payment failed'
        : order.status === OrderStatus.CANCELLED
        ? 'Order cancelled'
        : 'Incomplete checkout (payment pending)');

    const itemsSnapshot = order.items.map((item) => ({
      productId: item.productId,
      productName: item.productNameSnapshot,
      quantity: item.quantity,
      unitPricePaise: item.priceSnapshot,
      subtotalPaise: item.subtotal,
    }));

    const dedupeKey = `order:${order.id}`;

    const existing = await prisma.lead.findUnique({
      where: { dedupeKey },
      select: { id: true, status: true },
    });

    if (existing) {
      return await prisma.lead.update({
        where: { dedupeKey },
        data: {
          source,
          customerId: order.customerId,
          orderId: order.id,
          customerName,
          customerEmail,
          customerPhone,
          itemsSnapshot,
          orderValue: order.total,
          currency: order.currency,
          reason,
          lastActivityAt: order.updatedAt,
        },
      });
    }

    return await prisma.lead.create({
      data: {
        dedupeKey,
        source,
        status: LeadStatus.NEW,
        customerId: order.customerId,
        orderId: order.id,
        customerName,
        customerEmail,
        customerPhone,
        itemsSnapshot,
        orderValue: order.total,
        currency: order.currency,
        reason,
        lastActivityAt: order.updatedAt,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('upsertOrderLead error:', err);
    return null;
  }
}

export async function captureAbandonedCheckoutLead(params: {
  sessionKey: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPricePaise: number;
    subtotalPaise: number;
  }>;
  orderValuePaise: number;
  reason?: string;
}) {
  try {
    const dedupeKey = `checkout:${params.sessionKey}`;
    const existing = await prisma.lead.findUnique({
      where: { dedupeKey },
      select: { id: true, status: true },
    });

    if (existing?.status === LeadStatus.CONVERTED) {
      return null;
    }

    return await prisma.lead.upsert({
      where: { dedupeKey },
      create: {
        dedupeKey,
        source: LeadSource.ABANDONED_CHECKOUT,
        status: LeadStatus.NEW,
        customerId: params.customerId || null,
        customerName: params.customerName || null,
        customerEmail: params.customerEmail || null,
        customerPhone: params.customerPhone || null,
        itemsSnapshot: params.items,
        orderValue: Math.max(0, Math.round(params.orderValuePaise)),
        currency: 'INR',
        reason: params.reason || 'Abandoned checkout before payment initiation',
        lastActivityAt: new Date(),
      },
      update: {
        customerId: params.customerId || undefined,
        customerName: params.customerName || undefined,
        customerEmail: params.customerEmail || undefined,
        customerPhone: params.customerPhone || undefined,
        itemsSnapshot: params.items,
        orderValue: Math.max(0, Math.round(params.orderValuePaise)),
        reason: params.reason || 'Abandoned checkout before payment initiation',
        lastActivityAt: new Date(),
      },
    });
  } catch (err) {
    console.error('captureAbandonedCheckoutLead error:', err);
    return null;
  }
}

let lastLeadSyncAt = 0;

export async function syncLeadsFromExistingData(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastLeadSyncAt < 30_000) {
    return;
  }
  lastLeadSyncAt = now;

  try {
    // 1. Sync unconfirmed/cancelled orders into Lead
    const unconfirmedOrders = await prisma.order.findMany({
      where: {
        isSynthetic: false,
        NOT: CONFIRMED_ORDER_WHERE,
      },
      include: {
        items: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    });

    for (const order of unconfirmedOrders) {
      const snap = (order.addressSnapshot as Record<string, string | undefined> | null) || null;
      const rawEmail = order.customer?.email || snap?.email || null;
      const customerEmail =
        rawEmail && rawEmail.startsWith('guest_') && snap?.email ? String(snap.email) : rawEmail;
      const customerName = snap?.name || snap?.fullName || order.customer?.name || null;
      const customerPhone = snap?.phone || order.customer?.phone || null;
      const source =
        order.status === OrderStatus.CANCELLED
          ? LeadSource.CANCELLED_ORDER
          : LeadSource.INCOMPLETE_CHECKOUT;
      const latestPayment = order.payments?.[0];
      const reason =
        order.cancellationReason ||
        latestPayment?.failureReason ||
        (latestPayment?.status === PaymentStatus.FAILED
          ? 'Payment failed'
          : order.status === OrderStatus.CANCELLED
          ? 'Order cancelled'
          : 'Incomplete checkout (payment pending)');
      const itemsSnapshot = order.items.map((item) => ({
        productId: item.productId,
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        unitPricePaise: item.priceSnapshot,
        subtotalPaise: item.subtotal,
      }));
      const dedupeKey = `order:${order.id}`;

      await prisma.lead.upsert({
        where: { dedupeKey },
        create: {
          dedupeKey,
          source,
          status: LeadStatus.NEW,
          customerId: order.customerId,
          orderId: order.id,
          customerName,
          customerEmail,
          customerPhone,
          itemsSnapshot,
          orderValue: order.total,
          currency: order.currency,
          reason,
          lastActivityAt: order.updatedAt,
          createdAt: order.createdAt,
        },
        update: {
          source,
          customerName,
          customerEmail,
          customerPhone,
          itemsSnapshot,
          orderValue: order.total,
          reason,
          lastActivityAt: order.updatedAt,
        },
      });
    }

    // 2. Sync non-empty Carts (stale >= 15 mins) as ABANDONED_CHECKOUT leads if user has no newer confirmed order
    const staleCutoff = new Date(Date.now() - 15 * 60 * 1000);
    const activeCarts = await prisma.cart.findMany({
      where: {
        updatedAt: { lt: staleCutoff },
        items: { some: {} },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addresses: {
              orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
              take: 1,
            },
            orders: {
              where: CONFIRMED_ORDER_WHERE,
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, createdAt: true },
            },
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                customerPrice: true,
                source: true,
                wholesaleTiers: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 150,
    });

    for (const cart of activeCarts) {
      if (!cart.items || cart.items.length === 0 || !cart.user) continue;
      if (cart.user.email.startsWith('guest_')) continue;

      const latestConfirmed = cart.user.orders?.[0];
      if (latestConfirmed && latestConfirmed.createdAt > cart.updatedAt) {
        // Customer already completed an order after this cart update
        await prisma.lead.updateMany({
          where: {
            dedupeKey: `cart:${cart.id}`,
            status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED] },
          },
          data: {
            status: LeadStatus.CONVERTED,
            convertedOrderId: latestConfirmed.id,
            convertedAt: latestConfirmed.createdAt,
          },
        });
        continue;
      }

      // Avoid duplicating if the same user already has an order-based lead created around/after cart update
      const existingOrderLead = await prisma.lead.findFirst({
        where: {
          customerId: cart.userId,
          orderId: { not: null },
          createdAt: { gte: new Date(cart.updatedAt.getTime() - 60 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (existingOrderLead) continue;

      const itemsSnapshot = cart.items.map((ci) => {
        const unitPaise = calculateItemPricePaise(ci.product, ci.quantity);
        return {
          productId: ci.productId,
          productName: ci.product?.title || 'Product',
          quantity: ci.quantity,
          unitPricePaise: unitPaise,
          subtotalPaise: unitPaise * ci.quantity,
        };
      });
      const totalPaise = itemsSnapshot.reduce((sum, i) => sum + i.subtotalPaise, 0);
      if (totalPaise <= 0) continue;

      const defaultAddr = cart.user.addresses?.[0];
      const customerName = cart.user.name || defaultAddr?.name || null;
      const customerPhone = cart.user.phone || defaultAddr?.phone || null;

      const dedupeKey = `cart:${cart.id}`;
      const existingCartLead = await prisma.lead.findUnique({
        where: { dedupeKey },
        select: { id: true, status: true },
      });

      if (existingCartLead) {
        await prisma.lead.update({
          where: { dedupeKey },
          data: {
            customerName,
            customerEmail: cart.user.email,
            customerPhone,
            itemsSnapshot,
            orderValue: totalPaise,
            lastActivityAt: cart.updatedAt,
          },
        });
      } else {
        await prisma.lead.create({
          data: {
            dedupeKey,
            source: LeadSource.ABANDONED_CHECKOUT,
            status: LeadStatus.NEW,
            customerId: cart.userId,
            customerName,
            customerEmail: cart.user.email,
            customerPhone,
            itemsSnapshot,
            orderValue: totalPaise,
            currency: 'INR',
            reason: 'Abandoned cart / checkout with unpurchased items',
            lastActivityAt: cart.updatedAt,
            createdAt: cart.createdAt,
          },
        });
      }
    }
  } catch (err) {
    console.error('syncLeadsFromExistingData error:', err);
  }
}

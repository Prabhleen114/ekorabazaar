import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { PaymentStatus, SellerApplicationStatus, OrderStatus, ShippingStatus } from '@prisma/client';
import { logPurchase, logPaymentFail } from '@/lib/server-ci';
import { restoreExpiredOrders } from '@/lib/orders-server';
import { upsertOrderLead, markCustomerLeadsConverted } from '@/lib/leads-server';
import { GET as customerIntelligenceCronGet } from '@/customer-intelligence/api/cron/route';

export async function handleRazorpayWebhook(req: NextRequest) {
  try {
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const rawBody = await req.text();

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = req.headers.get('x-razorpay-event-id') || event.id;

    if (!eventId) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      if (event.event === 'payment.captured' || event.event === 'order.paid') {
        const payload = event.payload.payment.entity;
        const razorpayOrderId = payload.order_id;
        if (razorpayOrderId) {
          const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
          if (payment && payment.orderId) {
            const { ensureAdminNotification } = await import('@/lib/email');
            await ensureAdminNotification(payment.orderId);
          }
        }
      }
      return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    const payload = event.payload.payment.entity;

    const txResult = await prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: {
          eventId: eventId,
          eventType: event.event,
          payload: JSON.stringify(payload),
        },
      });

      if (event.event === 'payment.captured' || event.event === 'order.paid') {
        const razorpayOrderId = payload.order_id;
        const razorpayPaymentId = payload.id;

        const payment = await tx.payment.findUnique({
          where: { razorpayOrderId },
          include: { order: { include: { items: true } } },
        });

        if (!payment) {
          return;
        }

        if (payment.status === PaymentStatus.CAPTURED) {
          return { justCapturedOrderId: payment.orderId };
        }

        if (payment.type === 'SELLER_ONBOARDING' && payment.sellerId) {
          logPaymentFail({
            orderId: payment.orderId || undefined,
            errorCode: payload.error_code || 'PAYMENT_FAILED',
            errorDescription: payload.error_description || undefined,
            amount: payload.amount,
            customerId: payment.userId,
          }).catch(() => {});
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.CAPTURED, razorpayPaymentId },
          });

          await tx.seller.update({
            where: { id: payment.sellerId },
            data: { applicationStatus: SellerApplicationStatus.UNDER_REVIEW },
          });
        }

        if (payment.type === 'CUSTOMER_ORDER' && payment.orderId && payment.order) {
          const paymentUpdateResult = await tx.payment.updateMany({
            where: { id: payment.id, status: PaymentStatus.PENDING },
            data: { status: PaymentStatus.CAPTURED, razorpayPaymentId },
          });

          if (paymentUpdateResult.count === 0) {
            return { justCapturedOrderId: null };
          }

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.PAID, paymentStatus: PaymentStatus.CAPTURED },
          });

          if (payment.order.couponId) {
            try {
              const existingUsage = await tx.couponUsage.findUnique({
                where: { orderId: payment.orderId },
              });
              if (!existingUsage) {
                const customer = await tx.user.findUnique({
                  where: { id: payment.userId },
                  select: { email: true, phone: true },
                });
                const addressSnapshot = payment.order.addressSnapshot as any;
                await tx.couponUsage.create({
                  data: {
                    couponId: payment.order.couponId,
                    orderId: payment.orderId,
                    userId: payment.userId,
                    customerEmail: customer?.email || addressSnapshot?.email || null,
                    customerPhone: customer?.phone || addressSnapshot?.phone || null,
                    discountApplied: payment.order.discount || 0,
                  },
                });
                await tx.coupon.update({
                  where: { id: payment.order.couponId },
                  data: { usageCount: { increment: 1 } },
                });
              }
            } catch (couponErr) {
              console.error('Failed to record coupon usage in razorpay webhook:', couponErr);
            }
          }
          logPurchase({
            orderId: payment.orderId,
            amount: payment.amount,
            itemCount: payment.order?.items?.length || 1,
            customerId: payment.userId,
            source: 'razorpay_webhook',
          }).catch(() => {});

          return { justCapturedOrderId: payment.orderId };
        }
      } else if (event.event === 'payment.failed') {
        const razorpayOrderId = payload.order_id;

        const payment = await tx.payment.findUnique({
          where: { razorpayOrderId },
          include: { order: { include: { items: true } } },
        });

        if (payment && payment.status === PaymentStatus.PENDING) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.FAILED },
          });

          if (payment.orderId) {
            await tx.order.update({
              where: { id: payment.orderId },
              data: { paymentStatus: PaymentStatus.FAILED, status: OrderStatus.CANCELLED },
            });

            if (payment.order) {
              for (const item of payment.order.items) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { increment: item.quantity } },
                });
              }
            }
          }
        }
        return { justCapturedOrderId: null, failedOrderId: payment?.orderId || null };
      }
      return { justCapturedOrderId: null, failedOrderId: null };
    });

    if (txResult?.justCapturedOrderId) {
      await markCustomerLeadsConverted({ orderId: txResult.justCapturedOrderId }).catch(() => {});
      try {
        const { ensureAdminNotification } = await import('@/lib/email');
        await ensureAdminNotification(txResult.justCapturedOrderId);
      } catch (emailErr) {
        console.error('Failed to dynamically import email lib in webhook:', emailErr);
      }
    }

    if ((txResult as any)?.failedOrderId) {
      await upsertOrderLead((txResult as any).failedOrderId).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleShiprocketWebhook(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-api-key');
    const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;

    if (!webhookToken) {
      console.error('Shiprocket Webhook: Server missing SHIPROCKET_WEBHOOK_TOKEN config');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (authHeader !== webhookToken) {
      console.warn('Shiprocket Webhook: Invalid token rejected');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    const shipmentId = payload.shipment_id ? String(payload.shipment_id) : null;
    const awb = payload.awb;
    const status = payload.current_status || payload.status;

    if (!shipmentId || !status) {
      return NextResponse.json({ error: 'Missing shipment_id or status' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ shipmentId: shipmentId }, ...(awb ? [{ awbCode: awb }] : [])],
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found for given shipment' }, { status: 404 });
    }

    const statusUpper = status.toUpperCase();
    let newShippingStatus = order.shippingStatus;
    let newOrderStatus = order.status;
    let shippedAt = order.shippedAt;
    let deliveredAt = order.deliveredAt;

    if (statusUpper === 'SHIPPED' || statusUpper === 'DISPATCHED') {
      newShippingStatus = ShippingStatus.SHIPPED;
      newOrderStatus = OrderStatus.SHIPPED;
      if (!shippedAt) shippedAt = new Date();
    } else if (statusUpper === 'IN TRANSIT' || statusUpper === 'OUT FOR DELIVERY') {
      newShippingStatus = ShippingStatus.IN_TRANSIT;
    } else if (statusUpper === 'DELIVERED') {
      newShippingStatus = ShippingStatus.DELIVERED;
      newOrderStatus = OrderStatus.DELIVERED;
      if (!deliveredAt) deliveredAt = new Date();
    } else if (statusUpper === 'CANCELED' || statusUpper === 'CANCELLED') {
      newShippingStatus = ShippingStatus.CANCELLED;
    } else if (
      statusUpper === 'EXCEPTION' ||
      statusUpper === 'RTO' ||
      statusUpper === 'UNDELIVERED' ||
      statusUpper === 'DESTROYED'
    ) {
      newShippingStatus = ShippingStatus.EXCEPTION;
    }

    if (
      order.shippingStatus === ShippingStatus.DELIVERED &&
      newShippingStatus !== ShippingStatus.DELIVERED
    ) {
      return NextResponse.json({
        success: true,
        message: 'Ignored older webhook for delivered order',
      });
    }
    if (order.shippingStatus === ShippingStatus.CANCELLED) {
      return NextResponse.json({
        success: true,
        message: 'Ignored webhook for cancelled shipment',
      });
    }

    if (newShippingStatus !== order.shippingStatus || newOrderStatus !== order.status) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shippingStatus: newShippingStatus,
          status: newOrderStatus,
          shippedAt,
          deliveredAt,
        },
      });
    }

    // Sync matching OrderShipment rows if present
    await prisma.orderShipment.updateMany({
      where: {
        orderId: order.id,
        ...(awb ? { awbCode: awb } : {}),
      },
      data: {
        status: newShippingStatus,
        ...(shippedAt ? { shippedAt } : {}),
        ...(deliveredAt ? { deliveredAt } : {}),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Shiprocket webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function handleCronRestoreExpired(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restoredCount = await restoreExpiredOrders(30);
    return NextResponse.json({
      success: true,
      restoredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron restore expired orders error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleCronIntelligence(req: NextRequest) {
  return customerIntelligenceCronGet(req);
}

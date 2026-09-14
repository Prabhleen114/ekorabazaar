import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ShippingStatus, OrderStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-api-key');
    const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    
    // Webhook must fail closed
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

    // Authoritative matching strategy
    const order = await prisma.order.findFirst({
      where: { 
        OR: [
          { shipmentId: shipmentId },
          ...(awb ? [{ awbCode: awb }] : [])
        ]
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found for given shipment' }, { status: 404 });
    }

    // Explicit Status Mapping
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
      // Do NOT cancel the Ekora payment/order, just the shipment.
    } else if (statusUpper === 'EXCEPTION' || statusUpper === 'RTO' || statusUpper === 'UNDELIVERED' || statusUpper === 'DESTROYED') {
      newShippingStatus = ShippingStatus.EXCEPTION;
    }

    // Terminal state protection: Do not move DELIVERED backwards
    if (order.shippingStatus === ShippingStatus.DELIVERED && newShippingStatus !== ShippingStatus.DELIVERED) {
      return NextResponse.json({ success: true, message: 'Ignored older webhook for delivered order' });
    }
    // Do not move CANCELLED backwards
    if (order.shippingStatus === ShippingStatus.CANCELLED) {
      return NextResponse.json({ success: true, message: 'Ignored webhook for cancelled shipment' });
    }

    if (newShippingStatus !== order.shippingStatus || newOrderStatus !== order.status) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shippingStatus: newShippingStatus,
          status: newOrderStatus,
          shippedAt,
          deliveredAt
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Shiprocket webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
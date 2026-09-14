import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { createShiprocketOrder, generateAWB, requestPickup, generateLabel } from '@/lib/shiprocket';
import { ShippingStatus } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'PAYMENT_PENDING' || order.paymentStatus !== 'CAPTURED') {
      return NextResponse.json({ error: 'Cannot ship an unpaid order' }, { status: 400 });
    }

    if (action === 'CREATE') {
      if (order.shiprocketOrderId || order.shippingStatus !== ShippingStatus.NOT_CREATED) {
        return NextResponse.json({ error: 'Shiprocket order already exists or in progress', order });
      }

      // 1. Phone validation
      const snap = order.addressSnapshot as any;
      if (!snap || !snap.name || !snap.line1 || !snap.city || !snap.state || !snap.pincode) {
        return NextResponse.json({ error: 'Incomplete shipping address' }, { status: 400 });
      }

      if (!snap.phone || snap.phone.length < 10) {
        return NextResponse.json({ error: 'A valid customer phone number is required in the delivery address' }, { status: 400 });
      }

      // 2. Pickup Location Config
      const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION;
      if (!pickupLocation) {
        return NextResponse.json({ error: 'Server misconfiguration: SHIPROCKET_PICKUP_LOCATION is missing' }, { status: 500 });
      }

      // 3. Package Dimensions + Weight calculation
      // We need to fetch the actual products to get their dimensions
      const productIds = order.items.map(i => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      let totalWeightKg = 0;
      let maxLength = 0;
      let maxBreadth = 0;
      let totalHeight = 0;

      for (const item of order.items) {
        const prod = productMap.get(item.productId);
        if (!prod || prod.weightKg == null || prod.lengthCm == null || prod.breadthCm == null || prod.heightCm == null) {
          return NextResponse.json({ error: `Product ${item.productId} is missing physical weight/dimensions in the catalog. Cannot ship.` }, { status: 400 });
        }
        totalWeightKg += (prod.weightKg * item.quantity);
        maxLength = Math.max(maxLength, prod.lengthCm);
        maxBreadth = Math.max(maxBreadth, prod.breadthCm);
        totalHeight += (prod.heightCm * item.quantity);
      }
      
      // Shiprocket requires min 0.05kg and at least 0.5 cm
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
        billing_address_2: snap.line2 || "",
        billing_city: snap.city,
        billing_pincode: String(snap.pincode),
        billing_state: snap.state,
        billing_country: snap.country || "India",
        billing_email: order.customer.email,
        billing_phone: snap.phone,
        shipping_is_billing: true,
        order_items: order.items.map((item: any) => ({
          name: item.productNameSnapshot || 'Product',
          sku: item.productId,
          units: item.quantity,
          selling_price: item.priceSnapshot / 100
        })),
        payment_method: 'Prepaid',
        sub_total: order.subtotal / 100,
        length: parseFloat(maxLength.toFixed(2)),
        breadth: parseFloat(maxBreadth.toFixed(2)),
        height: parseFloat(totalHeight.toFixed(2)),
        weight: parseFloat(totalWeightKg.toFixed(3))
      };

      // 4. Idempotency Lock: update status to CREATING to prevent concurrent duplicates
      const lock = await prisma.order.updateMany({
        where: { id: order.id, shippingStatus: ShippingStatus.NOT_CREATED },
        data: { shippingStatus: ShippingStatus.CREATED } // Optimistic locking
      });

      if (lock.count === 0) {
        return NextResponse.json({ error: 'Shiprocket order creation already in progress or completed' }, { status: 400 });
      }

      let srRes;
      try {
        srRes = await createShiprocketOrder(payload);
      } catch (err: any) {
        // Rollback lock ONLY if remote creation failed
        await prisma.order.update({
          where: { id: order.id },
          data: { shippingStatus: ShippingStatus.NOT_CREATED }
        });
        throw err;
      }
      
      // If we reach here, Shiprocket creation succeeded.
      // We MUST NOT rollback to NOT_CREATED even if the next DB update fails,
      // because the remote order already exists!
      try {
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            shiprocketOrderId: String(srRes.order_id),
            shipmentId: String(srRes.shipment_id)
          }
        });
        return NextResponse.json({ message: 'Shiprocket order created', order: updated });
      } catch (dbErr: any) {
        console.error('CRITICAL: Shiprocket order created but DB update failed!', srRes, dbErr);
        // The order is stuck in CREATED state but lacks IDs. Admin must manually reconcile.
        return NextResponse.json({ error: 'Order created in Shiprocket but DB update failed. Manual reconciliation required.' }, { status: 500 });
      }
    }

    if (action === 'ASSIGN_AWB') {
      if (order.shippingStatus !== ShippingStatus.CREATED) {
        return NextResponse.json({ error: 'Invalid state for AWB assignment' }, { status: 400 });
      }
      if (!order.shipmentId || order.awbCode) {
        return NextResponse.json({ error: 'Shipment ID not found or AWB already assigned' }, { status: 400 });
      }

      // Optimistic lock for AWB to prevent concurrent requests
      const lock = await prisma.order.updateMany({
        where: { id: order.id, shippingStatus: ShippingStatus.CREATED },
        data: { shippingStatus: ShippingStatus.AWB_ASSIGNED } // Temporarily advance state
      });

      if (lock.count === 0) {
        return NextResponse.json({ error: 'AWB assignment already in progress or completed' }, { status: 400 });
      }

      let awbRes;
      try {
        awbRes = await generateAWB(order.shipmentId);
      } catch (err: any) {
        // Rollback lock if Shiprocket request failed
        await prisma.order.update({
          where: { id: order.id },
          data: { shippingStatus: ShippingStatus.CREATED }
        });
        throw err;
      }

      const awbCode = awbRes.response?.data?.awb_code;
      const courierName = awbRes.response?.data?.courier_name;

      if (!awbCode) {
        return NextResponse.json({ error: 'Failed to extract AWB code from response' }, { status: 500 });
      }

      const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          awbCode,
          courierName,
          trackingUrl,
          shippingStatus: ShippingStatus.AWB_ASSIGNED
        }
      });
      return NextResponse.json({ message: 'AWB Assigned', order: updated });
    }

    if (action === 'REQUEST_PICKUP') {
      if (order.shippingStatus !== ShippingStatus.AWB_ASSIGNED) {
        return NextResponse.json({ error: 'Invalid state for pickup request. AWB must be assigned.' }, { status: 400 });
      }
      if (!order.shipmentId) {
        return NextResponse.json({ error: 'Shipment ID not found' }, { status: 400 });
      }
      
      const lock = await prisma.order.updateMany({
        where: { id: order.id, shippingStatus: ShippingStatus.AWB_ASSIGNED },
        data: { shippingStatus: ShippingStatus.PICKUP_SCHEDULED }
      });
      
      if (lock.count === 0) {
        return NextResponse.json({ error: 'Pickup scheduling already in progress or completed' }, { status: 400 });
      }

      try {
        await requestPickup(order.shipmentId);
      } catch (err: any) {
        await prisma.order.update({
          where: { id: order.id },
          data: { shippingStatus: ShippingStatus.AWB_ASSIGNED }
        });
        throw err;
      }
      
      const updated = await prisma.order.findUnique({ where: { id: order.id }});
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
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
import { Resend } from 'resend';
import prisma from '@/lib/db';

export async function ensureAdminNotification(orderId: string) {
  const emailEventId = `admin_email_order_${orderId}`;

  // 1. Check if email was already sent successfully
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId: emailEventId } });
  if (existing && existing.processed) {
    return true; // Already safely sent
  }

  // 2. Try to acquire lock
  if (!existing) {
    try {
      await prisma.webhookEvent.create({
        data: {
          eventId: emailEventId,
          eventType: 'admin_notification_pending',
          payload: { orderId },
          processed: false
        }
      });
    } catch (e: any) {
      // If unique constraint failed, another instance is already handling it
      if (e.code === 'P2002') return false;
      console.error("Failed to acquire email lock:", e);
      return false;
    }
  }

  // 3. We have the lock. Fetch data and send.
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: { select: { email: true } },
        payments: { where: { status: 'CAPTURED' }, take: 1 }
      }
    });

    if (!fullOrder || fullOrder.payments.length === 0) {
      return false; // Cannot send without valid order/payment
    }

    const success = await sendAdminOrderNotification(fullOrder, (fullOrder as any).payments[0]);

    if (success) {
      // 4. Mark lock as successfully processed
      await prisma.webhookEvent.update({
        where: { eventId: emailEventId },
        data: { processed: true, processedAt: new Date(), eventType: 'admin_notification_sent' }
      });
      return true;
    } else {
      // 5. Release lock so next retry can attempt
      await prisma.webhookEvent.delete({ where: { eventId: emailEventId } });
      return false;
    }
  } catch (error) {
    // Release lock on unexpected failure
    await prisma.webhookEvent.delete({ where: { eventId: emailEventId } }).catch(() => {});
    return false;
  }
}


const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_ORDER_EMAIL = process.env.ADMIN_ORDER_EMAIL || 'salesekora@gmail.com';

export async function sendAdminOrderNotification(order: any, payment: any) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not defined. Admin order notification email was not sent.");
    return false;
  }

  const subject = `New Paid Order — #${order.id}`;

  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName || item.productId}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${(item.price / 100).toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${((item.price * item.quantity) / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const customerName = order.addressSnapshot?.name || order.customer?.name || 'Guest';
  const customerEmail = order.customer?.email || 'N/A';
  const customerPhone = order.addressSnapshot?.phone || 'N/A';

  const address = order.addressSnapshot ? `
    <p>
      ${order.addressSnapshot.name}<br/>
      ${order.addressSnapshot.line1} ${order.addressSnapshot.line2 ? '<br/>' + order.addressSnapshot.line2 : ''}<br/>
      ${order.addressSnapshot.city}, ${order.addressSnapshot.state} ${order.addressSnapshot.pincode}<br/>
      ${order.addressSnapshot.country}<br/>
      Phone: ${order.addressSnapshot.phone}
    </p>
  ` : '<p>No delivery address provided.</p>';

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #4a5568;">New Paid Order</h2>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">PAID</span></p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

      <h3>Customer Information</h3>
      <p><strong>Name:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

      <h3>Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f7fafc; text-align: left;">
            <th style="padding: 8px; border-bottom: 2px solid #cbd5e0;">Product</th>
            <th style="padding: 8px; border-bottom: 2px solid #cbd5e0;">Qty</th>
            <th style="padding: 8px; border-bottom: 2px solid #cbd5e0;">Price</th>
            <th style="padding: 8px; border-bottom: 2px solid #cbd5e0;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Total Amount:</td>
            <td style="padding: 8px; font-weight: bold;">₹${(order.total / 100).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

      <h3>Payment Details</h3>
      <p><strong>Razorpay Order ID:</strong> ${payment.razorpayOrderId || 'N/A'}</p>
      <p><strong>Razorpay Payment ID:</strong> ${payment.razorpayPaymentId || 'N/A'}</p>
      <p><strong>Currency:</strong> ${payment.currency || 'INR'}</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

      <h3>Delivery Address</h3>
      ${address}
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Ekora Bazaar Orders <orders@ekorabazaar.com>', // User needs to verify this domain in Resend
      to: [ADMIN_ORDER_EMAIL],
      subject: subject,
      html: htmlContent,
    });
    return data;
  } catch (error) {
    console.error("Failed to send admin order notification:", error);
    return false;
  }
}

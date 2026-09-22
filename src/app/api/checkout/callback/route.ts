import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { PaymentStatus, OrderStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const razorpayOrderId = formData.get('razorpay_order_id') as string
    const razorpayPaymentId = formData.get('razorpay_payment_id') as string
    const razorpaySignature = formData.get('razorpay_signature') as string

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      // If we are missing data, redirect to an error page or back to checkout
      return NextResponse.redirect(new URL('/checkout?error=Missing+payment+parameters', req.url), 303)
    }

    // 1. Signature Verification
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValid) {
      return NextResponse.redirect(new URL('/checkout?error=Invalid+payment+signature', req.url), 303)
    }

    // 2. Transactional Update & Inventory Protection
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: { include: { items: true } } }
      })

      if (!payment || !payment.order) {
        throw new Error("Payment or Order record not found.")
      }

      if (payment.status === PaymentStatus.CAPTURED) {
        return { alreadyVerified: true, orderId: payment.orderId, userId: payment.userId }
      }

      const paymentUpdateResult = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.CAPTURED,
          razorpayPaymentId,
        }
      })

      if (paymentUpdateResult.count === 0) {
        return { alreadyVerified: true, orderId: payment.orderId, userId: payment.userId }
      }

      await tx.order.update({
        where: { id: payment.orderId! },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.CAPTURED
        }
      })

      // Clear the cart securely using the payment's userId
      try {
        const cart = await tx.cart.findUnique({ where: { userId: payment.userId } })
        if (cart) {
          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
              productId: { in: payment.order.items.map(i => i.productId) }
            }
          })
        }
      } catch (err) {
        console.error("Failed to clear cart items after payment verification", err)
      }

      return { alreadyVerified: false, orderId: payment.orderId, userId: payment.userId }
    })

    // 3. Ensure Admin Notification Email is sent
    if (result.orderId && !result.alreadyVerified) {
      try {
        const { ensureAdminNotification } = await import('@/lib/email');
        await ensureAdminNotification(result.orderId);
      } catch (emailErr) {
        console.error("Failed to dynamically import email lib:", emailErr);
      }

      try {
        await prisma.event.create({
          data: {
            userId: result.userId,
            sessionId: "checkout_callback_" + result.orderId,
            eventName: "purchase",
            metadata: {
              orderId: result.orderId,
              razorpayOrderId,
              razorpayPaymentId,
            },
          },
        });
      } catch (eventErr) {
      }
    }

    // Success! Redirect to orders page
    return NextResponse.redirect(new URL('/account/orders', req.url), 303)
  } catch (error: any) {
    console.error("Razorpay Callback Error:", error)
    return NextResponse.redirect(new URL('/checkout?error=Payment+verification+failed', req.url), 303)
  }
}
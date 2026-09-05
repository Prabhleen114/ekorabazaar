import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { PaymentStatus, OrderStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing Razorpay payment parameters." }, { status: 400 })
    }

    // 1. Signature Verification
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 })
    }

    // 2. Transactional Update & Inventory Protection
    const result = await prisma.$transaction(async (tx) => {
      // Find the payment and lock it (using standard Prisma queries, though raw query FOR UPDATE is better for high concurrency)
      const payment = await tx.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: { include: { items: true } } }
      })

      if (!payment || !payment.order) {
        throw new Error("Payment or Order record not found.")
      }

      if (payment.userId !== session.userId) {
        throw new Error("Unauthorized payment manipulation.")
      }

      if (payment.status === PaymentStatus.CAPTURED) {
        return { alreadyVerified: true, orderId: payment.orderId }
      }

      // Optimistic lock: attempt to transition status from PENDING to CAPTURED
      const paymentUpdateResult = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.CAPTURED,
          razorpayPaymentId,
        }
      })

      if (paymentUpdateResult.count === 0) {
        // Another process (e.g., webhook) already verified this payment concurrently.
        return { alreadyVerified: true, orderId: payment.orderId }
      }

      // Decrement inventory safely (Inventory Protection)
      for (const item of payment.order.items) {
        // Find product to check stock first
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId} during payment verification.`)
        }

        // Decrement stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      // Mark Order as PAID
      await tx.order.update({
        where: { id: payment.orderId! },
        data: {
          status: OrderStatus.PAID
        }
      })

      return { alreadyVerified: false, orderId: payment.orderId }
    })

    return NextResponse.json({ success: true, message: "Checkout payment verified.", orderId: result.orderId })
  } catch (error: any) {
    console.error("Verify Checkout Payment Error:", error)
    if (error.message === "UNAUTHORIZED" || error.message === "Unauthorized payment manipulation.") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

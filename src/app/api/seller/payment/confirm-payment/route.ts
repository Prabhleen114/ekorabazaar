import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { PaymentStatus, SellerApplicationStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing Razorpay payment parameters." }, { status: 400 })
    }

    // Server-side signature verification
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 })
    }

    // Transactionally update the Payment and the Seller application status
    const result = await prisma.$transaction(async (tx) => {
      // Find pending payment
      const payment = await tx.payment.findUnique({
        where: { razorpayOrderId }
      })

      if (!payment) {
        throw new Error("Payment record not found.")
      }
      
      if (payment.userId !== session.userId) {
        throw new Error("Unauthorized payment manipulation.")
      }

      if (payment.status === PaymentStatus.CAPTURED) {
        return { alreadyVerified: true, payment }
      }

      // Optimistic lock
      const updatedPaymentResult = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.CAPTURED,
          razorpayPaymentId,
        }
      })

      if (updatedPaymentResult.count === 0) {
        return { alreadyVerified: true, payment }
      }

      // Update seller status (move to UNDER_REVIEW, NOT active)
      if (payment.sellerId) {
        await tx.seller.update({
          where: { id: payment.sellerId },
          data: {
            applicationStatus: SellerApplicationStatus.UNDER_REVIEW
          }
        })
      }

      return { alreadyVerified: false, payment }
    })

    return NextResponse.json({ success: true, message: "Payment verified successfully.", result })
  } catch (error: any) {
    console.error("Verify Seller Payment Error:", error)
    if (error.message === "UNAUTHORIZED" || error.message === "Unauthorized payment manipulation.") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

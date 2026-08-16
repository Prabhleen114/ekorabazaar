import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { razorpay } from '@/lib/razorpay'
import { PaymentType, PaymentStatus, SellerApplicationStatus } from '@prisma/client'

const SELLER_ONBOARDING_FEE = parseInt(process.env.SELLER_ONBOARDING_FEE || '49900', 10) // in paise (499 INR)

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    // Check if the seller exists and is in the correct state
    const seller = await prisma.seller.findUnique({
      where: { userId: session.userId! }
    })

    if (!seller) {
      return NextResponse.json({ error: "Seller application not found. Complete application first." }, { status: 400 })
    }

    if (seller.applicationStatus !== SellerApplicationStatus.DRAFT && seller.applicationStatus !== SellerApplicationStatus.REJECTED) {
      return NextResponse.json({ error: "Invalid application status for payment." }, { status: 400 })
    }

    let rzpOrderId = "mock_rzp_order_id_" + Date.now()

    if (razorpay) {
      const options = {
        amount: SELLER_ONBOARDING_FEE,
        currency: "INR",
        receipt: `seller_reg_${seller.id.substring(0,10)}_${Date.now()}`
      };
      
      const order = await razorpay.orders.create(options);
      rzpOrderId = order.id
    }

    // Create an internal payment record (Unverified)
    const payment = await prisma.payment.create({
      data: {
        userId: session.userId!,
        sellerId: seller.id,
        amount: SELLER_ONBOARDING_FEE,
        currency: 'INR',
        type: PaymentType.SELLER_ONBOARDING,
        status: PaymentStatus.PENDING,
        razorpayOrderId: rzpOrderId,
      }
    })

    return NextResponse.json({ 
      success: true, 
      paymentId: payment.id, 
      razorpayOrderId: rzpOrderId,
      amount: SELLER_ONBOARDING_FEE
    })
  } catch (error: any) {
    console.error("Create Seller Payment Order Error:", error)
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

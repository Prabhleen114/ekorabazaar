import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { razorpay } from '@/lib/razorpay'
import { PaymentType, PaymentStatus, OrderStatus, ProductStatus, SellerAccountStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { items } = body // { productId, quantity }[]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in checkout." }, { status: 400 })
    }

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return NextResponse.json({ error: "Invalid item quantity." }, { status: 400 })
      }
    }

    // Step 1: Validate inventory, product status, and seller status transactionally
    // We cannot trust frontend prices or seller IDs
    let totalAmount = 0
    let validOrderItems: any[] = []

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { seller: true }
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found.`)
        }

        if (product.status !== ProductStatus.PUBLISHED) {
          throw new Error(`Product ${product.title} is not available for purchase.`)
        }

        if (product.seller && product.seller.accountStatus !== SellerAccountStatus.ACTIVE) {
          throw new Error(`The seller for ${product.title} is currently inactive.`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.title}.`)
        }

        const effectivePrice = product.customerPrice ?? product.price
        const subtotal = effectivePrice * item.quantity
        totalAmount += subtotal

        validOrderItems.push({
          productId: product.id,
          productNameSnapshot: product.title,
          priceSnapshot: effectivePrice,
          quantity: item.quantity,
          subtotal: subtotal
        })
      }
    })

    // Create Razorpay Order
    let rzpOrderId = "mock_rzp_checkout_order_" + Date.now()

    if (razorpay) {
      const options = {
        amount: totalAmount, // in paise
        currency: "INR",
        receipt: `order_${session.userId?.substring(0,8)}_${Date.now()}`
      };
      
      const rzpOrder = await razorpay.orders.create(options);
      rzpOrderId = rzpOrder.id
    }

    // Create Internal Order, OrderItems, and Payment record atomically
    const [createdOrder, createdPayment] = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: session.userId!,
          total: totalAmount,
          subtotal: totalAmount,
          status: OrderStatus.PAYMENT_PENDING,
          razorpayOrderId: rzpOrderId,
          items: {
            create: validOrderItems
          }
        }
      })

      const payment = await tx.payment.create({
        data: {
          userId: session.userId!,
          orderId: order.id,
          amount: totalAmount,
          currency: 'INR',
          type: PaymentType.CUSTOMER_ORDER,
          status: PaymentStatus.PENDING,
          razorpayOrderId: rzpOrderId,
        }
      })

      return [order, payment]
    })

    return NextResponse.json({ 
      success: true, 
      orderId: createdOrder.id,
      paymentId: createdPayment.id,
      razorpayOrderId: rzpOrderId,
      amount: totalAmount
    })
  } catch (error: any) {
    console.error("Create Checkout Order Error:", error)
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Return standard error to client
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

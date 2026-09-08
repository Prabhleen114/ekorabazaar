import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { calculateItemPrice } from '@/lib/pricing'
import { razorpay } from '@/lib/razorpay'
import { PaymentType, PaymentStatus, OrderStatus, ProductStatus, SellerAccountStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { items, addressId } = body // { productId, quantity }[], optional addressId

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in checkout." }, { status: 400 })
    }

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return NextResponse.json({ error: "Invalid item quantity." }, { status: 400 })
      }
    }

    let addressSnapshot = null
    if (addressId) {
      const address = await prisma.address.findUnique({ where: { id: addressId } })
      if (!address || address.userId !== session.userId) {
        return NextResponse.json({ error: "Invalid delivery address." }, { status: 400 })
      }
      addressSnapshot = address // Capture immutable snapshot
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

        const effectivePrice = calculateItemPrice(product, item.quantity)
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

    const finalAmountPaise = Math.round(totalAmount)

    console.log("[DEBUG] Runtime RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID?.substring(0, 15) + "...");

    // Create Razorpay Order
    if (!razorpay) {
      throw new Error("Payment gateway is not configured.")
    }

    const options = {
      amount: finalAmountPaise, // strictly in integer paise
      currency: "INR",
      receipt: `order_${session.userId?.substring(0,8)}_${Date.now()}`
    };
    
    const rzpOrder = await razorpay.orders.create(options);
    const rzpOrderId = rzpOrder.id

    // Create Internal Order, OrderItems, and Payment record atomically
    const [createdOrder, createdPayment] = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: session.userId!,
          total: finalAmountPaise,
          subtotal: finalAmountPaise,
          status: OrderStatus.PAYMENT_PENDING,
          razorpayOrderId: rzpOrderId,
          addressId: addressId || null,
          addressSnapshot: addressSnapshot ? JSON.parse(JSON.stringify(addressSnapshot)) : null,
          items: {
            create: validOrderItems
          }
        }
      })

      const payment = await tx.payment.create({
        data: {
          userId: session.userId!,
          orderId: order.id,
          amount: finalAmountPaise,
          currency: 'INR',
          type: PaymentType.CUSTOMER_ORDER,
          status: PaymentStatus.PENDING,
          razorpayOrderId: rzpOrderId,
        }
      })

      // Cart clearing moved to successful payment verification (verify route)
      return [order, payment]
    })

    return NextResponse.json({ 
      success: true, 
      orderId: createdOrder.id,
      paymentId: createdPayment.id,
      razorpayOrderId: rzpOrderId,
      amount: finalAmountPaise
    })
  } catch (error: any) {
    console.error("Create Checkout Order Error:", error)
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Extract actual error from Razorpay SDK if available
    const errorMsg = error.error?.description || error.message || "Internal Server Error";
    
    // Return standard error to client
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

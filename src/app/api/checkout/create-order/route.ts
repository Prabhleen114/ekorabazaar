import { logPaymentAttempt, logApiError } from "@/lib/server-ci";
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { calculateItemPrice, TEMP_FLAT_SHIPPING_CHARGE } from '@/lib/pricing'
import { razorpay } from '@/lib/razorpay'
import { PaymentType, PaymentStatus, OrderStatus, ProductStatus, SellerAccountStatus } from '@prisma/client'
import catalogProducts from '@/lib/data/products.json'
import { validateBody, CreateOrderSchema } from '@/lib/validation'
import { normalizeCouponCode, validateCouponEligibility } from '@/lib/coupons'

export async function POST(req: Request) {
  const startTime = Date.now();
  let userId: string | null = null;
  try {
    try {
      const session = await requireAuth()
      userId = session.userId
    } catch (e) {
      // Guest checkout flow
    }

    const rawBody = await req.json()
    const validation = validateBody(CreateOrderSchema, rawBody)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { items, addressId, guestAddress, couponCode } = validation.data

    let addressSnapshot = null
    let customerPhone = ''
    let customerName = 'Guest Customer'

    if (addressId && userId) {
      const address = await prisma.address.findUnique({ where: { id: addressId } })
      if (!address || address.userId !== userId) {
        return NextResponse.json({ error: "Invalid delivery address." }, { status: 400 })
      }
      addressSnapshot = address // Capture immutable snapshot
    } else if (guestAddress) {
      addressSnapshot = { ...guestAddress, id: 'guest_' + Date.now() }
      customerPhone = guestAddress.phone
      customerName = guestAddress.name || guestAddress.fullName || 'Guest Customer'
    } else {
      return NextResponse.json({ error: "A delivery address is required." }, { status: 400 })
    }

    // Generate a guest userId if they are not logged in
    const finalUserId = userId || `guest_${Date.now()}`

    // Step 1: Validate inventory, product status, and seller status transactionally
    // We cannot trust frontend prices or seller IDs
    let totalAmount = 0
    let validOrderItems: any[] = []

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        let product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { seller: true }
        })

        if (!product) {
          const catalogItem = (catalogProducts as any[]).find(p => String(p.id) === String(item.productId));
          if (catalogItem && !catalogItem.isQuoteOnly && catalogItem.price > 0 && catalogItem.inStock !== false) {
            const officialUser = await tx.user.upsert({
              where: { email: 'official@ekorabazaar.in' },
              update: {},
              create: { email: 'official@ekorabazaar.in', role: 'SELLER' }
            });
            const officialSeller = await tx.seller.upsert({
              where: { id: 'EKO-OFFICIAL-01' },
              update: {},
              create: {
                id: 'EKO-OFFICIAL-01',
                userId: officialUser.id,
                brandName: 'Ekora Official Supplier',
                accountStatus: 'ACTIVE',
                applicationStatus: 'APPROVED'
              }
            });
            const rawPricePaise = Math.round((typeof catalogItem.price === 'number' ? catalogItem.price : parseFloat(catalogItem.price || '0')) * 100);
            product = await tx.product.upsert({
              where: { id: String(catalogItem.id) },
              update: {},
              create: {
                id: String(catalogItem.id),
                title: catalogItem.name || 'Untitled Product',
                price: rawPricePaise,
                customerPrice: rawPricePaise,
                stock: 500,
                status: ProductStatus.PUBLISHED,
                sellerId: officialSeller.id,
                source: 'EKORA_OFFICIAL',
                category: catalogItem.category || 'General Silicone Moulds',
                imageUrl: catalogItem.image || '/og-image.jpg',
                wholesaleTiers: (catalogItem.tiers || []).map((t: any) => ({
                  ...t,
                  price: Math.round((Number(t.price) || 0) * 100)
                }))
              },
              include: { seller: true }
            });
          }
        }

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

        // RESERVE STOCK NOW: Atomically decrement to prevent oversell race condition
        const reserveResult = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        })
        if (reserveResult.count === 0) {
          throw new Error(`Insufficient stock for ${product.title} (concurrent reservation).`)
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

    const shippingChargePaise = TEMP_FLAT_SHIPPING_CHARGE * 100
    const subtotalPaise = Math.round(totalAmount)

    // Validate and apply coupon if provided
    let appliedCoupon: any = null
    let discountPaise = 0

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const normalizedCode = normalizeCouponCode(couponCode)
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode }
      })

      if (!coupon) {
        return NextResponse.json({ error: `Coupon code "${normalizedCode}" is invalid.` }, { status: 400 })
      }

      let customerUsageCount = 0
      if (userId) {
        customerUsageCount = await prisma.couponUsage.count({
          where: { couponId: coupon.id, userId }
        })
      } else if (customerPhone) {
        customerUsageCount = await prisma.couponUsage.count({
          where: { couponId: coupon.id, customerPhone }
        })
      }

      const eligibility = validateCouponEligibility(coupon, {
        subtotalPaise,
        usageCountForCustomer: customerUsageCount
      })

      if (!eligibility.valid) {
        return NextResponse.json({ error: eligibility.error }, { status: 400 })
      }

      appliedCoupon = coupon
      discountPaise = eligibility.discountPaise
    }

    const finalAmountPaise = Math.max(0, Math.round(subtotalPaise - discountPaise + shippingChargePaise))

    // Razorpay key validated at import time via razorpay.ts

    // Create Razorpay Order
    if (!razorpay) {
      throw new Error("Payment gateway is not configured.")
    }

    const options = {
      amount: finalAmountPaise, // strictly in integer paise
      currency: "INR",
      receipt: `order_${finalUserId.substring(0,8)}_${Date.now()}`
    };
    
    const rzpOrder = await razorpay.orders.create(options);
    const rzpOrderId = rzpOrder.id

    // Create Internal Order, OrderItems, and Payment record atomically
    const [createdOrder, createdPayment] = await prisma.$transaction(async (tx) => {
      let actualUserId = finalUserId
      
      // If this is a guest, we need a user record for relations
      if (!userId) {
        const guestEmail = `guest_${Date.now()}@ekorabazaar.in`
        const guestUser = await tx.user.create({
          data: {
            email: guestEmail,
            name: customerName,
            phone: customerPhone,
            role: 'CUSTOMER',
            id: finalUserId
          }
        })
        actualUserId = guestUser.id
      }

      const discountedSubtotalPaise = Math.max(0, subtotalPaise - discountPaise)
      const taxPaise = Math.round(discountedSubtotalPaise - (discountedSubtotalPaise / 1.18));
      const order = await tx.order.create({
        data: {
          customerId: finalUserId,
          total: finalAmountPaise,
          subtotal: subtotalPaise,
          discount: discountPaise,
          couponCode: appliedCoupon?.code || null,
          couponId: appliedCoupon?.id || null,
          shipping: shippingChargePaise,
          tax: taxPaise,
          status: OrderStatus.PAYMENT_PENDING,
          razorpayOrderId: rzpOrderId,
          addressId: addressId && userId ? addressId : null,
          addressSnapshot: addressSnapshot ? JSON.parse(JSON.stringify(addressSnapshot)) : null,
          items: {
            create: validOrderItems
          }
        }
      })

      const payment = await tx.payment.create({
        data: {
          userId: actualUserId,
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

    const customer = userId ? await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true }
    }) : null

    // Customer Intelligence: log payment attempt
    logPaymentAttempt({
      orderId: createdOrder.id,
      amount: finalAmountPaise,
      customerId: finalUserId,
    }).catch(() => {});

    return NextResponse.json({ 
      success: true, 
      orderId: createdOrder.id,
      paymentId: createdPayment.id,
      razorpayOrderId: rzpOrderId,
      amount: finalAmountPaise,
      discount: discountPaise,
      couponCode: appliedCoupon?.code || null,
      customer: {
        name: (addressSnapshot as any)?.name || customer?.name || customerName,
        email: customer?.email || '',
        phone: (addressSnapshot as any)?.phone || customer?.phone || customerPhone
      }
    })
  } catch (error: any) {
    console.error("Create Checkout Order Error:", error)
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Extract actual error from Razorpay SDK if available
    const errorMsg = error.error?.description || error.message || "Internal Server Error";
    logApiError({
      route: "/api/checkout/create-order",
      status: 500,
      latencyMs: Date.now() - startTime,
      errorMessage: errorMsg,
      customerId: userId,
    }).catch(() => {});
    
    // Return standard error to client
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { calculateItemPrice, TEMP_FLAT_SHIPPING_CHARGE } from '@/lib/pricing';
import { razorpay, verifyRazorpaySignature } from '@/lib/razorpay';
import {
  PaymentType,
  PaymentStatus,
  OrderStatus,
  ProductStatus,
  SellerAccountStatus,
} from '@prisma/client';
import catalogProducts from '@/lib/data/products.json';
import { validateBody, CreateOrderSchema } from '@/lib/validation';
import { normalizeCouponCode, validateCouponEligibility } from '@/lib/coupons';
import { IS_CHECKOUT_PAUSED, CHECKOUT_PAUSED_MESSAGE } from '@/config/checkout-protection';
import { computePricingQuote, CartLineItem, CouponInput } from '@/lib/pricing/pricing-engine';
import { getActiveCheckoutTiers, getCheckoutConfig } from '@/lib/checkout-config';
import { logCheckoutEvent } from '@/lib/checkout-events';
import { logPaymentAttempt, logApiError, logPurchase, logPaymentFail } from '@/lib/server-ci';

// ---------------------------------------------------------------------------
// 1. POST /api/checkout/quote
// ---------------------------------------------------------------------------
export async function handleQuote(req: Request) {
  try {
    let userId: string | null = null;
    try {
      const session = await requireAuth();
      userId = session.userId;
    } catch {
      // Guest quote
    }

    const body = await req.json();
    const { items = [], couponCode, pointsRequested = 0, sessionId } = body;

    const tiers = await getActiveCheckoutTiers();
    const config = await getCheckoutConfig();

    // Resolve live prices from database to prevent client tampering
    const resolvedItems: CartLineItem[] = [];
    const productIds = (items as any[]).map((i) => String(i.productId || i.id));

    let dbProducts: any[] = [];
    if (productIds.length > 0) {
      try {
        dbProducts = await prisma.product.findMany({
          where: { id: { in: productIds } },
        });
      } catch (err) {
        console.warn('DB product lookup error during quote:', err);
      }
    }

    for (const item of items as any[]) {
      const pId = String(item.productId || item.id);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const isGift = Boolean(item.isGift);

      const product = dbProducts.find((p) => p.id === pId);

      if (product) {
        const livePriceINR = calculateItemPrice(product, qty);
        resolvedItems.push({
          productId: pId,
          title: product.title || product.name || 'Item',
          price: livePriceINR,
          quantity: qty,
          image: product.imageUrl || product.image,
          isGift,
          excludedFromTiers: Boolean(product.excludedFromTiers),
        });
      } else if (item.price !== undefined) {
        // Fallback for items with price passed
        resolvedItems.push({
          productId: pId,
          title: item.title || 'Item',
          price: Number(item.price),
          quantity: qty,
          image: item.image,
          isGift,
          excludedFromTiers: false,
        });
      }
    }

    // Resolve Coupon if provided
    let couponInput: CouponInput | null = null;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const norm = normalizeCouponCode(couponCode);
      try {
        const couponRow = await prisma.coupon.findUnique({
          where: { code: norm },
        });

        if (couponRow && couponRow.status === 'ACTIVE') {
          couponInput = {
            code: couponRow.code,
            discountType: couponRow.discountType,
            discountValue:
              couponRow.discountType === 'PERCENTAGE'
                ? couponRow.discountValue
                : couponRow.discountValue / 100, // convert paise to rupees
            maxDiscountAmount: couponRow.maxDiscountAmount ? couponRow.maxDiscountAmount / 100 : null,
            minOrderAmount: couponRow.minOrderAmount ? couponRow.minOrderAmount / 100 : 0,
          };
        }
      } catch (couponErr) {
        console.warn('Coupon lookup error during quote:', couponErr);
      }
    }

    // Resolve user points balance
    let userPointsBalance = 0;
    if (userId) {
      try {
        const ledgerRows = await (prisma as any).ekoraPointsLedger.findMany({
          where: {
            userId,
            status: 'available',
            remaining: { gt: 0 },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: { remaining: true },
        });
        userPointsBalance = (ledgerRows || []).reduce(
          (sum: number, r: any) => sum + (r.remaining || 0),
          0
        );
      } catch (pointsErr) {
        console.warn('Points balance lookup error:', pointsErr);
      }
    }

    // Compute Quote
    const quote = computePricingQuote({
      items: resolvedItems,
      tiers,
      config,
      coupon: couponInput,
      pointsRequested: Number(pointsRequested) || 0,
      userPointsBalance,
    });

    // Fire non-blocking tier_evaluated event
    logCheckoutEvent({
      sessionId,
      userId,
      event: 'tier_evaluated',
      payload: {
        eligibleSubtotal: quote.eligibleSubtotal,
        tierId: quote.tierId,
        gapToNext: quote.progress.next?.gap || 0,
        unlockedCount: quote.progress.unlocked.length,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Checkout Quote Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 2. GET /api/checkout/recommendations
// ---------------------------------------------------------------------------
export async function handleRecommendations(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cartIdsRaw = searchParams.get('cartProductIds') || '';
    const gap = parseFloat(searchParams.get('gap') || '0');
    const cartProductIds = cartIdsRaw ? cartIdsRaw.split(',').filter(Boolean) : [];

    // 1. Fetch active recommendation rules from DB if present
    let recConsequents: Array<{ productId: string; score: number }> = [];
    try {
      const activeState = await (prisma as any).recModelState.findUnique({
        where: { id: 1 },
      });

      if (activeState && cartProductIds.length > 0) {
        const rules = await (prisma as any).recRule.findMany({
          where: {
            modelVersion: activeState.activeVersion,
            antecedent: { hasSome: cartProductIds },
            NOT: { consequent: { in: cartProductIds } },
          },
          take: 20,
        });

        for (const rule of rules) {
          recConsequents.push({
            productId: rule.consequent,
            score: Number(rule.lift) * Number(rule.confidence),
          });
        }
      }
    } catch (e) {
      // Graceful fallback to catalog bestsellers
    }

    // 2. Load candidate products from Database
    const dbCandidates = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        supplierAvailable: true,
        stock: { gt: 0 },
        id: cartProductIds.length > 0 ? { notIn: cartProductIds } : undefined,
      },
      take: 40,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        customerPrice: true,
        imageUrl: true,
        category: true,
        wholesaleTiers: true,
        source: true,
      },
    });

    const candidateProducts: any[] = [];
    for (const p of dbCandidates) {
      const pId = String(p.id);
      const priceINR = calculateItemPrice(p, 1);
      if (priceINR <= 0) continue;

      let score = 1.0;
      const ruleMatch = recConsequents.find((r) => r.productId === pId);
      if (ruleMatch) {
        score += ruleMatch.score * 2.0;
      }

      let closesGap = false;
      if (gap > 0 && priceINR >= gap && priceINR <= gap + 500) {
        score *= 2.5;
        closesGap = true;
      } else if (gap > 0 && priceINR >= gap) {
        score *= 1.5;
        closesGap = true;
      }

      const originalPrice = p.customerPrice
        ? Math.round(p.customerPrice / 100)
        : Math.round(priceINR * 1.3);

      candidateProducts.push({
        id: pId,
        title: p.title || 'Product',
        price: priceINR,
        originalPrice,
        image: p.imageUrl || '/og-image.jpg',
        category: p.category || 'Supplies',
        score,
        closesGap,
        newGapAfter: Math.max(0, gap - priceINR),
      });
    }

    // Sort by score descending and take top 6
    candidateProducts.sort((a, b) => b.score - a.score);
    const topRecs = candidateProducts.slice(0, 6);

    return NextResponse.json({
      success: true,
      recommendations: topRecs,
    });
  } catch (error: any) {
    console.error('Error generating checkout recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load recommendations', recommendations: [] },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// 3. POST /api/checkout/create-order
// ---------------------------------------------------------------------------
export async function handleCreateOrder(req: Request) {
  // EMERGENCY CIRCUIT BREAKER: Block checkout while pricing pipeline is undergoing verification
  if (IS_CHECKOUT_PAUSED) {
    return NextResponse.json({ error: CHECKOUT_PAUSED_MESSAGE }, { status: 503 });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  try {
    try {
      const session = await requireAuth();
      userId = session.userId;
    } catch (e) {
      // Guest checkout flow
    }

    const rawBody = await req.json();
    const validation = validateBody(CreateOrderSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { items, addressId, guestAddress, couponCode } = validation.data;

    let addressSnapshot = null;
    let customerPhone = '';
    let customerName = 'Guest Customer';

    if (addressId && userId) {
      const address = await prisma.address.findUnique({ where: { id: addressId } });
      if (!address || address.userId !== userId) {
        return NextResponse.json({ error: 'Invalid delivery address.' }, { status: 400 });
      }
      addressSnapshot = address; // Capture immutable snapshot
    } else if (guestAddress) {
      addressSnapshot = { ...guestAddress, id: 'guest_' + Date.now() };
      customerPhone = guestAddress.phone;
      customerName = guestAddress.name || guestAddress.fullName || 'Guest Customer';
    } else {
      return NextResponse.json({ error: 'A delivery address is required.' }, { status: 400 });
    }

    // Generate a guest userId if they are not logged in
    const finalUserId = userId || `guest_${Date.now()}`;

    // Step 1: Validate inventory, product status, and seller status transactionally
    // We cannot trust frontend prices or seller IDs
    let totalAmount = 0;
    let validOrderItems: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        let product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { seller: true },
        });

        if (!product) {
          const catalogItem = (catalogProducts as any[]).find(
            (p) => String(p.id) === String(item.productId)
          );
          if (
            catalogItem &&
            !catalogItem.isQuoteOnly &&
            catalogItem.price > 0 &&
            catalogItem.inStock !== false
          ) {
            const officialUser = await tx.user.upsert({
              where: { email: 'official@ekorabazaar.in' },
              update: {},
              create: { email: 'official@ekorabazaar.in', role: 'SELLER' },
            });
            const officialSeller = await tx.seller.upsert({
              where: { id: 'EKO-OFFICIAL-01' },
              update: {},
              create: {
                id: 'EKO-OFFICIAL-01',
                userId: officialUser.id,
                brandName: 'Ekora Official Supplier',
                accountStatus: 'ACTIVE',
                applicationStatus: 'APPROVED',
              },
            });
            const rawPricePaise = Math.round(
              (typeof catalogItem.price === 'number'
                ? catalogItem.price
                : parseFloat(catalogItem.price || '0')) * 100
            );
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
                  price: Math.round((Number(t.price) || 0) * 100),
                })),
              },
              include: { seller: true },
            });
          }
        }

        if (!product) {
          throw new Error(`Product not found.`);
        }

        if (product.status !== ProductStatus.PUBLISHED) {
          throw new Error(`Product "${product.title}" is no longer available.`);
        }

        if (product.seller && product.seller.accountStatus !== SellerAccountStatus.ACTIVE) {
          throw new Error(`Seller for product "${product.title}" is currently inactive.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.title}". Only ${product.stock} available.`
          );
        }

        // STRICT PRICE RULE: Always resolve price from backend logic
        const unitPriceINR = calculateItemPrice(product, item.quantity);
        if (unitPriceINR <= 0) {
          throw new Error(`Product "${product.title}" is quotation only.`);
        }
        const unitPricePaise = unitPriceINR * 100;
        const itemSubtotalPaise = unitPricePaise * item.quantity;

        // Atomically decrement inventory to guarantee no oversell
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });

        totalAmount += itemSubtotalPaise;

        validOrderItems.push({
          productId: product.id,
          productNameSnapshot: product.title,
          priceSnapshot: unitPricePaise,
          quantity: item.quantity,
          subtotal: itemSubtotalPaise,
        });
      }
    });

    // Step 2: Validate Coupon if provided
    let appliedCoupon: any = null;
    let couponForQuote: CouponInput | null = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const normCode = normalizeCouponCode(couponCode);
      const coupon = await prisma.coupon.findUnique({ where: { code: normCode } });
      if (!coupon) {
        return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 400 });
      }

      const eligibility = validateCouponEligibility(coupon as any, {
        subtotalPaise: totalAmount,
      });

      if (!eligibility.valid) {
        return NextResponse.json({ error: eligibility.error }, { status: 400 });
      }

      appliedCoupon = coupon;
      couponForQuote = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue:
          coupon.discountType === 'PERCENTAGE'
            ? coupon.discountValue
            : coupon.discountValue / 100,
        maxDiscountAmount: coupon.maxDiscountAmount
          ? coupon.maxDiscountAmount / 100
          : null,
        minOrderAmount: coupon.minOrderAmount
          ? coupon.minOrderAmount / 100
          : 0,
      };
    }

    // Step 2.5: Evaluate checkout tiers and compute official quote
    const tiers = await getActiveCheckoutTiers();
    const checkoutConfig = await getCheckoutConfig();

    const itemsForQuote: CartLineItem[] = validOrderItems.map((vi) => ({
      productId: vi.productId,
      title: vi.productNameSnapshot,
      price: vi.priceSnapshot / 100, // INR
      quantity: vi.quantity,
    }));

    const pricingQuote = computePricingQuote({
      items: itemsForQuote,
      tiers,
      config: checkoutConfig,
      coupon: couponForQuote,
      pointsRequested: 0,
      userPointsBalance: 0,
    });

    // Translate quote into strict integer paise
    const finalAmountPaise = Math.round(pricingQuote.grandTotal * 100);
    const subtotalPaise = Math.round(pricingQuote.eligibleSubtotal * 100);
    const totalDiscountPaise = Math.round((pricingQuote.tierDiscount + pricingQuote.couponDiscount) * 100);
    const taxPaise = Math.round(pricingQuote.tax * 100);
    const shippingChargePaise = Math.round(pricingQuote.shipping * 100);

    // Create Razorpay Order
    if (!razorpay) {
      throw new Error('Payment gateway is not configured.');
    }

    const options = {
      amount: finalAmountPaise, // strictly in integer paise
      currency: 'INR',
      receipt: `order_${finalUserId.substring(0, 8)}_${Date.now()}`,
    };

    const rzpOrder = await razorpay.orders.create(options);
    const rzpOrderId = rzpOrder.id;

    // Create Internal Order, OrderItems, and Payment record atomically
    const [createdOrder, createdPayment] = await prisma.$transaction(async (tx) => {
      let actualUserId = finalUserId;

      // If this is a guest, we need a user record for relations
      if (!userId) {
        const guestEmail = `guest_${Date.now()}@ekorabazaar.in`;
        const guestUser = await tx.user.create({
          data: {
            email: guestEmail,
            name: customerName,
            phone: customerPhone,
            role: 'CUSTOMER',
            id: finalUserId,
          },
        });
        actualUserId = guestUser.id;
      }

      const order = await tx.order.create({
        data: {
          customerId: finalUserId,
          total: finalAmountPaise,
          subtotal: subtotalPaise,
          discount: totalDiscountPaise,
          couponCode: pricingQuote.couponCode || null,
          couponId: appliedCoupon?.id || null,
          eligibleSubtotal: pricingQuote.eligibleSubtotal,
          tierId: pricingQuote.tierId,
          tierDiscount: pricingQuote.tierDiscount,
          pointsRedeemed: pricingQuote.points.pointsRedeemed,
          pointsDiscount: pricingQuote.points.pointsDiscount,
          pricingSnapshot: JSON.parse(JSON.stringify(pricingQuote)),
          shipping: shippingChargePaise,
          tax: taxPaise,
          status: OrderStatus.PAYMENT_PENDING,
          razorpayOrderId: rzpOrderId,
          addressId: addressId && userId ? addressId : null,
          addressSnapshot: addressSnapshot ? JSON.parse(JSON.stringify(addressSnapshot)) : null,
          items: {
            create: validOrderItems,
          },
        },
      });

      // Record adjustment rows for tier discount and gift
      if (pricingQuote.tierDiscount > 0) {
        await (tx as any).orderAdjustment
          .create({
            data: {
              orderId: order.id,
              kind: 'tier_discount',
              tierId: pricingQuote.tierId,
              amount: pricingQuote.tierDiscount,
            },
          })
          .catch(() => {});
      }
      if (pricingQuote.gift.eligible && pricingQuote.gift.sku) {
        await (tx as any).orderAdjustment
          .create({
            data: {
              orderId: order.id,
              kind: 'gift',
              tierId: pricingQuote.tierId,
              giftSku: pricingQuote.gift.sku,
              amount: 0,
            },
          })
          .catch(() => {});
      }

      const payment = await tx.payment.create({
        data: {
          userId: actualUserId,
          orderId: order.id,
          amount: finalAmountPaise,
          currency: 'INR',
          type: PaymentType.CUSTOMER_ORDER,
          status: PaymentStatus.PENDING,
          razorpayOrderId: rzpOrderId,
        },
      });

      // Cart clearing moved to successful payment verification (verify route)
      return [order, payment];
    });

    const customer = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, phone: true },
        })
      : null;

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
      discount: totalDiscountPaise,
      couponCode: appliedCoupon?.code || null,
      customer: {
        name: (addressSnapshot as any)?.name || customer?.name || customerName,
        email: customer?.email || '',
        phone: (addressSnapshot as any)?.phone || customer?.phone || customerPhone,
      },
    });
  } catch (error: any) {
    console.error('Create Checkout Order Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract actual error from Razorpay SDK if available
    const errorMsg = error.error?.description || error.message || 'Internal Server Error';
    logApiError({
      route: '/api/checkout/create-order',
      status: 500,
      latencyMs: Date.now() - startTime,
      errorMessage: errorMsg,
      customerId: userId,
    }).catch(() => {});

    // Return standard error to client
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 4. POST /api/checkout/confirm-payment
// ---------------------------------------------------------------------------
export async function handleConfirmPayment(req: Request) {
  try {
    let userId: string | null = null;
    try {
      const session = await requireAuth();
      userId = session.userId;
    } catch {
      // Guest payment confirmation
    }

    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment parameters.' },
        { status: 400 }
      );
    }

    // 1. Signature Verification
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
    }

    // 2. Transactional Update & Inventory Protection
    const result = await prisma.$transaction(async (tx) => {
      // Find the payment and lock it
      const payment = await tx.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: { include: { items: true } } },
      });

      if (!payment || !payment.order) {
        throw new Error('Payment or Order record not found.');
      }

      if (userId && payment.userId !== userId && !payment.userId.startsWith('guest_')) {
        throw new Error('Unauthorized payment manipulation.');
      }

      if (payment.status === PaymentStatus.CAPTURED) {
        return { alreadyVerified: true, orderId: payment.orderId, userId: payment.userId };
      }

      // Optimistic lock: attempt to transition status from PENDING to CAPTURED
      const paymentUpdateResult = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.CAPTURED,
          razorpayPaymentId,
        },
      });

      if (paymentUpdateResult.count === 0) {
        // Another process (e.g., webhook) already verified this payment concurrently.
        return { alreadyVerified: true, orderId: payment.orderId, userId: payment.userId };
      }

      // Mark Order as PAID
      await tx.order.update({
        where: { id: payment.orderId! },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.CAPTURED,
        },
      });

      // Record coupon usage and increment usage count atomically upon verified payment
      if (payment.order.couponId) {
        try {
          const existingUsage = await tx.couponUsage.findUnique({
            where: { orderId: payment.orderId! },
          });
          if (!existingUsage) {
            const customer = await tx.user.findUnique({
              where: { id: payment.userId },
              select: { email: true, phone: true },
            });
            const addressSnapshot = payment.order.addressSnapshot as any;
            await tx.couponUsage.create({
              data: {
                couponId: payment.order.couponId,
                orderId: payment.orderId!,
                userId: payment.userId,
                customerEmail: customer?.email || addressSnapshot?.email || null,
                customerPhone: customer?.phone || addressSnapshot?.phone || null,
                discountApplied: payment.order.discount || 0,
              },
            });
            await tx.coupon.update({
              where: { id: payment.order.couponId },
              data: { usageCount: { increment: 1 } },
            });
          }
        } catch (couponErr) {
          console.error('Failed to record coupon usage in confirm-payment:', couponErr);
        }
      }

      // Clear the purchased items from the customer's cart now that payment is verified
      if (userId) {
        try {
          const cart = await tx.cart.findUnique({ where: { userId } });
          if (cart) {
            await tx.cartItem.deleteMany({
              where: {
                cartId: cart.id,
                productId: { in: payment.order.items.map((i) => i.productId) },
              },
            });
          }
        } catch (err) {
          console.error('Failed to clear cart items after payment verification', err);
        }
      }

      return { alreadyVerified: false, orderId: payment.orderId, userId: payment.userId };
    });

    // 3. Ensure Admin Notification Email is sent
    if (result.orderId) {
      try {
        const { ensureAdminNotification } = await import('@/lib/email');
        await ensureAdminNotification(result.orderId);
      } catch (emailErr) {
        console.error('Failed to dynamically import email lib:', emailErr);
      }

      // 4. Log purchase event into Customer Intelligence Layer
      try {
        logPurchase({
          orderId: result.orderId,
          amount: 0,
          itemCount: 1,
          customerId: userId || result.userId,
          source: 'website',
        }).catch(() => {});
        await prisma.event.create({
          data: {
            userId: userId || result.userId,
            sessionId: 'checkout_' + result.orderId,
            eventName: 'purchase',
            metadata: {
              orderId: result.orderId,
              razorpayOrderId,
              razorpayPaymentId,
            },
          },
        });
      } catch (eventErr) {
        // Non-blocking telemetry
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Checkout payment verified.',
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error('Verify Checkout Payment Error:', error);
    if (error.message === 'UNAUTHORIZED' || error.message === 'Unauthorized payment manipulation.') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logPaymentFail({
      errorCode: error.message || 'INTERNAL_ERROR',
      customerId: null,
    }).catch(() => {});
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 5. POST /api/checkout/callback
// ---------------------------------------------------------------------------
export async function handleCallback(req: Request) {
  try {
    const formData = await req.formData();
    const razorpayOrderId = formData.get('razorpay_order_id') as string;
    const razorpayPaymentId = formData.get('razorpay_payment_id') as string;
    const razorpaySignature = formData.get('razorpay_signature') as string;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.redirect(
        new URL('/checkout?error=Missing+payment+parameters', req.url),
        303
      );
    }

    // 1. Signature Verification
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return NextResponse.redirect(
        new URL('/checkout?error=Invalid+payment+signature', req.url),
        303
      );
    }

    // 2. Transactional Update & Inventory Protection
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: { include: { items: true } } },
      });

      if (!payment || !payment.order) {
        throw new Error('Payment or Order record not found.');
      }

      if (payment.status === PaymentStatus.CAPTURED) {
        return { alreadyVerified: true, orderId: payment.orderId, userId: payment.userId };
      }

      const paymentUpdateResult = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.CAPTURED,
          razorpayPaymentId,
        },
      });

      if (paymentUpdateResult.count === 0) {
        return { alreadyVerified: true, orderId: payment.orderId, userId: payment.userId };
      }

      await tx.order.update({
        where: { id: payment.orderId! },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.CAPTURED,
        },
      });

      // Clear the cart securely using the payment's userId
      try {
        const cart = await tx.cart.findUnique({ where: { userId: payment.userId } });
        if (cart) {
          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
              productId: { in: payment.order.items.map((i) => i.productId) },
            },
          });
        }
      } catch (err) {
        console.error('Failed to clear cart items after payment verification', err);
      }

      return { alreadyVerified: false, orderId: payment.orderId, userId: payment.userId };
    });

    // 3. Ensure Admin Notification Email is sent
    if (result.orderId && !result.alreadyVerified) {
      try {
        const { ensureAdminNotification } = await import('@/lib/email');
        await ensureAdminNotification(result.orderId);
      } catch (emailErr) {
        console.error('Failed to dynamically import email lib:', emailErr);
      }

      try {
        await prisma.event.create({
          data: {
            userId: result.userId,
            sessionId: 'checkout_callback_' + result.orderId,
            eventName: 'purchase',
            metadata: {
              orderId: result.orderId,
              razorpayOrderId,
              razorpayPaymentId,
            },
          },
        });
      } catch (eventErr) {}
    }

    // Success! Redirect to dedicated order confirmation page
    return NextResponse.redirect(
      new URL(`/checkout/success?orderId=${result.orderId}`, req.url),
      303
    );
  } catch (error: any) {
    console.error('Razorpay Callback Error:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=Payment+verification+failed', req.url),
      303
    );
  }
}

export const handleCheckoutCallback = handleCallback;

// ---------------------------------------------------------------------------
// 6. GET /api/checkout/order-summary
// ---------------------------------------------------------------------------
export async function handleGetOrderSummary(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const serializedOrder = {
      id: order.id,
      total: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      addressSnapshot: order.addressSnapshot as any,
      items: order.items.map((item) => ({
        id: item.id,
        productNameSnapshot: item.productNameSnapshot,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        subtotal: item.subtotal,
      })),
    };
    return NextResponse.json({ order: serializedOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}



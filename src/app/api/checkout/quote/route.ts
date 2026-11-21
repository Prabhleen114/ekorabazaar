import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { computePricingQuote, CartLineItem, CouponInput } from '@/lib/pricing/pricing-engine';
import { getActiveCheckoutTiers, getCheckoutConfig } from '@/lib/checkout-config';
import { calculateItemPrice } from '@/lib/pricing';
import catalogProducts from '@/lib/data/products.json';
import { normalizeCouponCode } from '@/lib/coupons';
import { logCheckoutEvent } from '@/lib/checkout-events';

export async function POST(req: Request) {
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

    // Resolve live prices from database or official catalog to prevent client tampering
    const resolvedItems: CartLineItem[] = [];
    const productIds = (items as any[]).map(i => String(i.productId || i.id));

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

      let product = dbProducts.find(p => p.id === pId);
      if (!product) {
        product = (catalogProducts as any[]).find(p => String(p.id) === pId);
      }

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
            discountValue: couponRow.discountType === 'PERCENTAGE' 
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
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          select: { remaining: true },
        });
        userPointsBalance = (ledgerRows || []).reduce((sum: number, r: any) => sum + (r.remaining || 0), 0);
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

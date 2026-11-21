import { CheckoutTierRecord, CheckoutRuntimeConfig, FALLBACK_TIERS, FALLBACK_CONFIG } from '@/lib/checkout-config';
import { TEMP_FLAT_SHIPPING_CHARGE } from '@/lib/pricing';

export interface CartLineItem {
  productId: string;
  title: string;
  price: number; // in Rupees
  quantity: number;
  image?: string;
  isGift?: boolean;
  excludedFromTiers?: boolean;
}

export interface CouponInput {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number; // percentage (e.g. 10) or fixed amount in Rupees
  maxDiscountAmount?: number | null; // in Rupees
  minOrderAmount?: number; // in Rupees
}

export interface PricingEngineInput {
  items: CartLineItem[];
  tiers?: CheckoutTierRecord[];
  config?: CheckoutRuntimeConfig;
  coupon?: CouponInput | null;
  pointsRequested?: number;
  userPointsBalance?: number;
  shippingCharge?: number;
}

export interface TierRewardProgress {
  eligibleSubtotal: number;
  unlocked: Array<{ min: number; reward: string; tierId: number; discountPercent: number; giftSku: string | null }>;
  next: {
    min: number;
    gap: number;
    reward: string;
    savingIfReached: number;
    discountPercent: number;
    giftSku: string | null;
    tierId: number;
  } | null;
  after: {
    min: number;
    gap: number;
    reward: string;
    discountPercent: number;
    giftSku: string | null;
    tierId: number;
  } | null;
}

export interface PricingQuote {
  eligibleSubtotal: number;
  tierId: number | null;
  tierDiscount: number;
  tierRewardDescription: string | null;
  
  couponCode: string | null;
  couponDiscount: number;
  couponApplied: boolean;
  couponRejectionReason?: string;
  
  gift: {
    eligible: boolean;
    sku: string | null;
    rewardTitle: string;
  };
  
  points: {
    pointsRequested: number;
    pointsRedeemed: number;
    pointsDiscount: number;
    availableBalance: number;
    remainingBalance: number;
    pointsEarned: number; // 1% cashback on merchandise paid
  };
  
  shipping: number;
  tax: number; // inclusive GST
  grandTotal: number;
  totalSavings: number;
  
  progress: TierRewardProgress;
  items: CartLineItem[];
}

export function roundHalfUp(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Pure Server Pricing Engine:
 * Computes deterministic quotes for cart, checkout, and order snapshots.
 */
export function computePricingQuote(input: PricingEngineInput): PricingQuote {
  const tiers = (input.tiers && input.tiers.length > 0 ? input.tiers : FALLBACK_TIERS)
    .filter(t => t.active)
    .sort((a, b) => a.minSubtotal - b.minSubtotal);

  const config = input.config || FALLBACK_CONFIG;
  const shippingCharge = input.shippingCharge !== undefined ? input.shippingCharge : TEMP_FLAT_SHIPPING_CHARGE;

  // 1. Calculate eligible subtotal (excluding gift lines and excluded products)
  let eligibleSubtotal = 0;
  const cleanItems: CartLineItem[] = [];

  for (const item of input.items || []) {
    if (item.isGift) continue; // gifts never count toward thresholds
    const itemSubtotal = roundHalfUp(item.price * item.quantity);
    cleanItems.push({
      ...item,
      price: roundHalfUp(item.price),
      quantity: Math.max(1, item.quantity),
    });

    if (!item.excludedFromTiers) {
      eligibleSubtotal += itemSubtotal;
    }
  }
  eligibleSubtotal = roundHalfUp(eligibleSubtotal);

  // 2. Determine qualifying milestone tier
  let activeTier: CheckoutTierRecord | null = null;
  const unlockedTiers: TierRewardProgress['unlocked'] = [];

  for (const tier of tiers) {
    if (eligibleSubtotal >= tier.minSubtotal) {
      activeTier = tier;
      const descParts: string[] = [];
      if (tier.discountPercent > 0) descParts.push(`${tier.discountPercent}% OFF`);
      if (tier.giftSku) descParts.push('FREE GIFT');
      unlockedTiers.push({
        min: tier.minSubtotal,
        reward: descParts.join(' + ') || 'Milestone Unlocked',
        tierId: tier.id,
        discountPercent: tier.discountPercent,
        giftSku: tier.giftSku,
      });
    }
  }

  let rawTierDiscount = 0;
  let tierDiscount = 0;
  if (activeTier && activeTier.discountPercent > 0) {
    rawTierDiscount = roundHalfUp(eligibleSubtotal * (activeTier.discountPercent / 100));
    tierDiscount = activeTier.maxDiscount !== null 
      ? Math.min(rawTierDiscount, activeTier.maxDiscount) 
      : rawTierDiscount;
    tierDiscount = roundHalfUp(tierDiscount);
  }

  // 3. Resolve Coupon vs Tier Stacking
  let couponDiscount = 0;
  let couponApplied = false;
  let couponCode: string | null = null;
  let couponRejectionReason: string | undefined = undefined;

  if (input.coupon && input.coupon.code) {
    couponCode = input.coupon.code.trim().toUpperCase();
    const minOrder = input.coupon.minOrderAmount || 0;

    if (eligibleSubtotal < minOrder) {
      couponRejectionReason = `Minimum order of ₹${minOrder} required for coupon ${couponCode}.`;
    } else {
      let rawCouponDisc = 0;
      if (input.coupon.discountType === 'PERCENTAGE') {
        rawCouponDisc = roundHalfUp(eligibleSubtotal * (input.coupon.discountValue / 100));
        if (input.coupon.maxDiscountAmount && input.coupon.maxDiscountAmount > 0) {
          rawCouponDisc = Math.min(rawCouponDisc, input.coupon.maxDiscountAmount);
        }
      } else {
        rawCouponDisc = input.coupon.discountValue;
      }
      rawCouponDisc = roundHalfUp(Math.min(rawCouponDisc, eligibleSubtotal));

      if (config.coupon_stacks_with_tier) {
        couponDiscount = rawCouponDisc;
        couponApplied = true;
      } else {
        // Non-stacking: customer gets whichever discount saves more
        if (rawCouponDisc > tierDiscount) {
          couponDiscount = rawCouponDisc;
          tierDiscount = 0; // coupon supersedes tier discount
          couponApplied = true;
        } else if (tierDiscount > 0) {
          couponDiscount = 0;
          couponApplied = false;
          couponRejectionReason = `Tier discount (₹${tierDiscount}) is greater than coupon ${couponCode} (₹${rawCouponDisc}). Applied tier discount.`;
        } else {
          couponDiscount = rawCouponDisc;
          couponApplied = true;
        }
      }
    }
  }

  // 4. Gift Eligibility
  const giftEligible = config.gift_enabled && !!activeTier?.giftSku;
  const giftSku = giftEligible ? activeTier!.giftSku : null;
  const giftRewardTitle = giftEligible ? 'Free Ekora Gift' : '';

  // 5. Points Redemption
  const availableBalance = Math.max(0, input.userPointsBalance || 0);
  const requested = Math.max(0, input.pointsRequested || 0);
  let pointsRedeemed = 0;
  let pointsDiscount = 0;

  const postDiscountsMerchandise = Math.max(0, eligibleSubtotal - tierDiscount - couponDiscount);
  const maxRedeemRupees = roundHalfUp(postDiscountsMerchandise * config.points_redeem_cap_pct);

  if (config.points_redeem_enabled && requested >= config.points_min_redeem && availableBalance >= config.points_min_redeem) {
    // 1 point = ₹1
    const allowablePoints = Math.min(
      requested,
      availableBalance,
      Math.floor(maxRedeemRupees),
      Math.floor(postDiscountsMerchandise)
    );
    pointsRedeemed = allowablePoints;
    pointsDiscount = roundHalfUp(allowablePoints);
  }

  // Points Earned: 1% cashback on merchandise paid
  const paidMerchandise = Math.max(0, eligibleSubtotal - tierDiscount - couponDiscount - pointsDiscount);
  const pointsEarned = config.points_earn_enabled ? Math.floor(paidMerchandise * config.points_earn_rate) : 0;

  // 6. Tax & Grand Total (18% inclusive GST on discounted merchandise total)
  const taxableTotal = Math.max(0, eligibleSubtotal - tierDiscount - couponDiscount - pointsDiscount);
  const tax = roundHalfUp(taxableTotal - taxableTotal / 1.18);
  const grandTotal = roundHalfUp(Math.max(0, taxableTotal + shippingCharge));
  const totalSavings = roundHalfUp(tierDiscount + couponDiscount + pointsDiscount);

  // 7. Progress towards next tiers
  let nextTier: TierRewardProgress['next'] = null;
  let afterTier: TierRewardProgress['after'] = null;

  const remainingTiers = tiers.filter(t => t.minSubtotal > eligibleSubtotal);
  if (remainingTiers.length > 0) {
    const tNext = remainingTiers[0];
    const gap = roundHalfUp(tNext.minSubtotal - eligibleSubtotal);
    const savingIfReached = tNext.discountPercent > 0
      ? roundHalfUp(
          tNext.maxDiscount !== null
            ? Math.min(tNext.minSubtotal * (tNext.discountPercent / 100), tNext.maxDiscount)
            : tNext.minSubtotal * (tNext.discountPercent / 100)
        )
      : 0;

    const parts: string[] = [];
    if (tNext.discountPercent > 0) parts.push(`${tNext.discountPercent}% OFF`);
    if (tNext.giftSku) parts.push('Free Gift');

    nextTier = {
      min: tNext.minSubtotal,
      gap,
      reward: parts.join(' + ') || 'Milestone Reward',
      savingIfReached,
      discountPercent: tNext.discountPercent,
      giftSku: tNext.giftSku,
      tierId: tNext.id,
    };

    if (remainingTiers.length > 1) {
      const tAfter = remainingTiers[1];
      const afterParts: string[] = [];
      if (tAfter.discountPercent > 0) afterParts.push(`${tAfter.discountPercent}% OFF`);
      if (tAfter.giftSku) afterParts.push('Free Gift');
      afterTier = {
        min: tAfter.minSubtotal,
        gap: roundHalfUp(tAfter.minSubtotal - eligibleSubtotal),
        reward: afterParts.join(' + ') || 'Milestone Reward',
        discountPercent: tAfter.discountPercent,
        giftSku: tAfter.giftSku,
        tierId: tAfter.id,
      };
    }
  }

  // Tier description
  let tierRewardDescription: string | null = null;
  if (activeTier) {
    const parts: string[] = [];
    if (tierDiscount > 0) parts.push(`₹${tierDiscount} discount (${activeTier.discountPercent}%)`);
    if (giftEligible) parts.push('Free Gift unlocked');
    tierRewardDescription = parts.join(' + ');
  }

  return {
    eligibleSubtotal,
    tierId: activeTier?.id || null,
    tierDiscount,
    tierRewardDescription,
    couponCode: couponApplied ? couponCode : null,
    couponDiscount,
    couponApplied,
    couponRejectionReason,
    gift: {
      eligible: giftEligible,
      sku: giftSku,
      rewardTitle: giftRewardTitle,
    },
    points: {
      pointsRequested: requested,
      pointsRedeemed,
      pointsDiscount,
      availableBalance,
      remainingBalance: availableBalance - pointsRedeemed,
      pointsEarned,
    },
    shipping: shippingCharge,
    tax,
    grandTotal,
    totalSavings,
    progress: {
      eligibleSubtotal,
      unlocked: unlockedTiers,
      next: nextTier,
      after: afterTier,
    },
    items: cleanItems,
  };
}

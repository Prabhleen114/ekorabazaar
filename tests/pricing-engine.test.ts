import { describe, it, expect } from 'vitest';
import { computePricingQuote, roundHalfUp } from '@/lib/pricing/pricing-engine';

describe('Pricing Engine - Tier Calculations & Boundaries', () => {
  it('applies no discount and unlocks no gift under ₹5,000', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 4999.99, quantity: 1 }],
    });

    expect(quote.eligibleSubtotal).toBe(4999.99);
    expect(quote.tierDiscount).toBe(0);
    expect(quote.gift.eligible).toBe(false);
    expect(quote.progress.next).not.toBeNull();
    expect(quote.progress.next?.min).toBe(5000);
    expect(quote.progress.next?.gap).toBe(0.01);
  });

  it('unlocks 5% discount and Free Gift at exactly ₹5,000', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 5000, quantity: 1 }],
    });

    expect(quote.eligibleSubtotal).toBe(5000);
    expect(quote.tierDiscount).toBe(250); // 5% of 5000
    expect(quote.gift.eligible).toBe(true);
    expect(quote.gift.sku).toBe('GIFT_A');
    expect(quote.progress.unlocked.length).toBe(1);
    expect(quote.progress.next?.min).toBe(10000);
    expect(quote.progress.next?.gap).toBe(5000);
  });

  it('unlocks 7% discount and Free Gift at ₹10,000', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 10000, quantity: 1 }],
    });

    expect(quote.eligibleSubtotal).toBe(10000);
    // 7% of 10000 = 700, but capped at 500
    expect(quote.tierDiscount).toBe(500);
    expect(quote.gift.eligible).toBe(true);
    expect(quote.gift.sku).toBe('GIFT_B');
    expect(quote.progress.next).toBeNull(); // top tier achieved
  });

  it('strictly caps tier discount at ₹500 even at higher order values', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 20000, quantity: 1 }],
    });

    expect(quote.eligibleSubtotal).toBe(20000);
    // 7% of 20000 = 1400, strictly capped at 500
    expect(quote.tierDiscount).toBe(500);
  });

  it('excludes gift lines and excluded_from_tiers items from eligible subtotal', () => {
    const quote = computePricingQuote({
      items: [
        { productId: 'p1', title: 'Item 1', price: 4000, quantity: 1 },
        { productId: 'gift', title: 'Free Gift', price: 0, quantity: 1, isGift: true },
        { productId: 'clearance', title: 'Clearance Item', price: 2000, quantity: 1, excludedFromTiers: true },
      ],
    });

    expect(quote.eligibleSubtotal).toBe(4000);
    expect(quote.tierDiscount).toBe(0);
    expect(quote.gift.eligible).toBe(false);
  });
});

describe('Pricing Engine - Coupon Stacking Policy', () => {
  it('prefers coupon if coupon saves more than tier discount (non-stacking)', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 5000, quantity: 1 }],
      coupon: {
        code: 'SAVE600',
        discountType: 'FIXED_AMOUNT',
        discountValue: 600,
      },
    });

    expect(quote.eligibleSubtotal).toBe(5000);
    // Tier discount would be 250, coupon is 600 -> coupon wins
    expect(quote.couponApplied).toBe(true);
    expect(quote.couponDiscount).toBe(600);
    expect(quote.tierDiscount).toBe(0);
    // Gift remains eligible because subtotal reached ₹5,000 milestone!
    expect(quote.gift.eligible).toBe(true);
  });

  it('prefers tier discount if tier saves more than coupon (non-stacking)', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 6000, quantity: 1 }],
      coupon: {
        code: 'SAVE100',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100,
      },
    });

    // 5% of 6000 = 300, coupon is 100 -> tier wins
    expect(quote.tierDiscount).toBe(300);
    expect(quote.couponApplied).toBe(false);
    expect(quote.couponDiscount).toBe(0);
  });

  it('stacks coupon with tier if coupon_stacks_with_tier config is true', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 5000, quantity: 1 }],
      config: {
        coupon_stacks_with_tier: true,
        points_earn_rate: 0.01,
        points_redeem_cap_pct: 0.25,
        points_min_redeem: 100,
        points_expiry_months: 6,
        points_release_days: 7,
        gift_requires_prepaid: true,
        tiers_enabled: true,
        progress_bar_enabled: true,
        recs_enabled: true,
        points_earn_enabled: true,
        points_redeem_enabled: true,
        gift_enabled: true,
      },
      coupon: {
        code: 'STACK100',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100,
      },
    });

    expect(quote.tierDiscount).toBe(250);
    expect(quote.couponApplied).toBe(true);
    expect(quote.couponDiscount).toBe(100);
    expect(quote.totalSavings).toBe(350);
  });
});

describe('Pricing Engine - Ekora Points Wallet', () => {
  it('earns 1% points on paid merchandise', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 5000, quantity: 1 }],
    });

    // Subtotal 5000 - Tier discount 250 = 4750 paid merchandise
    // 1% of 4750 = 47 points earned
    expect(quote.points.pointsEarned).toBe(47);
  });

  it('enforces 100 points minimum redemption', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 5000, quantity: 1 }],
      pointsRequested: 50,
      userPointsBalance: 200,
    });

    expect(quote.points.pointsRedeemed).toBe(0);
    expect(quote.points.pointsDiscount).toBe(0);
  });

  it('enforces 25% redemption cap on order value', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 1000, quantity: 1 }],
      pointsRequested: 500,
      userPointsBalance: 500,
    });

    // 25% of 1000 = 250 max redeemable
    expect(quote.points.pointsRedeemed).toBe(250);
    expect(quote.points.pointsDiscount).toBe(250);
    expect(quote.points.remainingBalance).toBe(250);
  });
});

describe('Pricing Engine - Tax & Grand Total Precision', () => {
  it('computes 18% inclusive GST and exact rupee total', () => {
    const quote = computePricingQuote({
      items: [{ productId: 'p1', title: 'Item 1', price: 1000, quantity: 1 }],
      shippingCharge: 90,
    });

    expect(quote.eligibleSubtotal).toBe(1000);
    expect(quote.shipping).toBe(90);
    expect(quote.grandTotal).toBe(1090);
    // Tax = 1000 - 1000/1.18 = 152.54
    expect(quote.tax).toBe(152.54);
  });
});

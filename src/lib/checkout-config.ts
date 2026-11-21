import prisma from '@/lib/db';

export interface CheckoutTierRecord {
  id: number;
  campaign: string;
  minSubtotal: number;
  discountPercent: number;
  maxDiscount: number | null;
  giftSku: string | null;
  active: boolean;
  validFrom: Date | null;
  validTo: Date | null;
}

export interface CheckoutRuntimeConfig {
  coupon_stacks_with_tier: boolean;
  points_earn_rate: number;
  points_redeem_cap_pct: number;
  points_min_redeem: number;
  points_expiry_months: number;
  points_release_days: number;
  gift_requires_prepaid: boolean;
  tiers_enabled: boolean;
  progress_bar_enabled: boolean;
  recs_enabled: boolean;
  points_earn_enabled: boolean;
  points_redeem_enabled: boolean;
  gift_enabled: boolean;
}

export const FALLBACK_TIERS: CheckoutTierRecord[] = [
  {
    id: 1,
    campaign: 'default',
    minSubtotal: 5000,
    discountPercent: 5,
    maxDiscount: 500,
    giftSku: 'GIFT_A',
    active: true,
    validFrom: null,
    validTo: null,
  },
  {
    id: 2,
    campaign: 'default',
    minSubtotal: 10000,
    discountPercent: 7,
    maxDiscount: 500,
    giftSku: 'GIFT_B',
    active: true,
    validFrom: null,
    validTo: null,
  },
];

export const FALLBACK_CONFIG: CheckoutRuntimeConfig = {
  coupon_stacks_with_tier: false,
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
};

let cachedTiers: CheckoutTierRecord[] | null = null;
let tiersCacheExpiry = 0;

let cachedConfig: CheckoutRuntimeConfig | null = null;
let configCacheExpiry = 0;

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function getActiveCheckoutTiers(): Promise<CheckoutTierRecord[]> {
  const now = Date.now();
  if (cachedTiers && now < tiersCacheExpiry) {
    return cachedTiers;
  }

  try {
    const rows = await (prisma as any).checkoutTier.findMany({
      where: { active: true },
      orderBy: { minSubtotal: 'asc' },
    });

    if (rows && rows.length > 0) {
      const mapped: CheckoutTierRecord[] = rows.map((r: any) => ({
        id: r.id,
        campaign: r.campaign,
        minSubtotal: Number(r.minSubtotal),
        discountPercent: Number(r.discountPercent),
        maxDiscount: r.maxDiscount !== null ? Number(r.maxDiscount) : null,
        giftSku: r.giftSku,
        active: r.active,
        validFrom: r.validFrom,
        validTo: r.validTo,
      }));
      cachedTiers = mapped;
      tiersCacheExpiry = now + CACHE_TTL_MS;
      return mapped;
    }
  } catch (err) {
    console.warn('Failed to load checkout tiers from DB, using fallback tiers:', err);
  }

  return FALLBACK_TIERS;
}

export async function getCheckoutConfig(): Promise<CheckoutRuntimeConfig> {
  const now = Date.now();
  if (cachedConfig && now < configCacheExpiry) {
    return cachedConfig;
  }

  try {
    const rows = await (prisma as any).checkoutConfig.findMany();
    if (rows && rows.length > 0) {
      const merged: any = { ...FALLBACK_CONFIG };
      for (const row of rows) {
        merged[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      }
      cachedConfig = merged as CheckoutRuntimeConfig;
      configCacheExpiry = now + CACHE_TTL_MS;
      return cachedConfig;
    }
  } catch (err) {
    console.warn('Failed to load checkout config from DB, using fallback config:', err);
  }

  return FALLBACK_CONFIG;
}

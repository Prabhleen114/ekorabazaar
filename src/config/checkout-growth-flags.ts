/**
 * Checkout Growth Feature Flags & Constants
 *
 * All growth levers are guarded behind these flags to ensure safe,
 * independently-controllable rollouts and instant kill-switch capabilities.
 */

export interface CheckoutFeatureFlags {
  tiersEnabled: boolean;
  progressBarEnabled: boolean;
  recsEnabled: boolean;
  pointsEarnEnabled: boolean;
  pointsRedeemEnabled: boolean;
  giftEnabled: boolean;
  couponStacksWithTier: boolean;
}

export const DEFAULT_FEATURE_FLAGS: CheckoutFeatureFlags = {
  tiersEnabled: process.env.NEXT_PUBLIC_TIERS_ENABLED !== 'false',
  progressBarEnabled: process.env.NEXT_PUBLIC_PROGRESS_BAR_ENABLED !== 'false',
  recsEnabled: process.env.NEXT_PUBLIC_RECS_ENABLED !== 'false',
  pointsEarnEnabled: process.env.NEXT_PUBLIC_POINTS_EARN_ENABLED !== 'false',
  pointsRedeemEnabled: process.env.NEXT_PUBLIC_POINTS_REDEEM_ENABLED !== 'false',
  giftEnabled: process.env.NEXT_PUBLIC_GIFT_ENABLED !== 'false',
  couponStacksWithTier: process.env.NEXT_PUBLIC_COUPON_STACKS_WITH_TIER === 'true',
};

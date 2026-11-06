/**
 * Price Rounding Module for B2B Wholesale Platform
 * 
 * Supports:
 * - Configurable price bands (nearest ₹5, ₹50, ₹100, ₹500)
 * - Strict 2% maximum price increase cap
 * - Safe minimum floor against rounding to ₹0
 * - Internal GST calculation for Option C (All-Inclusive Display with ITC Tax Breakdown)
 * - Bulk tier pricing with DISCOUNT % PRIORITIZED over rounding off, guaranteeing strict monotonicity
 */

export interface RoundingBand {
  min: number;
  max: number; // upper bound exclusive
  step: number;
}

export interface RoundingConfig {
  bands: RoundingBand[];
  maxIncreasePct: number;
  minPriceFloor?: number;
  defaultGstRate?: number;
}

export const DEFAULT_ROUNDING_CONFIG: RoundingConfig = {
  bands: [
    { min: 0, max: 500, step: 5 },
    { min: 500, max: 5000, step: 50 },
    { min: 5000, max: 50000, step: 100 },
    { min: 50000, max: Infinity, step: 500 },
  ],
  maxIncreasePct: 2.0,
  minPriceFloor: 1,
  defaultGstRate: 18,
};

/**
 * Returns the rounding step for a given price according to config bands.
 */
export function getRoundingStep(price: number, config: RoundingConfig = DEFAULT_ROUNDING_CONFIG): number {
  if (price <= 0) return 1;
  const band = config.bands.find(b => price >= b.min && price < b.max);
  return band ? band.step : 500;
}

/**
 * Rounds a single base price (in Rupees) according to the band rules:
 * - Under ₹500: nearest ₹5
 * - ₹500 to ₹5,000: nearest ₹50
 * - ₹5,000 to ₹50,000: nearest ₹100
 * - Above ₹50,000: nearest ₹500
 * - Never increase a price by more than 2% of original value (round down instead)
 * - Safeguard: non-zero prices never round to 0
 */
export function roundPrice(
  basePrice: number,
  config: RoundingConfig = DEFAULT_ROUNDING_CONFIG
): number {
  if (typeof basePrice !== 'number' || isNaN(basePrice) || basePrice <= 0) {
    return typeof basePrice === 'number' && !isNaN(basePrice) ? basePrice : 0;
  }

  const step = getRoundingStep(basePrice, config);
  let rounded = Math.round(basePrice / step) * step;

  // Check 2% increase cap (with 1e-9 epsilon for floating-point safety)
  if (rounded > basePrice) {
    const increasePct = ((rounded - basePrice) / basePrice) * 100;
    if (increasePct > config.maxIncreasePct + 1e-9) {
      rounded = Math.floor(basePrice / step) * step;
    }
  }

  // Safeguard against rounding down to 0 for small prices (e.g., ₹3 with step 5)
  if (rounded === 0 && basePrice > 0) {
    rounded = Math.max(config.minPriceFloor ?? 1, Math.round(basePrice));
  }

  return rounded;
}

/**
 * Calculates GST breakdown for Option C (All-Inclusive Display).
 * The customer pays the clean rounded price, while the invoice extracts
 * the compliant base taxable amount and 18% GST (CGST/SGST or IGST) for ITC claiming.
 * 
 * @param roundedPrice Gross inclusive price in rupees
 * @param gstRate GST percentage (default 18%)
 * @param quantity Item quantity (default 1)
 */
export function calculateGST(
  roundedPrice: number,
  gstRate: number = 18,
  quantity: number = 1
) {
  const lineTotal = roundedPrice * quantity;
  const taxableValue = +(lineTotal / (1 + gstRate / 100)).toFixed(2);
  const gstAmount = +(lineTotal - taxableValue).toFixed(2);
  const totalBeforeRoundOff = +(taxableValue + gstAmount).toFixed(2);
  const finalTotal = Math.round(totalBeforeRoundOff);
  const roundOff = +(finalTotal - totalBeforeRoundOff).toFixed(2);

  return {
    grossTotal: lineTotal,
    taxableValue,
    gstRate,
    gstAmount,
    totalBeforeRoundOff,
    roundOff,
    finalTotal,
  };
}

export interface TierValidationResult {
  tiers: any[];
  hasBreaks: boolean;
  breaks: Array<{
    tierIndex: number;
    prevPrice: number;
    thisPrice: number;
    targetDiscountPct: number;
    effectiveDiscountPct: number;
    reason: string;
  }>;
}

/**
 * Rounds bulk pricing slabs with DISCOUNT % PRIORITIZED over rounding off.
 * 
 * Rules:
 * 1. Base tier (minQty <= 1) matches roundedBasePrice.
 * 2. Each subsequent tier MUST give at least the target discount % of the rounded base price.
 * 3. Never round UP if doing so reduces the discount % below target or causes collision (>= prevTierPrice).
 * 4. Tiers are strictly decreasing per unit (Tier 1 > Tier 2 > Tier 3).
 * 
 * @param roundedBasePrice The rounded base price of the product
 * @param rawBasePrice The original unrounded base price (used to derive target % if missing)
 * @param tiers Array of tier objects with `price`, `minQty`, and optional `discount`/`discountPct`
 * @param config Rounding configuration
 */
export function roundTiersWithDiscountPriority(
  roundedBasePrice: number,
  rawBasePrice: number,
  tiers: any[],
  config: RoundingConfig = DEFAULT_ROUNDING_CONFIG
): TierValidationResult {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { tiers: [], hasBreaks: false, breaks: [] };
  }

  const breaks: TierValidationResult['breaks'] = [];
  let prevPrice = roundedBasePrice;

  const roundedTiers = tiers.map((tier, idx) => {
    const minQty = tier.minQty || tier.minQuantity || 1;

    // Base tier (minQty 1 or first index with 0% discount)
    if (minQty <= 1 && idx === 0) {
      prevPrice = roundedBasePrice;
      return {
        ...tier,
        price: roundedBasePrice,
        discountPct: 0,
      };
    }

    // 1. Determine the target discount percentage
    let targetDisc = 0;
    if (typeof tier.discountPct === 'number' && tier.discountPct > 0) {
      targetDisc = tier.discountPct;
    } else if (typeof tier.discount === 'number' && tier.discount > 0) {
      targetDisc = tier.discount;
    } else if (typeof tier.price === 'number' && rawBasePrice > 0) {
      targetDisc = Math.max(0, ((rawBasePrice - tier.price) / rawBasePrice) * 100);
    }

    // Default to at least a 3% step between tiers if no discount was configured
    if (targetDisc <= 0 && idx > 0) {
      targetDisc = Math.min(20, idx * 5);
    }

    // 2. Compute maximum allowed tier price ensuring buyer gets AT LEAST targetDisc%
    const maxTargetPrice = targetDisc > 0
      ? roundedBasePrice * (1 - targetDisc / 100)
      : prevPrice - 1;

    const step = getRoundingStep(maxTargetPrice, config);
    let candidate = Math.round(maxTargetPrice / step) * step;

    // RULE: % off is PRIORITIZED over rounding off!
    // Never round UP if it reduces the discount below target or makes it >= prevPrice
    if (candidate > maxTargetPrice || candidate >= prevPrice) {
      candidate = Math.floor(maxTargetPrice / step) * step;
    }

    // If step rounding still causes collision (candidate >= prevPrice),
    // step down by step if possible, otherwise by 1 to strictly maintain decrease:
    if (candidate >= prevPrice) {
      const stepDown = prevPrice > step ? step : 1;
      candidate = Math.max(config.minPriceFloor ?? 1, prevPrice - stepDown);
    }

    // Check if monotonicity broke (only possible on sub-₹5 products with too many tiers)
    const isBreak = candidate >= prevPrice;
    const effectiveDisc = roundedBasePrice > 0
      ? +(((roundedBasePrice - candidate) / roundedBasePrice) * 100).toFixed(1)
      : 0;

    if (isBreak) {
      breaks.push({
        tierIndex: idx,
        prevPrice,
        thisPrice: candidate,
        targetDiscountPct: +targetDisc.toFixed(1),
        effectiveDiscountPct: effectiveDisc,
        reason: `Tier ${idx + 1} (₹${candidate}) cannot be reduced below prior slab (₹${prevPrice}) without hitting zero`,
      });
    }

    prevPrice = candidate;

    return {
      ...tier,
      price: candidate,
      discountPct: effectiveDisc,
    };
  });

  return {
    tiers: roundedTiers,
    hasBreaks: breaks.length > 0,
    breaks,
  };
}

/**
 * Standard Centralized Currency Formatter for Indian Rupee (INR)
 * Formats both Rupees and Paise uniformly.
 */
export function formatINR(amountRupees: number, showDecimals: boolean = false): string {
  if (isNaN(amountRupees)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(amountRupees);
}

export function formatPaise(amountPaise: number, showDecimals: boolean = false): string {
  if (isNaN(amountPaise)) return "₹0";
  return formatINR(amountPaise / 100, showDecimals);
}

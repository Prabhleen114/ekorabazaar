// Temporary shipping fallback until Shiprocket KYC is approved.
// Amount in Indian Rupees (INR).
export const TEMP_FLAT_SHIPPING_CHARGE = 90;

/**
 * Normalizes a raw wholesale tier price to integer paise.
 * In the database and catalog, wholesale tiers may be authored/stored either in
 * Rupees (e.g. 240, 155, 140) or in Paise (e.g. 24000, 15500, 14000).
 *
 * A wholesale discount tier is always within reasonable proximity to the base unit price.
 * - If stored in paise, rawTierPrice is on the order of basePricePaise (ratio ~ 0.2 to 1.5).
 * - If stored in rupees, rawTierPrice is on the order of basePriceRupees (ratio ~ 0.2 to 1.5).
 * A 100x separation exists between rupee scale and paise scale.
 */
export function normalizeTierPriceToPaise(rawTierPrice: number, basePricePaise: number): number {
  if (!rawTierPrice || isNaN(rawTierPrice) || rawTierPrice <= 0) return 0;
  if (!basePricePaise || isNaN(basePricePaise) || basePricePaise <= 0) {
    return rawTierPrice >= 1000 ? Math.round(rawTierPrice) : Math.round(rawTierPrice * 100);
  }

  const basePriceRupees = basePricePaise / 100;
  // If rawTierPrice exceeds 2.5x basePriceRupees, it is unambiguously stored in paise scale.
  // Otherwise, it is in rupee scale and must be multiplied by 100 to yield paise.
  if (rawTierPrice > basePriceRupees * 2.5) {
    return Math.round(rawTierPrice);
  } else {
    return Math.round(rawTierPrice * 100);
  }
}

/**
 * Normalizes a raw wholesale tier price to rupees (INR).
 * Suitable for UI components, catalog display, and pricing tables.
 * Preserves exact decimals if fractional paise exist (e.g. 31080 paise -> 310.8 rupees).
 */
export function normalizeTierPriceToRupees(rawTierPrice: number, basePricePaise: number): number {
  const paise = normalizeTierPriceToPaise(rawTierPrice, basePricePaise);
  return paise % 100 === 0 ? paise / 100 : Number((paise / 100).toFixed(2));
}

export function calculateItemPrice(
  product: { price: number; customerPrice: number | null; wholesaleTiers: any },
  quantity: number = 1
): number {
  let basePrice = Number(product.price) || 0;
  if (product.customerPrice !== null && product.customerPrice !== undefined) {
    const cp = Number(product.customerPrice);
    if (!isNaN(cp) && cp > 0) {
      basePrice = cp;
    }
  }

  // If base price is invalid or <= 0, return 0 (quote-only or unpriced)
  if (basePrice <= 0 || isNaN(basePrice)) {
    return 0;
  }

  let effectivePrice = basePrice;

  if (product.wholesaleTiers && Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0) {
    // 1. Filter out invalid/zero tiers and normalize all tier prices to paise
    const validTiers = product.wholesaleTiers
      .filter((t: any) => t && Number(t.price) > 0)
      .map((t: any) => ({
        ...t,
        minQty: Number(t.minQty) || 1,
        maxQty: t.maxQty !== null && t.maxQty !== undefined ? Number(t.maxQty) : Infinity,
        pricePaise: normalizeTierPriceToPaise(Number(t.price), basePrice)
      }))
      .filter((t: any) => t.pricePaise > 0)
      .sort((a: any, b: any) => a.minQty - b.minQty);

    if (validTiers.length > 0) {
      // 2. Find matching tier for the requested quantity
      const directTier = validTiers.find((t: any) => {
        return quantity >= t.minQty && quantity <= t.maxQty;
      });

      if (directTier && directTier.pricePaise > 0) {
        effectivePrice = directTier.pricePaise;
      } else {
        // If quantity exceeds a capped tier because a higher zero tier was filtered out,
        // apply the highest valid volume tier that the quantity qualifies for.
        const qualifyingTiers = validTiers.filter((t: any) => quantity >= t.minQty);
        if (qualifyingTiers.length > 0) {
          const highestQualifyingTier = qualifyingTiers[qualifyingTiers.length - 1];
          if (highestQualifyingTier && highestQualifyingTier.pricePaise > 0) {
            effectivePrice = highestQualifyingTier.pricePaise;
          }
        }
      }
    }
  }

  return Math.max(0, Math.round(effectivePrice));
}

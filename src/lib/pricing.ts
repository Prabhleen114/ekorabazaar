// Temporary shipping fallback until Shiprocket KYC is approved.
// Amount in Indian Rupees (INR).
export const TEMP_FLAT_SHIPPING_CHARGE = 90;

/**
 * Normalizes any product representation (DB, catalog JSON, seller product)
 * into a single canonical base price in Indian Rupees (INR).
 *
 * Enforces the system-wide INR pricing convention:
 * - Scraper/Admin/Seller DB products (stored in Rupees, e.g. 49, 91, 20, 240, 358) -> returns 49, 91, 20, 240, 358
 * - Catalog/Official DB products (stored in Paise, e.g. 24000, 6000, 33500) -> returns 240, 60, 335
 * - Static JSON catalog products (stored in Rupees, e.g. 45, 195, 20) -> returns 45, 195, 20
 */
export function normalizeProductBasePriceToINR(product: any): number {
  if (!product) return 0;

  // If already flagged or normalized to INR, never convert again
  if (product._isINR || product.currency === "INR") {
    const val = Number(product.customerPrice ?? product.price ?? 0);
    return isNaN(val) || val <= 0 ? 0 : val;
  }

  let raw = 0;
  if (product.customerPrice !== null && product.customerPrice !== undefined && Number(product.customerPrice) > 0) {
    raw = Number(product.customerPrice);
  } else if (product.price !== null && product.price !== undefined && Number(product.price) > 0) {
    raw = Number(product.price);
  }

  if (isNaN(raw) || raw <= 0) return 0;

  // 1. Explicit paise flags
  if (product.isPaise || product.unit === "paise") {
    return raw / 100;
  }

  // 2. Cross-reference with wholesale tiers if present (deterministic ground truth)
  const rawTiers = product.wholesaleTiers || product.tiers;
  if (Array.isArray(rawTiers) && rawTiers.length > 0) {
    const firstTierPrice = Number(rawTiers[0]?.price ?? rawTiers[0]?.priceINR);
    if (!isNaN(firstTierPrice) && firstTierPrice > 0) {
      // If raw is 50x+ the first tier, raw was stored in paise scale (e.g. 65000 paise vs ₹650 tier, or 22500 paise vs ₹225 tier)
      if (raw >= firstTierPrice * 50) {
        return raw / 100;
      }
      // If raw matches the first tier within normal discount/margin range (<= 1.5x)
      if (raw <= firstTierPrice * 1.5) {
        // CATALOG and EKORA_OFFICIAL tables store paise (e.g. 28000 paise base and 28000 paise tier)
        if (product.source === "CATALOG" || product.source === "EKORA_OFFICIAL") {
          return raw / 100;
        }
        // SELLER, SCRAPER, ADMIN, and static catalog JSON store Rupees (e.g. 358 rupees base and 358 rupees tier)
        return raw;
      }
    }
  }

  // 3. Fallback source-specific defaults for products without tiers or with empty tiers:
  // - CATALOG & EKORA_OFFICIAL: DB tables store paise (e.g. 24000 = ₹240, 28000 = ₹280)
  if (product.source === "CATALOG") return raw / 100;
  if (product.source === "EKORA_OFFICIAL") return raw / 100;

  // - SELLER, SCRAPER, ADMIN, and static catalog JSON store Rupees (e.g. 358, 237, 49)
  return raw;
}

/**
 * Normalizes a raw wholesale tier price to Indian Rupees (INR).
 * Suitable for UI components, catalog display, and pricing tables.
 *
 * @param rawTierPrice The tier price authored (may be in rupees e.g. 140 or paise e.g. 14000)
 * @param basePriceINR The product base price in canonical INR (Rupees)
 */
export function normalizeTierPriceToINR(rawTierPrice: number, basePriceINR: number): number {
  if (!rawTierPrice || isNaN(rawTierPrice) || rawTierPrice <= 0) return 0;
  if (!basePriceINR || isNaN(basePriceINR) || basePriceINR <= 0) {
    return rawTierPrice >= 1000 ? rawTierPrice / 100 : rawTierPrice;
  }

  // If rawTierPrice > basePriceINR * 1.5, it was authored in paise scale (e.g. 14000 paise vs ₹240 base)
  if (rawTierPrice > basePriceINR * 1.5) {
    return rawTierPrice / 100;
  }
  // Otherwise, it was authored in rupee scale (e.g. 140 rupees vs ₹240 base)
  return rawTierPrice;
}

/**
 * Normalizes a raw wholesale tier price to integer paise.
 * Handles backward compatibility where base price may be passed in paise.
 */
export function normalizeTierPriceToPaise(rawTierPrice: number, basePricePaiseOrINR: number): number {
  if (!rawTierPrice || isNaN(rawTierPrice) || rawTierPrice <= 0) return 0;
  const basePriceINR = basePricePaiseOrINR >= 100 ? basePricePaiseOrINR / 100 : basePricePaiseOrINR;
  const inr = normalizeTierPriceToINR(rawTierPrice, basePriceINR);
  return Math.round(inr * 100);
}

/**
 * Normalizes a raw wholesale tier price to Indian Rupees (INR).
 * Backward compatibility alias for normalizeTierPriceToINR.
 */
export function normalizeTierPriceToRupees(rawTierPrice: number, basePricePaiseOrINR: number): number {
  const basePriceINR = basePricePaiseOrINR >= 100 ? basePricePaiseOrINR / 100 : basePricePaiseOrINR;
  const inr = normalizeTierPriceToINR(rawTierPrice, basePriceINR);
  return inr % 1 === 0 ? inr : Number(inr.toFixed(2));
}

/**
 * Central Price Calculator:
 * Returns the effective unit price in Indian Rupees (INR) for the given quantity.
 *
 * Adheres strictly to the P0 Architectural Directive:
 * - One consistent INR pricing convention across the platform
 * - Never divides an already-rupee amount by 100
 * - Handles bulk wholesale volume tier qualification
 */
export function calculateItemPrice(
  product: any,
  quantity: number = 1
): number {
  if (!product) return 0;

  const basePriceINR = normalizeProductBasePriceToINR(product);
  if (basePriceINR <= 0 || isNaN(basePriceINR)) {
    return 0;
  }

  let effectivePriceINR = basePriceINR;

  const rawTiers = product.wholesaleTiers || product.tiers;
  if (Array.isArray(rawTiers) && rawTiers.length > 0) {
    // 1. Filter out invalid/zero tiers and normalize all tier prices to INR (Rupees)
    const validTiers = rawTiers
      .filter((t: any) => t && Number(t.price) > 0)
      .map((t: any) => ({
        ...t,
        minQty: Number(t.minQty) || 1,
        maxQty: t.maxQty !== null && t.maxQty !== undefined ? Number(t.maxQty) : Infinity,
        priceINR: normalizeTierPriceToINR(Number(t.price), basePriceINR)
      }))
      .filter((t: any) => t.priceINR > 0)
      .sort((a: any, b: any) => a.minQty - b.minQty);

    if (validTiers.length > 0) {
      // 2. Find matching tier for the requested quantity
      const directTier = validTiers.find((t: any) => {
        return quantity >= t.minQty && quantity <= t.maxQty;
      });

      if (directTier && directTier.priceINR > 0) {
        effectivePriceINR = directTier.priceINR;
      } else {
        // If quantity exceeds a capped tier, apply the highest valid volume tier
        const qualifyingTiers = validTiers.filter((t: any) => quantity >= t.minQty);
        if (qualifyingTiers.length > 0) {
          const highestQualifyingTier = qualifyingTiers[qualifyingTiers.length - 1];
          if (highestQualifyingTier && highestQualifyingTier.priceINR > 0) {
            effectivePriceINR = highestQualifyingTier.priceINR;
          }
        }
      }
    }
  }

  // Preserve decimals if present (e.g. 55.20), but keep clean integer where applicable
  return Math.max(0, effectivePriceINR % 1 === 0 ? effectivePriceINR : Number(effectivePriceINR.toFixed(2)));
}

/**
 * Calculates item price in integer paise (strictly for Razorpay boundary and order snapshots).
 */
export function calculateItemPricePaise(product: any, quantity: number = 1): number {
  return Math.round(calculateItemPrice(product, quantity) * 100);
}

/**
 * Converts Indian Rupees (INR) to Integer Paise.
 * Used strictly at the Razorpay payment gateway boundary and DB order persistence.
 */
export function inrToPaise(rupees: number): number {
  if (isNaN(rupees) || rupees <= 0) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts Integer Paise to Indian Rupees (INR).
 */
export function paiseToINR(paise: number): number {
  if (isNaN(paise) || paise <= 0) return 0;
  return paise / 100;
}

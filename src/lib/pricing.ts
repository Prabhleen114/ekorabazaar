export function calculateItemPrice(
  product: { price: number; customerPrice: number | null; wholesaleTiers: any },
  quantity: number
): number {
  const basePrice = product.customerPrice ?? product.price;
  let effectivePrice = basePrice;

  if (product.wholesaleTiers && Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0) {
    // Sort tiers by minQty ascending for deterministic boundary evaluation
    const sortedTiers = [...product.wholesaleTiers].sort((a, b) => (a.minQty || 1) - (b.minQty || 1));

    const matchingTier = sortedTiers.find((t: any) => {
      const minQty = t.minQty || 1;
      return quantity >= minQty && (t.maxQty === null || t.maxQty === undefined || quantity <= t.maxQty);
    });

    if (matchingTier && matchingTier.price != null) {
      let tierPrice = Number(matchingTier.price);
      // Unit normalization safeguard: If basePrice is in paise (e.g. 4600) and tierPrice is in rupees (e.g. 43),
      // harmonize tierPrice to paise so currency unit remains consistent.
      if (basePrice >= 100 && tierPrice > 0 && tierPrice * 20 < basePrice) {
        tierPrice = Math.round(tierPrice * 100);
      }
      effectivePrice = tierPrice;
    }
    // Note: If quantity does not meet any tier's minQty, effectivePrice strictly remains basePrice.
  }

  return effectivePrice;
}

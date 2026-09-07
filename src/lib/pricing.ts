export function calculateItemPrice(product: { price: number, customerPrice: number | null, wholesaleTiers: any }, quantity: number): number {
  const basePrice = product.customerPrice ?? product.price;
  let effectivePrice = basePrice;

  if (product.wholesaleTiers && Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0) {
    // Tiers might not be sorted. The frontend uses .find() sequentially, so let's match its logic or sort.
    // The frontend finds the first tier that matches:
    const tier = product.wholesaleTiers.find((t: any) => {
      const minQty = t.minQty || 1;
      return quantity >= minQty && (t.maxQty === null || t.maxQty === undefined || quantity <= t.maxQty);
    });

    if (tier) {
      effectivePrice = tier.price != null ? tier.price : basePrice;
    } else {
      // Fallback to the first tier if no tier matches but tiers exist (matching PricingWidget fallback)
      const firstTier = product.wholesaleTiers[0];
      if (firstTier) {
        effectivePrice = firstTier.price != null ? firstTier.price : basePrice;
      }
    }
  }

  return effectivePrice;
}

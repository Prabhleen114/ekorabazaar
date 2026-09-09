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
      const tierPrice = Number(matchingTier.price);
      // All tier prices MUST be in paise (same unit as basePrice).
      // Seller form converts rupees→paise on submit.
      // Catalog JSON tiers are converted at ingestion in create-order route.
      effectivePrice = tierPrice;
    }
    // Note: If quantity does not meet any tier's minQty, effectivePrice strictly remains basePrice.
  }

  return effectivePrice;
}

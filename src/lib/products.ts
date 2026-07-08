export const mockProducts = [
  {
    id: "1",
    name: "Premium Soy Wax (C-3) - Flakes",
    category: "Waxes",
    description: "High-quality soy wax flakes optimized for container candles. Exceptional glass adhesion and smooth tops.",
    price: 139,
    bulkDiscountAvailable: true,
    maxDiscount: 7.19,
    image: "/images/soy-wax.jpg",
    tiers: [
      { minQty: 1, maxQty: 9, price: 139, discountPct: 0 },
      { minQty: 10, maxQty: 49, price: 135, discountPct: 2.88 },
      { minQty: 50, maxQty: null, price: 129, discountPct: 7.19 },
    ]
  },
  {
    id: "2",
    name: "Clear Epoxy Resin Art Grade (1:1 Ratio)",
    category: "Resins",
    description: "Crystal clear, high-gloss finish epoxy resin perfect for coasters, geode art, and jewelry.",
    price: 850,
    bulkDiscountAvailable: true,
    maxDiscount: 11.76,
    image: "/images/resin.jpg",
    tiers: [
      { minQty: 1, maxQty: 4, price: 850, discountPct: 0 },
      { minQty: 5, maxQty: 19, price: 790, discountPct: 7.06 },
      { minQty: 20, maxQty: null, price: 750, discountPct: 11.76 },
    ]
  },
  {
    id: "3",
    name: "Lavender Essential Oil (Therapeutic Grade)",
    category: "Fragrances",
    description: "Pure lavender essential oil. Perfect for soap making, candles, and cosmetics.",
    price: 450,
    bulkDiscountAvailable: false,
    maxDiscount: 0,
    image: "/images/lavender.jpg",
    tiers: [
      { minQty: 1, maxQty: null, price: 450, discountPct: 0 },
    ]
  }
];

export function getProductById(id: string) {
  return mockProducts.find(p => p.id === id) || null;
}

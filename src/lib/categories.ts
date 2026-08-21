export const CATEGORIES = {
  BASES_AND_WAXES: [
    { label: "Premium Bases & Waxes", id: "Premium Bases & Waxes" },
    { label: "Containers & Packaging", id: "Containers & Packaging" },
    { label: "Pigments & Colors", id: "Pigments & Colors" },
    { label: "Candle Making Accessories", id: "Candle Making Accessories" },
  ],
  SCENTS_AND_BOTANICALS: [
    { label: "Fragrance Oils", id: "Fragrance Oils" },
    { label: "Essential Oils", id: "Essential Oils" },
    { label: "Food Safe Flavour Oils", id: "Food Safe Flavour Oil" },
    { label: "Hydrosols", id: "Hydrosols" },
    { label: "Dried Botanicals", id: "DRY FLOWERS" },
  ],
  SILICONE_MOULDS: [
    { label: "Candle & Pillar Moulds", id: "Candle & Pillar Moulds" },
    { label: "Culinary & Fondant Moulds", id: "Culinary & Fondant Moulds" },
    { label: "Eco-Resin & Stone Moulds", id: "Eco-Resin & Stone Moulds" },
    { label: "Soap & Bar Moulds", id: "Soap & Bar Moulds" },
    { label: "General Silicone Moulds", id: "General Silicone Moulds" },
  ]
};

export const ALL_CATEGORIES = [
  ...CATEGORIES.BASES_AND_WAXES,
  ...CATEGORIES.SCENTS_AND_BOTANICALS,
  ...CATEGORIES.SILICONE_MOULDS,
  { label: "Containers & Jars", id: "PACKAGING & CONTAINERS" } // Kept for legacy compatibility if needed
];

// Helper to get category ID by matching string safely
export function getCategoryId(labelOrId: string): string {
  const match = ALL_CATEGORIES.find(c => c.label.toLowerCase() === labelOrId.toLowerCase() || c.id.toLowerCase() === labelOrId.toLowerCase());
  return match ? match.id : "General Silicone Moulds";
}

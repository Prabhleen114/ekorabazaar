import { DEPARTMENTS } from "./taxonomy";

export const CATEGORIES = {
  CASTING_MEDIUMS_AND_BASES: [
    { label: "Candle Waxes & Additives", id: "Candle Waxes & Additives" },
    { label: "Artisan Soap Bases", id: "Artisan Soap Bases" },
    { label: "Skincare & Body Bases", id: "Skincare & Body Bases" },
    { label: "Body & Facial Scrubs", id: "Body & Facial Scrubs" },
    { label: "Haircare & Wash Bases", id: "Haircare & Wash Bases" },
    { label: "Raw Butters & Carrier Oils", id: "Raw Butters & Carrier Oils" },
    { label: "Cosmetic Preservatives & Chemicals", id: "Cosmetic Preservatives & Chemicals" },
  ],
  SCENTS_AND_BOTANICALS: [
    { label: "Fragrance Oils", id: "Fragrance Oils" },
    { label: "Skin Safe Fragrances", id: "Skin Safe Fragrances" },
    { label: "Essential Oils", id: "Essential Oils" },
    { label: "Food-Grade Flavor Oils", id: "Food-Grade Flavor Oils" },
    { label: "Hydrosols & Floral Waters", id: "Hydrosols & Floral Waters" },
  ],
  COLOR_AND_PIGMENTS: [
    { label: "Micas & Pigments", id: "Micas & Pigments" },
  ],
  SILICONE_MOULDS: [
    { label: "Candle & Pillar Moulds", id: "Candle & Pillar Moulds" },
    { label: "Soap & Bar Moulds", id: "Soap & Bar Moulds" },
    { label: "Eco-Resin & Stone Moulds", id: "Eco-Resin & Stone Moulds" },
    { label: "Culinary & Fondant Moulds", id: "Culinary & Fondant Moulds" },
    { label: "General Silicone Moulds", id: "General Silicone Moulds" },
  ],
  VESSELS_AND_PACKAGING: [
    { label: "Candle Jars & Containers", id: "Candle Jars & Containers" },
    { label: "Attar & Perfume Bottles", id: "Attar & Perfume Bottles" },
    { label: "Diffuser Bottles & Accessories", id: "Diffuser Bottles & Accessories" },
    { label: "Cosmetic Jars & Bottles", id: "Cosmetic Jars & Bottles" },
    { label: "Metal Containers & Tins", id: "Metal Containers & Tins" },
    { label: "Packaging Boxes & Mailers", id: "Packaging Boxes & Mailers" },
    { label: "Lids, Caps & Closures", id: "Lids, Caps & Closures" },
    { label: "Gift Bags & Pouches", id: "Gift Bags & Pouches" },
    { label: "Stickers & Labels", id: "Stickers & Labels" },
  ],
  TOOLS_AND_EQUIPMENT: [
    { label: "Wick Systems & Hardware", id: "Wick Systems & Hardware" },
    { label: "Soap Making Tools", id: "Soap Making Tools" },
    { label: "Dried Botanicals & Additives", id: "Dried Botanicals & Additives" },
    { label: "Studio Equipment", id: "Studio Equipment" },
  ],
  // Legacy aliases
  BASES_AND_WAXES: [
    { label: "Premium Bases & Waxes", id: "Candle Waxes & Additives" },
    { label: "Containers & Packaging", id: "Candle Jars & Containers" },
    { label: "Pigments & Colors", id: "Micas & Pigments" },
    { label: "Candle Making Accessories", id: "Wick Systems & Hardware" },
  ]
};

export const ALL_CATEGORIES = [
  ...CATEGORIES.CASTING_MEDIUMS_AND_BASES,
  ...CATEGORIES.SCENTS_AND_BOTANICALS,
  ...CATEGORIES.COLOR_AND_PIGMENTS,
  ...CATEGORIES.SILICONE_MOULDS,
  ...CATEGORIES.VESSELS_AND_PACKAGING,
  ...CATEGORIES.TOOLS_AND_EQUIPMENT,
];

const CATEGORY_ALIASES: Record<string, string> = {
  "hydrosols": "Hydrosols & Floral Waters",
  "hydrosol": "Hydrosols & Floral Waters",
  "hydrosols & floral waters": "Hydrosols & Floral Waters",
  "floral waters": "Hydrosols & Floral Waters",
  "food safe flavour oil": "Food-Grade Flavor Oils",
  "food safe flavour oils": "Food-Grade Flavor Oils",
  "food-grade flavor oils": "Food-Grade Flavor Oils",
  "flavor oils": "Food-Grade Flavor Oils",
  "dry flowers": "Dried Botanicals & Additives",
  "dried botanicals": "Dried Botanicals & Additives",
  "dried botanicals & additives": "Dried Botanicals & Additives",
  "pigments & colors": "Micas & Pigments",
  "pigments and colors": "Micas & Pigments",
  "micas & pigments": "Micas & Pigments",
  "mica powder": "Micas & Pigments",
  "candle making accessories": "Wick Systems & Hardware",
  "containers & packaging": "Candle Jars & Containers",
  "packaging & containers": "Candle Jars & Containers",
  "containers & jars": "Candle Jars & Containers",
  "premium bases & waxes": "Candle Waxes & Additives",
  "bases & waxes": "Candle Waxes & Additives",
  "essential oil": "Essential Oils",
  "essential oils": "Essential Oils",
  "fragrance oil": "Fragrance Oils",
  "fragrance oils": "Fragrance Oils",
  "skin safe fragrance": "Skin Safe Fragrances",
  "skin safe fragrances": "Skin Safe Fragrances",
  "skin safe fragrance oil": "Skin Safe Fragrances",
  "skin safe fragrance oils": "Skin Safe Fragrances",
  "candle moulds": "Candle & Pillar Moulds",
  "candle & pillar moulds": "Candle & Pillar Moulds",
  "soap moulds": "Soap & Bar Moulds",
  "soap & bar moulds": "Soap & Bar Moulds",
  "resin moulds": "Eco-Resin & Stone Moulds",
  "eco-resin & stone moulds": "Eco-Resin & Stone Moulds",
  "fondant moulds": "Culinary & Fondant Moulds",
  "culinary & fondant moulds": "Culinary & Fondant Moulds",
  "scrubs": "Body & Facial Scrubs",
  "scrub": "Body & Facial Scrubs",
  "body & facial scrubs": "Body & Facial Scrubs",
  "facial scrubs": "Body & Facial Scrubs",
  "body scrubs": "Body & Facial Scrubs",
  "scrubs & exfoliators": "Body & Facial Scrubs",
  "liquid & cream base": "Body & Facial Scrubs",
};

export function normalizeCategoryName(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = raw.trim().toLowerCase();
  if (CATEGORY_ALIASES[cleaned]) return CATEGORY_ALIASES[cleaned];
  
  // Exact match search in ALL_CATEGORIES
  const match = ALL_CATEGORIES.find(c => 
    c.id.toLowerCase() === cleaned || 
    c.label.toLowerCase() === cleaned ||
    c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleaned
  );
  if (match) return match.id;

  return raw.trim();
}

// Helper to get category ID by matching string safely
export function getCategoryId(labelOrId: string): string {
  const normalized = normalizeCategoryName(labelOrId);
  const match = ALL_CATEGORIES.find(c => c.id.toLowerCase() === normalized.toLowerCase() || c.label.toLowerCase() === normalized.toLowerCase());
  return match ? match.id : "General Silicone Moulds";
}

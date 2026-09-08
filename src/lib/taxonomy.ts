export interface DepartmentConfig {
  name: string;
  slug: string;
  description: string;
  subcategories: string[];
}

export interface DisciplineConfig {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  icon: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
}

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    name: "Casting Mediums & Raw Bases",
    slug: "casting-mediums-raw-bases",
    description: "Waxes, soap bases, hair & skin formulation bases, carrier oils, and cosmetic preservatives.",
    subcategories: [
      "Candle Waxes & Additives",
      "Artisan Soap Bases",
      "Skincare & Body Bases",
      "Haircare & Wash Bases",
      "Raw Butters & Carrier Oils",
      "Cosmetic Preservatives & Chemicals",
    ],
  },
  {
    name: "Scent & Flavor Lab",
    slug: "scent-flavor-lab",
    description: "Concentrated fragrance blends, steam-distilled essential oils, food-grade flavors, and hydrosols.",
    subcategories: [
      "Fragrance Oils",
      "Essential Oils",
      "Food-Grade Flavor Oils",
      "Hydrosols & Floral Waters",
    ],
  },
  {
    name: "Color & Pigment Studio",
    slug: "color-pigment-studio",
    description: "High-grade pearlescent micas and cosmetic-safe pigments for wax, soap, resin, and stone.",
    subcategories: [
      "Micas & Pigments",
    ],
  },
  {
    name: "Precision Studio Moulds",
    slug: "precision-studio-moulds",
    description: "High-tear-strength platinum and tin cured silicone moulds for candles, soap, resin, and eco-stone.",
    subcategories: [
      "Candle & Pillar Moulds",
      "Soap & Bar Moulds",
      "Eco-Resin & Stone Moulds",
      "Culinary & Fondant Moulds",
      "General Silicone Moulds",
    ],
  },
  {
    name: "Vessels & Packaging Studio",
    slug: "vessels-packaging-studio",
    description: "Glass candle jars, attar bottles, diffusers, cosmetic tins, packaging boxes, and labels.",
    subcategories: [
      "Candle Jars & Containers",
      "Attar & Perfume Bottles",
      "Diffuser Bottles & Accessories",
      "Cosmetic Jars & Bottles",
      "Metal Containers & Tins",
      "Packaging Boxes & Mailers",
      "Lids, Caps & Closures",
      "Gift Bags & Pouches",
      "Stickers & Labels",
    ],
  },
  {
    name: "Tools & Studio Equipment",
    slug: "tools-studio-equipment",
    description: "Wick assemblies, soap cutters, thermal pots, and botanicals.",
    subcategories: [
      "Wick Systems & Hardware",
      "Soap Making Tools",
      "Dried Botanicals & Additives",
      "Studio Equipment",
    ],
  },
];

export const DISCIPLINE_HUBS: DisciplineConfig[] = [
  {
    id: "candle-studio",
    name: "The Candle Studio",
    shortName: "Candle Studio",
    tagline: "Waxes, Scents, Wicks, Jars & Pillar Moulds",
    icon: "🕯️",
    description: "Curated raw materials engineered for clean burns, superior hot throw, and aesthetic pillar casting.",
    accentColor: "#d97706",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    borderCol: "border-amber-200",
  },
  {
    id: "soap-atelier",
    name: "The Soap & Bath Atelier",
    shortName: "Soap Atelier",
    tagline: "Bases, Hair & Body Washes, Scents & Bar Moulds",
    icon: "🧼",
    description: "Professional melt & pour bases, shampoo bases, skin-safe aromas, botanicals, and precision bar moulds.",
    accentColor: "#059669",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800",
    borderCol: "border-emerald-200",
  },
  {
    id: "stone-studio",
    name: "The Eco-Stone & Concrete Studio",
    shortName: "Eco-Stone Studio",
    tagline: "Mineral Powders, Pigments, Trays & Planter Moulds",
    icon: "🏛️",
    description: "Heavy-gauge silicone moulds, natural mineral oxides, and architectural casting forms for Jesmonite and gypsum.",
    accentColor: "#57534e",
    badgeBg: "bg-stone-100",
    badgeText: "text-stone-800",
    borderCol: "border-stone-300",
  },
  {
    id: "resin-lab",
    name: "The Resin Art & Inclusion Lab",
    shortName: "Resin Lab",
    tagline: "Mirror-Finish Moulds, Micas, Inclusions & Forms",
    icon: "💎",
    description: "High-gloss tear-resistant silicone forms, pearlescent micas, and botanical inclusions designed for crystal clarity.",
    accentColor: "#7c3aed",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800",
    borderCol: "border-purple-200",
  },
];

export function getDepartmentForCategory(category?: string | null): string | undefined {
  if (!category) return undefined;
  for (const dept of DEPARTMENTS) {
    if (dept.subcategories.includes(category)) {
      return dept.name;
    }
  }
  return undefined;
}


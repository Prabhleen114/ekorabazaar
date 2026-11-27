import { ALL_CATEGORIES } from "@/lib/categories";

export interface WholesaleCategoryDefinition {
  slug: string;
  label: string;
  id: string;
  /** Additional category names whose products belong in this collection */
  includeCategories?: string[];
  /** Optional title/keyword filter tokens to curate intent-specific landing pages */
  titleMatchPatterns?: string[];
  /** Custom SEO title (used directly without overwriting, or trimmed cleanly for layout template) */
  seoTitle?: string;
  seoDescription?: string;
  h1?: string;
  heroIntro?: string;
  isVirtualIntent?: boolean;
  isFragranceRelated?: boolean;
}

export const FRAGRANCE_PRIORITY_SLUGS = [
  "perfume-fragrance-oils",
  "fragrance-oils",
  "essential-oils",
  "candle-fragrance-oils",
  "soap-making-fragrance-oils",
  "skin-safe-fragrances",
  "aromatherapy-oils",
  "hydrosols-floral-waters",
  "food-grade-flavor-oils",
  "attar-perfume-bottles",
  "diffuser-bottles-accessories",
] as const;

export const FRAGRANCE_INTENT_COLLECTIONS: WholesaleCategoryDefinition[] = [
  {
    slug: "perfume-fragrance-oils",
    label: "Perfume Fragrance Oils",
    id: "Perfume Fragrance Oils",
    includeCategories: ["Skin Safe Fragrances", "Fragrance Oils", "Essential Oils", "Attar & Perfume Bottles"],
    titleMatchPatterns: [
      "perfume",
      "edp",
      "edt",
      "attar",
      "oudh",
      "oud",
      "musk",
      "amber",
      "sandal",
      "rose",
      "jasmine",
      "mogra",
      "neroli",
      "skin",
      "ethanol",
      "dpg",
      "dipropylene",
    ],
    seoTitle: "Perfume Fragrance Oils Wholesale India | Attar & Fine Fragrance Oils",
    seoDescription:
      "Buy concentrated perfume fragrance oils, fine attar blends, perfumer's alcohol bases, and DPG solvents online in India. Trial vials & wholesale pack sizes with GST invoicing on Ekora Bazaar.",
    h1: "Perfume Fragrance Oils & Fine Blending Supplies in India",
    heroIntro:
      "Source concentrated perfume oils, skin-safe aroma blends, perfumer's alcohol carriers, and attar vials for Eau de Parfum (EDP), Eau de Toilette (EDT), and roll-on perfume production in India.",
    isVirtualIntent: true,
    isFragranceRelated: true,
  },
  {
    slug: "candle-fragrance-oils",
    label: "Candle Fragrance Oils",
    id: "Candle Fragrance Oils",
    includeCategories: ["Fragrance Oils", "Skin Safe Fragrances"],
    titleMatchPatterns: ["candle", "wax melt", "soy", "paraffin", "vanilla", "oudh", "coffee", "cinnamon", "lavender", "rose", "amber"],
    seoTitle: "Candle Fragrance Oils Wholesale India | Soy & Paraffin Wax Scents",
    seoDescription:
      "Shop high-flashpoint candle fragrance oils formulated for soy wax, coconut wax, paraffin candles, and wax melts in India. Trial sizes to bulk 1 Litre packs on Ekora Bazaar.",
    h1: "Candle Fragrance Oils Wholesale in India",
    heroIntro:
      "Browse concentrated fragrance oils built for strong cold and hot scent throw in soy wax, paraffin, beeswax, and wax melt formulations across India.",
    isVirtualIntent: true,
    isFragranceRelated: true,
  },
  {
    slug: "soap-making-fragrance-oils",
    label: "Soap Making Fragrance Oils",
    id: "Soap Making Fragrance Oils",
    includeCategories: ["Skin Safe Fragrances", "Fragrance Oils"],
    titleMatchPatterns: ["skin safe", "skin & candle safe", "cp stable", "soap", "cosmetic"],
    seoTitle: "Soap Making Fragrance Oils Wholesale India | Melt & Pour & CP Stable",
    seoDescription:
      "Buy skin-safe soap making fragrance oils and cold-process stable aroma blends online in India. Ideal for melt-and-pour soap bases, handmade bars, and bath products on Ekora Bazaar.",
    h1: "Soap Making Fragrance Oils Wholesale in India",
    heroIntro:
      "Discover skin-safe and cold-process stable fragrance oils selected for melt-and-pour glycerin soaps, artisan cold-process bars, body washes, and bath scrubs.",
    isVirtualIntent: true,
    isFragranceRelated: true,
  },
  {
    slug: "aromatherapy-oils",
    label: "Aromatherapy Oils",
    id: "Aromatherapy Oils",
    includeCategories: ["Essential Oils", "Hydrosols & Floral Waters"],
    titleMatchPatterns: ["aromatherapy", "essential oil", "lavender", "eucalyptus", "peppermint", "tea tree", "frankincense", "vetiver", "chamomile", "rosemary", "bergamot"],
    seoTitle: "Aromatherapy Essential Oils Wholesale India | Diffuser & Wellness Oils",
    seoDescription:
      "Source concentrated pure essential oils and floral distillates for aromatherapy diffusers, spa blends, wellness brands, and natural personal care across India.",
    h1: "Aromatherapy Oils & Botanical Extracts in India",
    heroIntro:
      "Explore steam-distilled and cold-pressed botanical essential oils curated for diffusers, massage carrier blends, aromatherapy candles, and natural wellness studios.",
    isVirtualIntent: true,
    isFragranceRelated: true,
  },
];

export const CORE_CATEGORY_SEO_OVERRIDES: Record<string, Partial<WholesaleCategoryDefinition>> = {
  "fragrance-oils": {
    seoTitle: "Buy Fragrance Oils Online in India | Wholesale Candles, Soaps & Perfumes",
    seoDescription:
      "Shop wholesale fragrance oils in India for candles, wax melts, reed diffusers, soaps, and DIY home fragrance. Transparent INR pack pricing, MOQ from 1 unit, and GST invoicing.",
    h1: "Wholesale Fragrance Oils in India — Candles, Soaps & Diffusers",
    heroIntro:
      "Source concentrated fragrance oils in trial sizes (15ml–100ml) and bulk studio packs (500ml–1 Litre+) from verified Indian suppliers with transparent INR pricing and GST invoices.",
    isFragranceRelated: true,
  },
  "skin-safe-fragrances": {
    seoTitle: "Skin-Safe Fragrance Oils India | Soap, Lotion & Perfume Grade Scents",
    seoDescription:
      "Buy skin-safe fragrance oils and CP-stable blends for handmade soaps, lotions, body butters, roll-on perfumes, and bath products in India on Ekora Bazaar.",
    h1: "Skin-Safe Fragrance Oils for Soaps, Cosmetics & Perfumes",
    heroIntro:
      "Browse skin-safe and cold-process stable fragrance compounds formulated for rinse-off soaps, bath care, leave-on emulsions, and fine perfume blending.",
    isFragranceRelated: true,
  },
  "essential-oils": {
    seoTitle: "Buy Essential Oils Wholesale in India | 100% Pure Botanical Distillates",
    seoDescription:
      "Wholesale pure essential oils in India including lavender, tea tree, peppermint, eucalyptus, sandalwood, neroli, and citrus oils for aromatherapy, soap, and cosmetics.",
    h1: "Pure Essential Oils Wholesale in India",
    heroIntro:
      "Source botanical essential oils in India across herbal, floral, citrus, resin, and woody scent profiles for aromatherapy, skincare, soap making, and perfumery.",
    isFragranceRelated: true,
  },
  "hydrosols-floral-waters": {
    seoTitle: "Floral Hydrosols & Distilled Waters Wholesale India | Cosmetic Grade",
    seoDescription:
      "Shop bulk steam-distilled hydrosols and floral waters in India — rose, lavender, neroli, geranium, peppermint, tea tree, and rosemary waters for skincare formulations.",
    isFragranceRelated: true,
  },
  "food-grade-flavor-oils": {
    seoTitle: "Food-Grade Flavor Oils Wholesale India | Lip Balm & Confectionery Flavors",
    seoDescription:
      "Buy food-grade flavor oils in India for DIY lip balms, lip glosses, candy, baking, and confectionery applications on Ekora Bazaar.",
    isFragranceRelated: true,
  },
  "attar-perfume-bottles": {
    seoTitle: "Attar & Glass Perfume Bottles Wholesale India | Roll-Ons & Atomizers",
    seoDescription:
      "Source wholesale glass perfume bottles, roll-on attar vials, EDP fine-mist atomizers, and perfumery carrier bases across India on Ekora Bazaar.",
    isFragranceRelated: true,
  },
  "diffuser-bottles-accessories": {
    seoTitle: "Reed Diffuser Bottles & Fibre Sticks Wholesale India | Ekora Bazaar",
    seoDescription:
      "Buy refillable car and room diffuser bottles, glass reed decanters, and high-absorbency fibre diffuser sticks in bulk on Ekora Bazaar.",
    isFragranceRelated: true,
  },
};

/**
 * Extra categories actively used by published products in PostgreSQL / taxonomy.ts
 * that were omitted from ALL_CATEGORIES, causing 404 product breadcrumbs.
 */
export const EXTENDED_TAXONOMY_CATEGORIES: WholesaleCategoryDefinition[] = [
  { slug: "festive-holiday-molds", label: "Festive & Holiday Molds", id: "Festive & Holiday Molds" },
  { slug: "candle-soap-making", label: "Candle & Soap Making", id: "Candle & Soap Making" },
  { slug: "resin-concrete-craft", label: "Resin & Concrete Craft", id: "Resin & Concrete Craft" },
  { slug: "storage-trays", label: "Storage & Trays", id: "Storage & Trays" },
  { slug: "silicone-baking-molds", label: "Silicone & Baking Molds", id: "Silicone & Baking Molds" },
  { slug: "packaging-containers", label: "Packaging & Containers", id: "Packaging & Containers" },
  { slug: "cake-chocolate-decorating", label: "Cake & Chocolate Decorating", id: "Cake & Chocolate Decorating" },
];

export function slugifyCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getAllWholesaleDefinitions(): WholesaleCategoryDefinition[] {
  const core: WholesaleCategoryDefinition[] = ALL_CATEGORIES.map((c) => {
    const slug = slugifyCategory(c.label);
    const override = CORE_CATEGORY_SEO_OVERRIDES[slug] || {};
    return {
      slug,
      label: c.label,
      id: c.id,
      ...override,
    };
  });

  const existingSlugs = new Set(core.map((c) => c.slug));
  const merged = [...core];

  for (const intent of FRAGRANCE_INTENT_COLLECTIONS) {
    if (!existingSlugs.has(intent.slug)) {
      existingSlugs.add(intent.slug);
      merged.push(intent);
    }
  }

  for (const ext of EXTENDED_TAXONOMY_CATEGORIES) {
    if (!existingSlugs.has(ext.slug)) {
      existingSlugs.add(ext.slug);
      merged.push(ext);
    }
  }

  return merged;
}

export function resolveWholesaleCategoryBySlug(slug: string): WholesaleCategoryDefinition | undefined {
  const norm = slugifyCategory(slug);
  return getAllWholesaleDefinitions().find(
    (item) => item.slug === norm || slugifyCategory(item.id) === norm
  );
}

export function resolveCategoryBreadcrumbSlug(categoryName: string | null | undefined): string | null {
  if (!categoryName) return null;
  const norm = slugifyCategory(categoryName);
  const found = resolveWholesaleCategoryBySlug(norm);
  return found ? found.slug : norm;
}

export const FRAGRANCE_RELATED_CROSS_LINKS = [
  { label: "Perfume Fragrance Oils", href: "/wholesale/perfume-fragrance-oils" },
  { label: "Fragrance Oils", href: "/wholesale/fragrance-oils" },
  { label: "Essential Oils", href: "/wholesale/essential-oils" },
  { label: "Candle Fragrance Oils", href: "/wholesale/candle-fragrance-oils" },
  { label: "Soap Making Fragrance Oils", href: "/wholesale/soap-making-fragrance-oils" },
  { label: "Skin Safe Fragrances", href: "/wholesale/skin-safe-fragrances" },
  { label: "Aromatherapy Oils", href: "/wholesale/aromatherapy-oils" },
  { label: "Hydrosols & Floral Waters", href: "/wholesale/hydrosols-floral-waters" },
  { label: "Attar & Perfume Bottles", href: "/wholesale/attar-perfume-bottles" },
  { label: "Fragrance Load Calculator", href: "/tools/fragrance-load-calculator" },
];

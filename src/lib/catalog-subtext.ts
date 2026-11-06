/**
 * Dynamic Product Application Subtext Mapper
 * 
 * Replaces hardcoded placeholder subtitles with accurate, domain-specific
 * formulation and craft application descriptions based on product category/department.
 */

export const CATEGORY_APPLICATION_SUBTEXT: Record<string, string> = {
  // 1. Casting Mediums & Raw Bases
  "Candle Waxes & Additives": "Formulated for clean burns, superior scent throw & smooth tops in candles & wax melts",
  "Artisan Soap Bases": "High-clarity, SLS/paraben-free bases for cold process, melt & pour & specialty soaps",
  "Skincare & Body Bases": "Cosmetic-grade neutral emulsion bases for lotions, body creams & salon care",
  "Raw Butters & Carrier Oils": "Cold-pressed plant butters & nourishing carrier oils for cosmetic compounding",
  "Cosmetic Preservatives & Chemicals": "Lab-grade emulsifiers, active surfactants & broad-spectrum cosmetic stabilizers",
  "Body & Facial Scrubs": "Exfoliating botanical bases & mineral salts for professional spa treatments",
  "Haircare & Wash Bases": "Sulphate-free surfactant blends for artisanal shampoos, cleansers & body washes",
  "Candle & Soap Making": "Commercial-grade raw materials for studio candle casting & artisan soap batches",

  // 2. Precision Moulds
  "Candle & Pillar Moulds": "High-tear-strength platinum silicone for pillar candles, taper sticks & sculptural wax",
  "Soap & Bar Moulds": "Flexible food/cosmetic-grade silicone for precision bar soaps & solid shampoos",
  "Eco-Resin & Stone Moulds": "Heavy-duty silicone engineered for Jesmonite, gypsum, acrylic composite & concrete casting",
  "Culinary & Fondant Moulds": "Heat-resistant, food-grade silicone for confections, chocolates & artisanal baking",
  "Silicone & Baking Molds": "Flexible food-grade silicone molds for artisanal baking, confectionery & studio crafts",
  "Festive & Holiday Molds": "Themed silicone molds for seasonal candles, festive soaps & celebratory gifting",
  "General Silicone Moulds": "High-durability studio silicone mould for multi-medium craft casting & prototyping",
  "Resin & Concrete Craft": "Specialized molds & inclusions for architectural eco-stone, gypsum & crystal resin art",
  "Cake & Chocolate Decorating": "Food-safe flexible silicone tools for confectioners, chocolatiers & cake artists",

  // 3. Scent & Flavor Lab
  "Fragrance Oils": "Concentrated IFRA-compliant aroma oils for luxury candle making, diffusers, soaps & mists",
  "Skin Safe Fragrances": "Gentle, IFRA-51 certified fine fragrance compounds safe for leave-on skincare & perfumes",
  "Essential Oils": "100% steam-distilled pure botanical extracts for aromatherapy & holistic personal care",
  "Food-Grade Flavor Oils": "Lip-safe & culinary-grade flavorings for lip balms, tints & confectionery craft",
  "Hydrosols & Floral Waters": "Steam-distilled aromatic floral distillates for facial mists, toners & formulation bases",

  // 4. Color & Pigment Studio
  "Micas & Pigments": "Ultra-fine cosmetic-grade mineral micas for epoxy resin, bath bombs, soaps & wax melts",

  // 5. Vessels & Packaging Studio
  "Candle Jars & Containers": "Thermal shock-resistant glass vessels for poured container candles & home fragrance",
  "Attar & Perfume Bottles": "Precision flint glass, roll-on vials & luxury containers for fine fragrances",
  "Diffuser Bottles & Accessories": "Heavy-base glass decanters and high-porosity reed wicks for ambient home scenting",
  "Cosmetic Jars & Bottles": "Apothecary amber & frosted cosmetic containers with airtight closures",
  "Metal Containers & Tins": "Seamless aluminium tins with slip-lids for travel candles, solid salves & balms",
  "Packaging Boxes & Mailers": "Heavy-duty corrugated mailers & presentation packaging for studio transit & retail display",
  "Lids, Caps & Closures": "Precision-fit metal, wooden & bamboo closures for candle vessels & cosmetic containers",
  "Gift Bags & Pouches": "Premium studio pouches for finished candles, soaps, perfume bottles & curated sets",
  "Packaging & Containers": "Industrial & studio packaging materials for safe transit & retail presentation",
  "Storage & Trays": "Heavy-duty craft storage containers, organizers & workshop curing trays",

  // 6. Tools & Studio Equipment
  "Wick Systems & Hardware": "Calibrated cotton & natural wood wicks with sustainer tabs for even container burns",
  "Soap Making Tools": "Stainless steel bevelers, wire cutters & studio moulds for precision soap shaping",
  "Dried Botanicals & Additives": "Natural dried flowers, petals & mineral additives for candle topping & bath salts",
  "Studio Equipment": "Formulation thermometers, melting pots & digital tools for craft workshops",
  "Stickers & Labels": "High-adhesion waterproof labels & warning stickers for artisan candle & cosmetic packaging",
};

export const DEPARTMENT_FALLBACK_SUBTEXT: Record<string, string> = {
  "Casting Mediums & Raw Bases": "Batch-tested raw materials for professional cosmetic & candle makers",
  "Scent & Flavor Lab": "Pure concentrated aromas & botanical extracts for fragrance formulation",
  "Precision Studio Moulds": "Precision-engineered silicone moulds for sculptural casting & studio production",
  "Vessels & Packaging Studio": "Commercial studio containers & presentation packaging for maker brands",
  "Color & Pigment Studio": "High-purity cosmetic pigments & mineral micas for vibrant craft media",
  "Tools & Studio Equipment": "Workshop-grade tools and hardware for craft studios & small-batch production",
};

export const DEFAULT_APPLICATION_SUBTEXT =
  "Batch-tested wholesale supplies for independent artisans & manufacturing studios";

/**
 * Returns an accurate application and formulation subtext for a product
 * based on its category and department.
 */
export function getProductApplicationSubtext(
  category?: string | null,
  department?: string | null
): string {
  if (category && CATEGORY_APPLICATION_SUBTEXT[category]) {
    return CATEGORY_APPLICATION_SUBTEXT[category];
  }
  if (department && DEPARTMENT_FALLBACK_SUBTEXT[department]) {
    return DEPARTMENT_FALLBACK_SUBTEXT[department];
  }
  return DEFAULT_APPLICATION_SUBTEXT;
}

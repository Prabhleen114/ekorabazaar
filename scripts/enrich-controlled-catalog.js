/**
 * Controlled Batch Enrichment for Waxes and Carrier Oils in products.json
 * Replaces generic boilerplate with verified material, application, and storage guidance.
 */
const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const ENRICHMENTS = {
  // Waxes
  '943': 'Pure yellow beeswax slab (IP Grade) formulated for artisan candle crafting, natural lip balms, salves, cosmetic formulations, and wood polishing. Provides a natural honeyed aroma, consistent melting point, and smooth surface finish. Store in a cool, ventilated space below 25°C.',
  '1241': 'Concentrated butterfly candle fragrance oil featuring a vibrant floral bouquet blend optimized for container candles, wax melts, and aroma sachets. Formulated for excellent hot and cold scent throw across soy, paraffin, and coconut waxes. Store in original amber bottle away from heat.',

  // Carrier & Cosmetic Oils
  '793': 'Pure cold-pressed flax seed oil (Linum usitatissimum) rich in omega-3 alpha-linolenic fatty acids. Ideal for hair nourishing serums, conditioning lotions, natural soap formulations, and body oils. Store in cool, dark conditions away from direct heat to preserve freshness.',
  '799': 'Lightweight liquid fraction shea oil extracted from shea butter. Absorbs smoothly into skin without heavy greasiness, making it ideal for daily moisturizers, massage formulations, lip balms, and hair conditioners. Store tightly sealed in a dry environment.',
  '800': 'Pure cold-pressed sea buckthorn oil prized for its rich concentration of carotenoids and vitamins. Excellent for anti-aging facial serums, intensive nourishing balms, and restorative skincare formulations. Store in amber glass away from UV exposure.',
  '802': 'Pure cold-pressed marula oil known for its fast-absorbing, non-comedogenic hydration and antioxidant profile. Recommended for luxury facial oils, lightweight beard oils, hair treatments, and hydrating creams. Store at ambient room temperature away from direct light.',
  '803': 'Pure fractionated coconut oil (MCT carrier oil) that stays liquid at room temperature. Odorless, colorless, and non-greasy, making it the premier carrier oil for essential oil roller blends, massage oils, and natural cosmetics. Highly stable with extended shelf life.',
  '804': 'Traditional cold-pressed chaulmoogra oil historically utilized in therapeutic cosmetic balms, scalp care treatments, and targeted skin conditioning formulations. Store sealed in a cool, dark location away from heat sources.',
  '805': 'Cold-pressed green tea seed oil rich in polyphenols, squalene, and natural antioxidants. Formulated for lightweight facial moisturizers, soothing eye serums, and revitalizing scalp oils. Store tightly capped in amber containers.',
  '806': 'Pure cold-pressed borage oil (starflower oil) exceptionally rich in gamma-linolenic acid (GLA). Designed for deep-hydration facial oils, sensitive-skin creams, and restorative barrier balms. Store away from heat and direct UV light.',
  '807': 'Pure cold-pressed black seed oil (Kalonji Oil / Nigella sativa) packed with thymoquinone and essential fatty acids. Highly favored for invigorating hair and scalp treatments, restorative massage blends, and natural soaps. Store tightly capped in cool conditions.',
  '808': 'Pure cold-pressed bakuchi oil (Psoralea corylifolia seed oil), a celebrated plant-derived retinol alternative for smoothing skin texture and toning. Ideal for nightly anti-aging serums and rejuvenating skin elixirs. Store in amber glass away from sunlight.',
  '830': 'Cold-pressed apricot kernel oil with a gentle, silky texture rich in oleic and linoleic acids. Recommended for sensitive-skin facial cleansers, massage oils, bath oils, and artisan soap making. Non-irritating and readily absorbed.',
  '831': 'Artisan onion hair oil formulation enriched with cold-pressed botanical carriers for stimulating scalp care and hair strength. Formulated for direct scalp massage blends and nourishing pre-shampoo treatments. Store in a cool, dry place.'
};

let enrichedCount = 0;
for (const product of products) {
  const id = String(product.id);
  if (ENRICHMENTS[id]) {
    product.description = ENRICHMENTS[id];
    enrichedCount++;
  }
}

console.log(`Enriched ${enrichedCount} products in memory.`);
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
console.log(`Updated ${productsPath} successfully.`);

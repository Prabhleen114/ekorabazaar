/**
 * Ekora Bazaar — Fragrance Oil Catalog Update Script
 * Updates all 108 fragrance oil products (IDs 493–600) in products.json:
 *  - Cleaned names (brand-free, standardised)
 *  - Removed "jindeal" / "vedini" from tags[]
 *  - New `filters` field { skinSafe, cpStable, candle }
 *  - New `fragranceNotes` { top, heart, base }
 *  - New `usageLevels` table (IFRA-standard)
 *  - Premium Ekora Bazaar descriptions
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_PATH = path.join(__dirname, '../src/lib/data/products.json');

// ─── Standard Usage Levels (IFRA-compliant, same for all FOs) ────────────────
const USAGE_LEVELS = {
  "Soy & Paraffin Candles": "6–10%",
  "Wax Melts & Tarts": "8–12%",
  "Cold Process Soap": "2–5%",
  "Melt & Pour Soap": "1–3%",
  "Lotions & Body Creams": "0.5–1.5%",
  "Fine Perfume (EDP)": "15–20%",
  "Reed Diffusers": "15–25%",
  "Room & Linen Sprays": "2–5%"
};

// ─── Per-product update map ───────────────────────────────────────────────────
// Keys are string product IDs. Each entry:
//   name        : cleaned display name
//   filters     : { skinSafe, cpStable, candle }
//   fragranceNotes : { top[], heart[], base[] }
//   description : premium Ekora Bazaar copy (2–3 sentences)
const UPDATES = {
  "493": {
    name: "Ladoo Sweet Mithai Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Cardamom", "Saffron", "Sweet Dough"],
      heart: ["Rose Water", "Coconut Milk", "Ghee Accord"],
      base:  ["Sandalwood", "Warm Musk", "Vanilla"]
    },
    description: "A nostalgic tribute to India's most beloved mithai — warm, buttery sweet dough kissed with saffron and cardamom. This ultra-premium Ekora Bazaar fragrance oil captures the essence of freshly made ladoo, perfect for festive candles, artisan soaps, and luxury body care. Skin-safe and highly concentrated for exceptional throw and longevity."
  },
  "494": {
    name: "Pure Desire Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bergamot", "Pink Pepper", "Mandarin"],
      heart: ["Jasmine", "White Rose", "Orchid"],
      base:  ["White Musk", "Warm Amber", "Sandalwood"]
    },
    description: "An irresistible oriental floral that opens with sparkling citrus and warm spice before settling into a lush bouquet of white florals. Pure Desire by Ekora Bazaar is a sophisticated signature scent, expertly crafted for fine perfumery, reed diffusers, and luxury home fragrance creations."
  },
  "495": {
    name: "Lavender Vanilla Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["French Lavender", "Bergamot"],
      heart: ["Heliotrope", "Tonka Bean", "Soft Floral"],
      base:  ["Vanilla Bean", "White Musk", "Sandalwood"]
    },
    description: "A timeless pairing of calming French lavender and warm vanilla bean — a bestselling comfort fragrance that works beautifully across candles, bath soaps, and body lotions. Ekora Bazaar's Lavender Vanilla delivers a soft, enveloping warmth with excellent hot and cold throw for artisan candle makers."
  },
  "496": {
    name: "Sea Salt Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Sea Salt", "Ozone Accord", "Lemon Zest"],
      heart: ["Driftwood", "Aquatic Accord", "Water Lily"],
      base:  ["White Musk", "Cedarwood", "Soft Amber"]
    },
    description: "Breathe in the clean, invigorating freshness of a coastal breeze with this premium aquatic-mineral fragrance. Sea Salt by Ekora Bazaar is ideal for spa-inspired candles, linen sprays, and refreshing body care products, delivering a bracing oceanic clarity that lingers beautifully."
  },
  "497": {
    name: "Pure Orange Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Sweet Orange", "Mandarin", "Grapefruit"],
      heart: ["Neroli", "Orange Blossom", "Citrus Zest"],
      base:  ["White Musk", "Benzoin", "Light Sandalwood"]
    },
    description: "Vibrant and uplifting, this single-note citrus powerhouse captures the full-bodied sweetness of sun-ripened oranges. Pure Orange by Ekora Bazaar performs exceptionally in soy candles, artisan soaps, and room sprays, flooding any space with cheerful, bright citrus energy."
  },
  "498": {
    name: "Mahogany Teakwood Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Fresh Bergamot", "Citrus Zest", "Eucalyptus"],
      heart: ["Mahogany", "Teakwood", "Black Pepper"],
      base:  ["Dark Musk", "Warm Amber", "Patchouli"]
    },
    description: "A bold, masculine, and deeply grounding woody fragrance that evokes the richness of polished mahogany and aged teakwood. This Ekora Bazaar bestseller is a powerhouse performer in soy and paraffin candles, reed diffusers, and men's grooming formulations, with outstanding scent throw and exceptional longevity."
  },
  "499": {
    name: "Apple Cinnamon Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Crisp Red Apple", "Cinnamon Bark", "Clove Bud"],
      heart: ["Nutmeg", "Brown Sugar", "Caramel"],
      base:  ["Vanilla", "Sandalwood", "Warm Amber"]
    },
    description: "The quintessential autumn comfort fragrance — a warm, spiced blend of crisp apple and cinnamon that fills every room with festive warmth. Ekora Bazaar Apple Cinnamon is a crowd-favourite for holiday candles, seasonal wax melts, and artisan soaps with outstanding cold throw even before lighting."
  },
  "500": {
    name: "Ice Cool Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Peppermint", "Spearmint", "Eucalyptus"],
      heart: ["Menthol Crystal", "Ice Accord", "Aquatic Freshness"],
      base:  ["White Musk", "Cool Amber", "Clean Driftwood"]
    },
    description: "An electrifying blast of icy peppermint and eucalyptus that awakens the senses and energises any space. Ice Cool by Ekora Bazaar is ideal for spa candles, cooling body mists, refreshing room sprays, and energising soaps that deliver an exhilarating, skin-tingling freshness."
  },
  "501": {
    name: "Blue Ocean Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Sea Breeze", "Ozone Accord", "Bergamot"],
      heart: ["Aquatic Accord", "White Jasmine", "Water Lily"],
      base:  ["Cedarwood", "Driftwood", "White Musk"]
    },
    description: "An expansive, clean aquatic fragrance that captures the boundless freedom of a deep blue ocean. Blue Ocean by Ekora Bazaar is a versatile performer across candles, reed diffusers, and men's cosmetic formulations, delivering a sophisticated freshness that is both energising and effortlessly refined."
  },
  "502": {
    name: "Insignia Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Bergamot", "Lemon Verbena", "Green Accord"],
      heart: ["Lavender", "Geranium", "Violet Leaf"],
      base:  ["Warm Amber", "Musk", "Vetiver"]
    },
    description: "A distinguished, fougère-inspired fragrance with the quiet confidence of a luxury signature scent. Insignia by Ekora Bazaar transitions elegantly from a bright citrus-herb opening to a warm, grounding amber base — ideal for fine perfumery applications, artisan candles, and premium home fragrance."
  },
  "503": {
    name: "Silky Sun Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Mandarin", "Sun-warmed Lemon", "Bergamot"],
      heart: ["Ylang Ylang", "Ripe Peach", "White Jasmine"],
      base:  ["Vanilla", "Sandalwood", "White Musk"]
    },
    description: "A golden, sun-drenched fragrance that embodies warm, carefree summer days. Silky Sun by Ekora Bazaar blends bright citrus with tropical florals and a creamy vanilla base, performing beautifully in soy candles, skin-safe lotions, and luxury bath products."
  },
  "504": {
    name: "Inter Pool Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Aquatic Accord", "Clean Citrus", "Fresh Ozone"],
      heart: ["Water Lily", "Aqua Floral", "Cucumber"],
      base:  ["Clean Musk", "Light Driftwood", "Soft Amber"]
    },
    description: "Evoking the clean, crisp freshness of a luxury poolside experience, this ultra-fresh aquatic fragrance is perfect for summer candles, room sprays, and refreshing body care collections. Ekora Bazaar Inter Pool delivers pristine, spa-quality freshness that transforms any environment."
  },
  "505": {
    name: "Dove Strong Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Talc Accord", "Bergamot", "Powdery Freshness"],
      heart: ["White Rose", "Jasmine", "Soft Lily"],
      base:  ["White Musk", "Sandalwood", "Vanilla Powder"]
    },
    description: "A luxuriously clean, powdery-fresh fragrance reminiscent of high-end white soaps and premium bath products. Dove Strong by Ekora Bazaar is expertly formulated for soap making, body lotions, and candles, delivering a soft, comforting freshness with long-lasting skin adherence."
  },
  "506": {
    name: "Mimosa & Mandarin Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Mandarin", "Tangerine", "Bergamot"],
      heart: ["Mimosa Blossom", "Acacia Flower", "Soft Rose"],
      base:  ["White Musk", "Sandalwood", "Warm Amber"]
    },
    description: "A bright, effervescent blend of sun-kissed mandarin and delicate mimosa blossom — a fragrance that captures the joy of a spring morning. Cold process stable and highly versatile, Ekora Bazaar Mimosa & Mandarin excels in artisan soaps, soy candles, and light, floral body care."
  },
  "507": {
    name: "White Linen Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Clean Aldehyde", "Bergamot", "Fresh Cotton"],
      heart: ["White Lily", "Iris", "Soft Rose"],
      base:  ["White Musk", "Cedarwood", "Sandalwood"]
    },
    description: "The timeless elegance of freshly laundered white linen, crisp and beautifully clean. White Linen by Ekora Bazaar is a cold-process stable staple for artisan soap makers and a perennial bestseller in luxury linen sprays, soy candles, and premium home fragrance — evoking serene, spa-like purity."
  },
  "508": {
    name: "Masala Chai Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Cardamom", "Cinnamon", "Fresh Ginger"],
      heart: ["Black Assam Tea", "Clove Bud", "Star Anise"],
      base:  ["Creamy Vanilla", "Warm Milk", "Honey"]
    },
    description: "An authentic, deeply comforting Indian chai experience — warm spices swirling through rich black tea with a creamy, honeyed finish. Ekora Bazaar Masala Chai is a cold-process stable favourite for artisan soap makers and a stunning performer in soy candles, wax melts, and festive home fragrance collections."
  },
  "509": {
    name: "Arctic Breeze Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Peppermint", "Eucalyptus", "Crisp Arctic Air"],
      heart: ["Ice Crystal Accord", "Aquatic Ozone", "Cool Mint"],
      base:  ["White Musk", "Clean Amber", "Light Driftwood"]
    },
    description: "An exhilarating polar-fresh fragrance that conjures the invigorating clarity of Arctic winds over frozen tundra. Cold-process stable and highly versatile, Arctic Breeze by Ekora Bazaar is perfect for cooling spa candles, refreshing room sprays, energising body washes, and artisan soaps."
  },
  "510": {
    name: "French Lilac Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Fresh Green Leaves", "Bergamot", "Citrus"],
      heart: ["French Lilac", "Lily of the Valley", "White Rose"],
      base:  ["White Musk", "Orris Root", "Light Sandalwood"]
    },
    description: "A lush, garden-fresh floral that captures the intoxicating beauty of French lilac in full bloom. Ekora Bazaar French Lilac is cold-process stable with exceptional performance in artisan soaps, luxury candles, and feminine body care collections — a perennial springtime favourite."
  },
  "511": {
    name: "Hazelnut Coffee Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Dark Roasted Espresso", "Rich Coffee Bean"],
      heart: ["Toasted Hazelnut", "Salted Caramel", "Dark Cocoa"],
      base:  ["Vanilla Extract", "Sandalwood", "Warm Musk"]
    },
    description: "The irresistible aroma of a freshly brewed hazelnut latte — dark, roasted coffee richness softened by toasty nuts and warm vanilla. Cold-process stable, Ekora Bazaar Hazelnut Coffee is a beloved choice for dessert candles, artisan soaps, and warm, gourmand home fragrance collections."
  },
  "512": {
    name: "Gili Mitti Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Petrichor", "Wet Earth", "First Rain"],
      heart: ["Vetiver", "Green Moss", "Wild Grass"],
      base:  ["Sandalwood", "Patchouli", "Earthy Musk"]
    },
    description: "The evocative, deeply Indian scent of the first rain on parched earth — petrichor captured in exquisite aromatic form. Ekora Bazaar Gili Mitti is cold-process stable and connects deeply with Indian sensibilities, performing powerfully in artisan candles, soaps, and premium home fragrance diffusers."
  },
  "513": {
    name: "Bamboo Leaf Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Fresh Bamboo", "Cool Cucumber", "Clean Air"],
      heart: ["White Lotus", "Aquatic Lily", "White Tea"],
      base:  ["White Musk", "Light Cedarwood", "Soft Amber"]
    },
    description: "A pristine, Zen-inspired green fragrance evoking a peaceful bamboo forest with a gentle breeze. Bamboo Leaf by Ekora Bazaar is cold-process stable and beautifully suited for spa candles, luxury soaps, minimalist reed diffusers, and clean, nature-inspired body care products."
  },
  "514": {
    name: "Moringa Drumstick Flower Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Moringa Blossom", "Green Leaf Accord", "Fresh Herb"],
      heart: ["White Jasmine", "Water Lily", "Soft Floral"],
      base:  ["Woody Musk", "Sandalwood", "Light Amber"]
    },
    description: "A uniquely Indian, botanically-inspired fragrance celebrating the delicate blossoms of the sacred moringa tree. Ekora Bazaar Moringa Drumstick Flower is cold-process stable, making it ideal for natural soap formulations, herbal candles, and wellness-focused body care with a fresh, earthy elegance."
  },
  "515": {
    name: "Amber Noir Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Black Pepper", "Bergamot", "Cardamom"],
      heart: ["Smoky Incense", "Oud Accord", "Dark Rose"],
      base:  ["Dark Amber", "Patchouli", "Rich Vanilla"]
    },
    description: "A luxuriously dark, mysterious Oriental fragrance with the smouldering depth of incense, oud, and dark amber. Ekora Bazaar Amber Noir is cold-process stable with an exceptional cold throw, perfect for opulent candles, luxury soap making, premium reed diffusers, and sophisticated fine fragrance formulations."
  },
  "516": {
    name: "Apple Pie Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Crisp Baked Apple", "Cinnamon", "Nutmeg"],
      heart: ["Buttery Pastry", "Brown Sugar", "Caramel"],
      base:  ["Warm Vanilla Custard", "Clove", "Golden Amber"]
    },
    description: "The comforting, irresistible aroma of a freshly baked apple pie straight from the oven — warm spices, buttery pastry, and sweet caramel in perfect harmony. Cold-process stable and cold-throw verified, Ekora Bazaar Apple Pie is a top performer in holiday candles, dessert wax melts, and artisan soaps."
  },
  "517": {
    name: "Russian Leather Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Black Pepper", "Birch Tar", "Bergamot"],
      heart: ["Rich Leather", "Tobacco Leaf", "Oud Accord"],
      base:  ["Dark Amber", "Vetiver", "Warm Sandalwood"]
    },
    description: "An intensely distinguished, leather-forward fragrance with the raw sophistication of aged Russian birch tar leather. Cold-process stable, Ekora Bazaar Russian Leather is the definitive choice for masculine luxury candles, bold reed diffusers, high-end soap making, and artisan fine fragrance formulations."
  },
  "518": {
    name: "Green Tea & Lemon Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Lemon Zest", "Bergamot", "Lime"],
      heart: ["Green Tea", "White Tea", "Jasmine Blossom"],
      base:  ["White Musk", "Light Cedarwood", "Clean Amber"]
    },
    description: "A crisp, invigorating fusion of zesty lemon and refined green tea — clean, refreshing, and enduringly elegant. Cold-process stable and skin-safe, Ekora Bazaar Green Tea & Lemon is an everyday essential for spa candles, artisan soaps, refreshing body washes, and light reed diffusers."
  },
  "519": {
    name: "Lush Bomb Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Bergamot", "Lemon", "Pink Grapefruit"],
      heart: ["Jasmine", "White Rose", "Peony"],
      base:  ["White Musk", "Sandalwood", "Warm Vanilla"]
    },
    description: "A vivacious, multi-dimensional floral-citrus burst inspired by the luxurious indulgence of a bath bomb experience. Cold-process stable and highly skin-safe, Ekora Bazaar Lush Bomb is a natural choice for bath bombs, artisan soaps, body lotions, and floral-forward luxury candles."
  },
  "520": {
    name: "Vetiver Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Lemon", "Grapefruit", "Bergamot"],
      heart: ["Vetiver Root", "Violet Leaf", "Geranium"],
      base:  ["Smoky Cedarwood", "Oakmoss", "Dark Musk"]
    },
    description: "The raw, earthy complexity of vetiver root — a deeply grounding, smoky-green fragrance with timeless sophistication. Ekora Bazaar Vetiver is cold-process stable and perfect for masculine candles, premium artisan soaps, eau de cologne formulations, and distinguished reed diffusers that command attention."
  },
  "521": {
    name: "Vanilla SPC Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Sweet Vanilla Bean", "Tonka Bean", "Warm Sugar"],
      heart: ["Heliotrope", "Jasmine", "Powder Accord"],
      base:  ["Sandalwood", "White Musk", "Caramel"]
    },
    description: "A rich, gourmand vanilla of exceptional depth and sweetness — warm, powdery, and utterly luxurious. Cold-process stable, Ekora Bazaar Vanilla SPC is a top-performing base note for complex fragrance blending, artisan soaps, creamy body butters, and warm, comforting luxury candles."
  },
  "522": {
    name: "Lavender Kashmir Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Himalayan Lavender", "Bergamot", "Eucalyptus"],
      heart: ["Kashmiri Rose", "Geranium", "Clary Sage"],
      base:  ["Sandalwood", "Warm Musk", "Soft Amber"]
    },
    description: "An elevated lavender inspired by the pristine highland meadows of the Kashmir Valley — more complex and warmer than standard lavender, with a roseate heart and sandalwood depth. Cold-process stable, this Ekora Bazaar signature is outstanding in luxury soaps, calming candles, and sleep-aid body care."
  },
  "523": {
    name: "Japanese Cherry Blossom Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Cherry Blossom", "Ripe Peach", "Yuzu"],
      heart: ["Mimosa", "Soft Magnolia", "Violet Leaf"],
      base:  ["White Sandalwood", "White Musk", "Vanilla"]
    },
    description: "A delicate, ephemeral floral inspired by the fleeting beauty of Japanese sakura season. Ekora Bazaar Japanese Cherry Blossom is a skin-safe favourite for premium body lotions, shower gels, artisan soaps, and feminine fine fragrance formulations that exude gentle, luminous elegance."
  },
  "524": {
    name: "Ameer Al Oudh Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Saffron", "Bulgarian Rose", "Bergamot"],
      heart: ["Royal Oud", "Leather", "Sacred Incense"],
      base:  ["Dark Amber", "Labdanum", "White Musk"]
    },
    description: "A majestic, Middle Eastern-inspired oud composition fit for royalty — the intoxicating complexity of saffron-rose over the smouldering darkness of premium agarwood. Ekora Bazaar Ameer Al Oudh is skin-safe and formulated for luxury eau de parfum, attar creation, premium reed diffusers, and opulent home fragrance."
  },
  "525": {
    name: "Pumpkin Pie Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Spiced Pumpkin", "Cinnamon", "Nutmeg"],
      heart: ["Caramel", "Brown Sugar", "Clove"],
      base:  ["Vanilla Custard", "Butter", "Warm Spice"]
    },
    description: "The quintessential autumn gourmand — warm, spiced pumpkin wrapped in caramel, butter, and sweet vanilla. Cold-process stable, Ekora Bazaar Pumpkin Pie is a seasonal bestseller for fall candles, holiday wax melts, festive artisan soaps, and warm home fragrance collections that celebrate harvest season."
  },
  "526": {
    name: "Frangipani Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Plumeria Blossom", "Frangipani", "Coconut"],
      heart: ["White Jasmine", "Ylang Ylang", "Tropical Floral"],
      base:  ["White Musk", "Sandalwood", "Warm Vanilla"]
    },
    description: "The intoxicating floral sweetness of tropical frangipani — a lush, creamy, and undeniably exotic fragrance. Ekora Bazaar Frangipani is skin-safe and an exquisite choice for luxury body butters, tropical soaps, fine perfumery, and spa-inspired personal care formulations."
  },
  "527": {
    name: "English Oakmoss Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Bergamot", "Lemon", "Fresh Petrichor"],
      heart: ["Oakmoss", "Forest Fern", "Vetiver"],
      base:  ["Cedarwood", "Dark Patchouli", "Rich Amber"]
    },
    description: "A deep, verdant fougère that captures the raw, ancient beauty of an English moss-covered forest after rain. Cold-process stable and unique in its earthy complexity, Ekora Bazaar English Oakmoss is exceptional for artisanal men's soaps, nature-inspired candles, and sophisticated unisex reed diffusers."
  },
  "528": {
    name: "Sensual Amber Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bergamot", "Mandarin", "Warm Saffron"],
      heart: ["Damask Rose", "White Jasmine", "Violet"],
      base:  ["Warm Amber", "Vanilla", "White Musk"]
    },
    description: "A deeply sensual, warm Oriental fragrance that envelops the senses in rich amber, precious florals, and sun-warmed saffron. Ekora Bazaar Sensual Amber is skin-safe and formulated for intimate perfumery applications, luxury body lotions, and premium cosmetic formulations requiring a rich, long-lasting signature scent."
  },
  "529": {
    name: "Fun Loving Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Passion Fruit", "Ripe Mango", "Pineapple"],
      heart: ["Watermelon", "Coconut Cream", "White Peach"],
      base:  ["White Musk", "Vanilla", "Tropical Wood"]
    },
    description: "A vibrant, carefree tropical explosion of exotic fruits and creamy coconut — joyful, playful, and utterly irresistible. Ekora Bazaar Fun Loving is skin-safe and perfect for summery body mists, fun bath products, tropical-themed cosmetics, and fruity personal care formulations that radiate positivity."
  },
  "530": {
    name: "Saffron Cedar Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Persian Saffron", "Black Pepper", "Bergamot"],
      heart: ["Atlas Cedarwood", "Oud Rose", "Sacred Incense"],
      base:  ["Warm Amber", "Dark Patchouli", "Deep Musk"]
    },
    description: "An opulent, Middle Eastern-inspired composition where precious saffron meets the dignified strength of Atlas cedarwood. Cold-process stable, Ekora Bazaar Saffron Cedar is a premium choice for artisan oudh candles, luxury soap making, sophisticated reed diffusers, and bespoke fine fragrance formulations."
  },
  "531": {
    name: "Mango Punch Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Alphonso Mango", "Passion Fruit", "Guava"],
      heart: ["Tropical Punch", "Coconut Water", "Peach"],
      base:  ["Warm Musk", "Sandalwood", "Light Vanilla"]
    },
    description: "A luscious, tropical explosion of premium Alphonso mango blended with passion fruit and guava — vibrant, exotic, and unforgettable. Cold-process stable, Ekora Bazaar Mango Punch is a top choice for fruit-themed artisan soaps, tropical candles, summer wax melts, and fun body care formulations."
  },
  "532": {
    name: "Peach Coconut Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Ripe Peach", "Lychee", "Apricot"],
      heart: ["Coconut Cream", "White Jasmine", "Peach Nectar"],
      base:  ["Vanilla Milk", "White Musk", "Sandalwood"]
    },
    description: "A lushly creamy, tropical combination of sun-ripened peach and silky coconut cream that evokes luxury beach resort living. Cold-process stable, Ekora Bazaar Peach Coconut is a crowd-pleasing performer in artisan soaps, summer candles, body butters, and tropical-themed cosmetic collections."
  },
  "533": {
    name: "Morning Flower Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Morning Dew", "Bergamot", "Fresh Air"],
      heart: ["White Peony", "Jasmine Blossom", "Soft Lily"],
      base:  ["White Musk", "Sandalwood", "Soft Amber"]
    },
    description: "The pristine, dewy freshness of a garden in full morning bloom — light, feminine, and infinitely uplifting. Cold-process stable, Ekora Bazaar Morning Flower is an ideal choice for spring candles, feminine artisan soaps, delicate body mists, and fresh home fragrance collections that celebrate new beginnings."
  },
  "534": {
    name: "Cardamom & Saffron Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Green Cardamom", "Persian Saffron", "Black Pepper"],
      heart: ["Damask Rose", "Oud Accord", "Warm Spice"],
      base:  ["Sandalwood", "Dark Amber", "Rich Musk"]
    },
    description: "An indulgent, intensely aromatic spice blend celebrating two of India's most precious ingredients. Cold-process stable, Ekora Bazaar Cardamom & Saffron is an extraordinary choice for festival candles, premium artisan soaps, oud-inspired reed diffusers, and luxury South Asian-inspired home fragrance collections."
  },
  "535": {
    name: "French Oak Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bergamot", "Black Pepper", "Green Accord"],
      heart: ["French Oak", "Cedarwood", "Dark Leather"],
      base:  ["Amber", "Dark Musk", "Vetiver"]
    },
    description: "The distinguished, commanding presence of aged French oak barrels — sophisticated, woody, and timelessly masculine. Ekora Bazaar French Oak is a premium base and diffuser-grade fragrance oil, exceptional in reed diffusers, home fragrance sprays, and luxury candle formulations demanding deep, authoritative character."
  },
  "536": {
    name: "Silky Musk Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bergamot", "Pink Pepper", "Soft Citrus"],
      heart: ["Soft Lily", "White Jasmine", "Orris"],
      base:  ["White Musk", "Cashmere", "Warm Sandalwood"]
    },
    description: "An utterly refined, second-skin musk of extraordinary softness and clean elegance. Ekora Bazaar Silky Musk is the definitive background note for luxury reed diffusers, fine perfumery blending, and premium home fragrance — a sophisticated clean musk that whispers rather than shouts."
  },
  "537": {
    name: "Aloe Vera Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Aloe Vera", "Green Cucumber", "Fresh Marine"],
      heart: ["White Tea", "Aquatic Floral", "Cool Accord"],
      base:  ["White Musk", "Light Amber", "Soft Wood"]
    },
    description: "The clean, soothing freshness of fresh aloe vera leaf — cooling, green, and botanically pure. Ekora Bazaar Aloe Vera is an ideal fragrance for wellness and natural personal care collections, lending a fresh, skin-care-inspired character to candles, room sprays, and botanical home fragrance."
  },
  "538": {
    name: "Lotus Floral Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Lotus Blossom", "Water Lily", "Aquatic Citrus"],
      heart: ["White Jasmine", "Soft Rose", "Pink Peony"],
      base:  ["White Musk", "Sandalwood", "Light Amber"]
    },
    description: "A serene, spiritually uplifting floral capturing the sacred purity of the Indian lotus in full bloom. Ekora Bazaar Lotus Floral is perfect for temple-inspired candles, yoga and meditation spaces, artisan soaps, and premium home fragrance seeking gentle, water-kissed floral elegance."
  },
  "539": {
    name: "Romantic Mogra Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Mogra (Arabian Jasmine)", "Fresh Green Leaves", "Bergamot"],
      heart: ["White Jasmine", "Tuberose", "Soft Floral"],
      base:  ["Sandalwood", "White Musk", "Light Vanilla"]
    },
    description: "The heady, romantic intensity of fresh mogra garlands — India's most beloved white flower captured in liquid artistry. Ekora Bazaar Romantic Mogra evokes the romance of jasmine-strewn verandahs, perfect for premium home fragrance, attar-inspired perfumery, and floral candle collections."
  },
  "540": {
    name: "Green Apple Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Crisp Green Apple", "Tart Lime", "Citrus Zest"],
      heart: ["Apple Blossom", "Lily of the Valley", "Fresh Accord"],
      base:  ["White Musk", "Light Sandalwood", "Clean Amber"]
    },
    description: "The sharp, invigorating freshness of a just-bitten green apple — tart, clean, and irresistibly bright. Ekora Bazaar Green Apple delivers vibrant, juicy top-note energy for home fragrance, candles, and freshening room sprays that create an instantly uplifted, energetic atmosphere."
  },
  "541": {
    name: "Ginger & Lime Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Lime Zest", "Bergamot", "Lemon"],
      heart: ["Fresh Ginger Root", "Cardamom", "Green Accord"],
      base:  ["White Musk", "Cedarwood", "Soft Amber"]
    },
    description: "A zingy, spirited combination of tart lime and spicy fresh ginger — an energising citrus-spice duo with a clean, modern edge. Ekora Bazaar Ginger & Lime is a bold performer for candles, room sprays, and energising aromatherapy-inspired home fragrance collections."
  },
  "542": {
    name: "Cucumber Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Fresh Cucumber", "Green Melon", "Crisp Green"],
      heart: ["Water Accord", "White Floral", "Aquatic Notes"],
      base:  ["White Musk", "Light Cedarwood", "Clean Amber"]
    },
    description: "The cool, hydrating freshness of a freshly sliced cucumber — clean, green, and serenely spa-like. Ekora Bazaar Cucumber is perfect for minimalist home fragrance, refreshing summer candles, and spa-inspired room sprays creating an atmosphere of cool, effortless cleanliness."
  },
  "543": {
    name: "Black Oudh Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Persian Saffron", "Black Pepper", "Dark Bergamot"],
      heart: ["Black Agarwood", "Dark Leather", "Damask Rose"],
      base:  ["Dark Amber", "Patchouli", "Smoky Vetiver"]
    },
    description: "An intensely dark, hypnotic Oriental oud fragrance for those who demand the extraordinary. Ekora Bazaar Black Oudh is an extraordinary choice for premium reed diffusers, opulent home fragrance, and artisan candles seeking a commanding, mysterious, deeply luxurious olfactive presence."
  },
  "544": {
    name: "Honeysuckle & Peach Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Ripe Peach", "Raspberry", "Fresh Citrus"],
      heart: ["Honeysuckle", "White Jasmine", "Soft Rose"],
      base:  ["White Musk", "Sandalwood", "Warm Vanilla"]
    },
    description: "A bright, garden-fresh floral-fruity fragrance where the sweet nectar of honeysuckle entwines with luscious ripe peach. Ekora Bazaar Honeysuckle & Peach is a natural choice for feminine home fragrance, floral candles, and spring-summer room spray collections."
  },
  "545": {
    name: "Nargis Flower Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Nargis (Narcissus)", "Green Leaf", "Bergamot"],
      heart: ["White Tuberose", "Jasmine Sambac", "Soft Lily"],
      base:  ["White Musk", "Sandalwood", "Light Amber"]
    },
    description: "The rare, intoxicating sweetness of nargis — India's beloved narcissus flower — captured with breathtaking botanical fidelity. Ekora Bazaar Nargis Flower is a distinguished choice for traditional Indian-inspired attar creation, premium home fragrance, and floral candles with deep cultural resonance."
  },
  "546": {
    name: "Gardenia & White Peach Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["White Peach", "Bergamot", "Soft Citrus"],
      heart: ["Gardenia", "White Jasmine", "Soft Lily"],
      base:  ["White Musk", "Light Cedarwood", "Warm Amber"]
    },
    description: "A graceful, pristine white floral pairing the creamy richness of gardenia with the luminous sweetness of white peach. Ekora Bazaar Gardenia & White Peach is an elegant choice for luxury home fragrance, feminine candles, and premium personal care collections seeking effortless sophistication."
  },
  "547": {
    name: "Pink Sand Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Sea Salt", "Ripe Melon", "Bergamot"],
      heart: ["Jasmine", "Coconut Milk", "Tropical Accord"],
      base:  ["White Musk", "Sandalwood", "Warm Vanilla"]
    },
    description: "A dreamy, tropical-beach inspired fragrance capturing the languid beauty of pink sand shores at sunset. Ekora Bazaar Pink Sand blends sea salt freshness with creamy coconut and tropical florals, ideal for luxury holiday candles, beach-themed reed diffusers, and summery home fragrance collections."
  },
  "548": {
    name: "Dewberry Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Wild Dewberry", "Blackberry", "Raspberry"],
      heart: ["Damask Rose", "Wild Violet", "Soft Peony"],
      base:  ["White Musk", "Sandalwood", "Light Vanilla"]
    },
    description: "The sweet, slightly tart freshness of wild dewberries mingled with soft rose and violet — a charming, countryside-fresh fragrance. Ekora Bazaar Dewberry is an enduring favourite for floral-fruity candles, home fragrance sprays, and feminine home scenting collections."
  },
  "549": {
    name: "Mix Fruit 101 Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Strawberry", "Mango", "Pineapple"],
      heart: ["Passion Fruit", "White Peach", "Watermelon"],
      base:  ["White Musk", "Light Vanilla", "Soft Wood"]
    },
    description: "A fun, vibrant tropical fruit salad of exotic fragrances — bright, playful, and endlessly cheerful. Ekora Bazaar Mix Fruit 101 is perfect for uplifting home fragrance, fruity candles, and fun room sprays that bring instant joy and colour to any creative product collection."
  },
  "550": {
    name: "Kiwi Fig Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Kiwi", "Pink Grapefruit", "Lime Zest"],
      heart: ["Black Fig", "Green Accord", "White Tea"],
      base:  ["White Musk", "Light Cedarwood", "Soft Amber"]
    },
    description: "A sophisticated green-fruity pairing of tart kiwi and luscious black fig — complex, fresh, and unexpectedly elegant. Cold-process stable, Ekora Bazaar Kiwi Fig is a refined choice for artisan soaps, green-inspired candles, and light home fragrance collections celebrating natural botanical complexity."
  },
  "551": {
    name: "Sea Breeze Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Ozone Accord", "Citrus Zest", "Sea Salt"],
      heart: ["Aquatic Accord", "White Floral", "Driftwood"],
      base:  ["Light Musk", "Clean Cedarwood", "Soft Amber"]
    },
    description: "The invigorating, clean freshness of an open ocean breeze — crisp, salty, and endlessly refreshing. Ekora Bazaar Sea Breeze is the ultimate choice for coastal-inspired candles, refreshing home fragrance, and room sprays that instantly transport to a pristine seaside destination."
  },
  "552": {
    name: "Patchouli Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bergamot", "Lemon Zest", "Black Pepper"],
      heart: ["Dark Patchouli", "Earthy Geranium", "Clary Sage"],
      base:  ["Dark Musk", "Vetiver Root", "Sandalwood"]
    },
    description: "The iconic, raw, earthy magnetism of pure patchouli — deeply grounding, sensual, and unmistakably powerful. Ekora Bazaar Patchouli is a classic base note for perfumery blending, artisan soap making, incense-inspired candles, and home fragrance formulations demanding authentic, richly complex depth."
  },
  "553": {
    name: "Coffee Bean Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Dark Roasted Coffee", "Rich Espresso", "Bitter Cocoa"],
      heart: ["Coffee Bean Extract", "Mocha", "Caramel"],
      base:  ["Vanilla", "Dark Amber", "Warm Musk"]
    },
    description: "The intoxicating aroma of a fresh espresso shot — rich, dark, and deeply comforting. Ekora Bazaar Coffee Bean is a powerful olfactive performer for premium coffee shop candles, gourmand wax melts, and home fragrance collections seeking the irresistible warmth of freshly ground coffee beans."
  },
  "554": {
    name: "Choco Musk Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Dark Chocolate", "Warm Cocoa", "Praline"],
      heart: ["Salted Caramel", "Truffle", "Rich Cream"],
      base:  ["White Musk", "Vanilla Bean", "Warm Sandalwood"]
    },
    description: "A seductive, dessert-inspired gourmand pairing of dark chocolate and clean white musk — indulgent yet surprisingly elegant. Ekora Bazaar Choco Musk is a beautiful choice for luxury dessert candles, warm wax melts, and sensual home fragrance collections that blur the line between confectionery and perfumery."
  },
  "555": {
    name: "Real Lemon Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Sicilian Lemon Zest", "Bergamot", "Lime"],
      heart: ["Lemon Blossom", "White Tea", "Green Accord"],
      base:  ["White Musk", "Light Amber", "Soft Cedarwood"]
    },
    description: "A vibrant, true-to-nature lemon fragrance with the zesty brightness of Sicilian citrus groves. Ekora Bazaar Real Lemon is an energising choice for mood-lifting candles, refreshing room sprays, and home fragrance collections demanding authentic, squeezed-fresh lemon intensity."
  },
  "556": {
    name: "Green Tea Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Green Tea", "Bergamot", "Lemon Verbena"],
      heart: ["White Tea", "Jasmine Blossom", "Spearmint"],
      base:  ["White Musk", "Cedarwood", "Light Amber"]
    },
    description: "The serene, mindful clarity of a perfectly steeped cup of premium green tea — clean, delicate, and meditative. Ekora Bazaar Green Tea is ideal for zen-inspired candles, minimalist reed diffusers, and calming home fragrance collections that create spaces of tranquillity and focus."
  },
  "557": {
    name: "Strawberry Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Fresh Strawberry", "Raspberry", "Citrus Zest"],
      heart: ["Strawberry Blossom", "Wild Rose", "Soft Floral"],
      base:  ["White Musk", "Warm Vanilla", "Soft Amber"]
    },
    description: "The sweet, sun-warmed juiciness of freshly picked strawberries — bright, fruity, and utterly irresistible. Ekora Bazaar Strawberry is a vibrant crowd-pleaser for fruity candles, room sprays, and home fragrance collections that deliver cheerful, berry-fresh energy to any creative product."
  },
  "558": {
    name: "White Lily Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["White Lily", "Neroli", "Soft Jasmine"],
      heart: ["Lily of the Valley", "White Peony", "Iris"],
      base:  ["White Musk", "Light Sandalwood", "Clean Amber"]
    },
    description: "A pristine, luminous white floral of breathtaking purity — the classic elegance of white lily in its most refined expression. Ekora Bazaar White Lily is an enduring choice for bridal-inspired candles, elegant home fragrance, and feminine room spray collections demanding pristine, sophisticated floral grace."
  },
  "559": {
    name: "White Musk Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Clean Bergamot", "Soft Citrus", "Aldehydic Accord"],
      heart: ["White Jasmine", "Lily", "Soft Powder"],
      base:  ["White Musk", "Cashmere Wood", "Sandalwood"]
    },
    description: "The quintessential clean skin musk — light, airy, and effortlessly elegant. Ekora Bazaar White Musk is an indispensable blending base for perfumery, a classic choice for premium reed diffusers, linen sprays, and candles seeking the signature warmth of a luxurious second-skin fragrance."
  },
  "560": {
    name: "White Soap Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Clean Aldehydic Accord", "Citrus Freshness", "Bergamot"],
      heart: ["White Lily", "Iris", "Soft Rose"],
      base:  ["White Musk", "Sandalwood", "Soap Accord"]
    },
    description: "The universally appealing, impeccably clean fragrance of premium white soap — fresh, bright, and utterly trustworthy. Ekora Bazaar White Soap is skin-safe and a natural choice for artisan soap makers, body wash formulators, and home fragrance creators seeking the signature appeal of a classic luxury soap bar."
  },
  "561": {
    name: "Milk Soap Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Fresh Milk", "Clean Cotton", "Soft Citrus"],
      heart: ["White Jasmine", "Soft Lily", "Baby Powder"],
      base:  ["Vanilla Milk", "White Musk", "Sandalwood"]
    },
    description: "A soft, tender, milk-fresh fragrance evoking the comforting cleanliness of an artisan milk soap bar. Ekora Bazaar Milk Soap is skin-safe and an essential choice for milk bath products, baby-inspired body care, creamy artisan soaps, and gentle, nurturing personal care formulations."
  },
  "562": {
    name: "Lavender Yardle Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["English Lavender", "Bergamot", "Lemon"],
      heart: ["Lavender Heart", "Geranium", "Rose Water"],
      base:  ["Cedarwood", "White Musk", "Coumarin"]
    },
    description: "A classic, British-inspired lavender of refined aromatic elegance — the gold standard of lavender fragrances. Ekora Bazaar Lavender Yardle is a timeless choice for artisan soaps, luxury candles, linen sprays, and bath products seeking the definitive, comforting lavender experience."
  },
  "563": {
    name: "Sandalwood & Saffron Fragrance Oil",
    filters: { skinSafe: false, cpStable: true, candle: false },
    fragranceNotes: {
      top:   ["Persian Saffron", "Black Pepper", "Bergamot"],
      heart: ["Damask Rose", "Sacred Incense", "Oud Accord"],
      base:  ["Mysore Sandalwood", "Warm Amber", "Deep Musk"]
    },
    description: "A regal, deeply Indian composition pairing the meditative warmth of Mysore sandalwood with the precious intensity of Persian saffron. Cold-process stable, Ekora Bazaar Sandalwood & Saffron is an exceptional choice for luxury soap making, premium home fragrance, and culturally resonant artisan creations."
  },
  "564": {
    name: "Kesar Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Pure Saffron (Kesar)", "Rose Water", "Bergamot"],
      heart: ["Cardamom", "Oud Accord", "Soft Spice"],
      base:  ["Sandalwood", "Warm Amber", "Golden Musk"]
    },
    description: "The rare, earthy-sweet richness of pure Kashmiri kesar — India's most precious spice rendered in exquisite aromatic form. Ekora Bazaar Kesar is a distinguished choice for traditional Indian attar-inspired fragrance, premium reed diffusers, and culturally-rooted luxury home fragrance collections."
  },
  "565": {
    name: "Citrus Fruit Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Sicilian Lemon", "Blood Orange", "Pink Grapefruit", "Lime"],
      heart: ["Neroli", "Mandarin Blossom", "White Floral"],
      base:  ["White Musk", "Soft Amber", "Light Benzoin"]
    },
    description: "A vibrant, multi-layered citrus symphony combining the brightest notes from across the citrus family. Ekora Bazaar Citrus Fruit is an energising, mood-lifting choice for uplifting candles, room sprays, home fragrance diffusers, and any creative product demanding a burst of fresh, exuberant citrus vitality."
  },
  "566": {
    name: "Gentleman's Tonic Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bergamot", "Grapefruit", "Juniper Berry"],
      heart: ["Aromatic Lavender", "Geranium", "Light Vetiver"],
      base:  ["Warm Amber", "Cedarwood", "Distinguished Musk"]
    },
    description: "A sophisticated, barbershop-inspired aromatic fragrance with the refined confidence of a classic gentleman's tonic. Ekora Bazaar Gentleman's Tonic is the definitive choice for masculine candles, luxury grooming-inspired products, premium men's room fragrance, and distinguished reed diffusers."
  },
  "567": {
    name: "Red Wine Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Red Berry", "Crushed Grape", "Black Plum"],
      heart: ["Cabernet Rose", "Violet", "Rich Fruit Accord"],
      base:  ["Dark Amber", "Sandalwood", "Warm Musk"]
    },
    description: "The rich, vinous complexity of a perfectly aged Cabernet Sauvignon — deeply fruity, darkly romantic, and wonderfully sophisticated. Ekora Bazaar Red Wine is an exceptional choice for romantic candles, wine bar-inspired home fragrance, and distinguished reed diffusers evoking an intimate, cultured atmosphere."
  },
  "568": {
    name: "Sandal Florence Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bergamot", "Mandarin", "Light Spice"],
      heart: ["Florentine Iris", "Damask Rose", "Violet"],
      base:  ["Mysore Sandalwood", "Cedarwood", "White Musk"]
    },
    description: "A refined Italian-inspired sandalwood fragrance where creamy Mysore sandalwood is elevated by the powdery sophistication of Florentine iris. Ekora Bazaar Sandal Florence is a distinguished choice for luxury candles, premium reed diffusers, and sophisticated home fragrance evoking old-world Italian elegance."
  },
  "569": {
    name: "Papaya Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Tropical Papaya", "Ripe Mango", "Guava"],
      heart: ["Coconut Cream", "Passion Fruit", "Peach"],
      base:  ["White Musk", "Light Vanilla", "Soft Wood"]
    },
    description: "The luscious, tropical sweetness of ripe papaya at its peak — vibrant, fruity, and irresistibly exotic. Ekora Bazaar Papaya is a cheerful choice for tropical-themed candles, uplifting room sprays, and summery home fragrance collections celebrating the bounty of exotic tropical fruits."
  },
  "570": {
    name: "Apple Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Crisp Apple", "Ripe Pear", "Fresh Citrus"],
      heart: ["Apple Blossom", "White Floral", "Green Accord"],
      base:  ["White Musk", "Light Amber", "Soft Sandalwood"]
    },
    description: "The clean, crisp sweetness of a freshly picked apple — simple, pure, and timelessly appealing. Ekora Bazaar Apple is a versatile, accessible fruity fragrance for candles, room sprays, and home fragrance collections seeking cheerful, familiar fruitiness that appeals universally."
  },
  "571": {
    name: "Real Rose Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bulgarian Rose", "Rosewood", "Bergamot"],
      heart: ["Damask Rose Absolute", "Violet Leaf", "Geranium"],
      base:  ["White Musk", "Sandalwood", "Dark Patchouli"]
    },
    description: "The true, unforgettable grandeur of Bulgarian Damask rose — captured at peak bloom with exceptional botanical fidelity. Ekora Bazaar Real Rose is a premium, true-to-nature floral for luxury candles, high-end perfumery blending, and sophisticated home fragrance collections where authenticity is paramount."
  },
  "572": {
    name: "Fasli Gulaab Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Desi Gulaab (Indian Rose)", "Rosewater", "Light Citrus"],
      heart: ["Rose Petals", "Geranium", "Soft Floral"],
      base:  ["White Musk", "Sandalwood", "Light Amber"]
    },
    description: "A nostalgic celebration of the desi Indian gulaab — the seasonal rose of village gardens and temple offerings, tender and sweetly familiar. Ekora Bazaar Fasli Gulaab connects deeply with Indian olfactive heritage, ideal for traditional-inspired home fragrance, premium incense alternatives, and floral artisan candles."
  },
  "573": {
    name: "Spanish Kesar Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Spanish Saffron", "Bergamot", "Soft Rose"],
      heart: ["Orange Blossom", "White Jasmine", "Cardamom"],
      base:  ["Sandalwood", "Warm Amber", "Golden Musk"]
    },
    description: "The golden warmth of Spanish azafrán — a richer, more floral expression of saffron than its Eastern counterpart. Ekora Bazaar Spanish Kesar blends the precious warmth of saffron with Mediterranean florals and sandalwood, ideal for premium home fragrance and culturally rich artisan candle collections."
  },
  "574": {
    name: "Jasmine Flower Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Jasmine Sambac Buds", "Fresh Green Leaves", "Bergamot"],
      heart: ["White Jasmine Absolute", "Tuberose", "Ylang Ylang"],
      base:  ["White Musk", "Sandalwood", "Light Amber"]
    },
    description: "The heady, intoxicating richness of jasmine sambac in full night bloom — lush, complex, and deeply feminine. Ekora Bazaar Jasmine Flower is the quintessential Indian white floral for premium home fragrance, luxury candles, traditional attar-inspired formulations, and personal care products seeking true jasmine beauty."
  },
  "575": {
    name: "Rose Bulgarian Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bulgarian Rose Absolute", "Bergamot", "Green Leaf"],
      heart: ["Damask Rose", "Soft Geranium", "Pink Peony"],
      base:  ["White Musk", "Sandalwood", "Gentle Patchouli"]
    },
    description: "The most prized floral in perfumery — pure Bulgarian Damask rose, rich with waxy petals, honey, and incomparable floral depth. Ekora Bazaar Rose Bulgarian is a true luxury fragrance oil for fine perfumery, high-end artisan soaps, and prestigious home fragrance creations of the highest quality."
  },
  "576": {
    name: "Neem & Tulsi Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Neem Leaf", "Tulsi (Holy Basil)", "Green Herb"],
      heart: ["Botanical Green Accord", "Fresh Herbal Notes", "Light Earth"],
      base:  ["Earthy Musk", "Sandalwood", "Dry Wood"]
    },
    description: "An authentically Indian herbal composition celebrating the sacred wellness plants of Ayurveda — neem and tulsi in fresh, green, botanical harmony. Ekora Bazaar Neem & Tulsi is perfect for natural wellness candles, Ayurvedic-inspired home fragrance, and earthy, herb-forward room sprays."
  },
  "577": {
    name: "Honey & Milk Fragrance Oil",
    filters: { skinSafe: true, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Warm Honey", "Fresh Whole Milk", "Soft Citrus"],
      heart: ["Jasmine Tea", "Vanilla Orchid", "Heliotrope"],
      base:  ["Cream Accord", "White Musk", "Sandalwood"]
    },
    description: "A sumptuously nourishing, skin-enveloping fragrance of warm honey and creamy milk — soft, tender, and utterly comforting. Skin-safe, Ekora Bazaar Honey & Milk is a luxurious choice for milk bath products, artisan soaps, rich body butters, and premium personal care formulations inspired by ancient milk-and-honey beauty rituals."
  },
  "578": {
    name: "Golden Women Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Bergamot", "Pink Pepper", "Mandarin"],
      heart: ["Damask Rose", "Jasmine", "Ylang Ylang"],
      base:  ["Warm Amber", "Vanilla", "Feminine White Musk"]
    },
    description: "A radiant, warm-amber floral celebrating the multifaceted brilliance of womanhood. Ekora Bazaar Golden Women is a confident, sophisticated floral-oriental for women's perfumery applications, luxury candles, and premium home fragrance collections that honour feminine strength and grace."
  },
  "579": {
    name: "Iris Lime Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["Lime Zest", "Bergamot", "Lemon Verbena"],
      heart: ["Iris Root", "Violet", "Orris Butter"],
      base:  ["White Musk", "Cedarwood", "Soft Amber"]
    },
    description: "An unexpected, sophisticated pairing of tart lime with the powdery, carrot-like elegance of iris root — modern, fresh, and unmistakably refined. Ekora Bazaar Iris Lime is a unique choice for contemporary candles, minimalist reed diffusers, and premium home fragrance seeking an artfully unconventional freshness."
  },
  "580": {
    name: "Lavender Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: false },
    fragranceNotes: {
      top:   ["French Lavender", "Bergamot", "Rosemary"],
      heart: ["Lavender Heart", "Clary Sage", "Soft Floral"],
      base:  ["White Musk", "Light Cedarwood", "Coumarin"]
    },
    description: "The timeless, universally beloved fragrance of pure French lavender fields in full bloom — calming, clean, and effortlessly beautiful. Ekora Bazaar Lavender is the foundational floral for artisan soaps, soy candles, linen sprays, sleep mists, and wellness-inspired personal care collections."
  },
  "581": {
    name: "Diced Pineapple Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Fresh Pineapple", "Mango", "Citrus Zest"],
      heart: ["Coconut Water", "Passion Fruit", "Tropical Accord"],
      base:  ["White Musk", "Vanilla", "Light Tropical Wood"]
    },
    description: "The juicy, bright sweetness of freshly diced pineapple — tropical, vibrant, and instantly uplifting. Cold-process stable, Ekora Bazaar Diced Pineapple is a crowd-pleasing choice for summer artisan soaps, tropical candles, fruity wax melts, and fun home fragrance collections."
  },
  "582": {
    name: "Strawberry Lush Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Ripe Strawberry", "Raspberry", "Red Berry"],
      heart: ["Strawberry Cream", "White Jasmine", "Sweet Floral"],
      base:  ["White Musk", "Warm Vanilla", "Soft Amber"]
    },
    description: "A lusciously indulgent strawberry fragrance with the richness of strawberry cream and warm vanilla — sweet, vibrant, and irresistible. Cold-process stable, Ekora Bazaar Strawberry Lush is outstanding for artisan soaps, dessert candles, fruity wax melts, and premium berry-themed body care."
  },
  "583": {
    name: "Cherry Blossom Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Cherry Blossom", "Yuzu", "Fresh Peach"],
      heart: ["Sakura", "White Peony", "Soft Magnolia"],
      base:  ["White Musk", "Sandalwood", "Light Vanilla"]
    },
    description: "A delicate, ephemeral celebration of sakura season — soft, feminine, and breathtakingly beautiful in its fleeting freshness. Cold-process stable, Ekora Bazaar Cherry Blossom is a perennial favourite for spring artisan soaps, feminine candles, blossom-themed wax melts, and premium body care collections."
  },
  "584": {
    name: "Orchid Bouquet Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["White Orchid", "Bergamot", "Fresh Citrus"],
      heart: ["Orchid Heart", "White Jasmine", "Soft Lily"],
      base:  ["White Musk", "Sandalwood", "Light Amber"]
    },
    description: "An elegant, exotic floral capturing the rare beauty of a white orchid bouquet in full, luminous bloom. Cold-process stable, Ekora Bazaar Orchid Bouquet is a sophisticated choice for premium artisan soaps, luxury candles, floral wax melts, and feminine body care collections of exceptional refinement."
  },
  "585": {
    name: "Roasted Coffee Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Dark Roasted Espresso", "Freshly Ground Coffee", "Bitter Cocoa"],
      heart: ["Hazelnut", "Caramel Latte", "Rich Mocha"],
      base:  ["Dark Vanilla", "Warm Musk", "Sandalwood"]
    },
    description: "The deep, roasted intensity of a master barista's finest espresso — rich, dark, and endlessly captivating. Cold-process stable, Ekora Bazaar Roasted Coffee is a powerhouse for artisan coffee-shop candles, gourmand soaps, warm wax melts, and home fragrance collections with bold, comforting character."
  },
  "586": {
    name: "Musk Gold Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Golden Amber", "Bergamot", "Warm Spice"],
      heart: ["Soft Jasmine", "White Rose", "Powder Accord"],
      base:  ["Gold Musk", "Sandalwood", "Rich Vanilla"]
    },
    description: "A warm, opulent golden musk of exceptional richness — simultaneously intimate and radiant, like sun-warmed skin dusted with gold. Cold-process stable, Ekora Bazaar Musk Gold is a premium choice for artisan soaps, luxury candles, skin-safe body care, and fine musk-forward fragrance blends."
  },
  "587": {
    name: "Jasmine Knight Fragrance Oil",
    filters: { skinSafe: true, cpStable: true, candle: true },
    fragranceNotes: {
      top:   ["Night Jasmine (Parijat)", "Bergamot", "Dark Citrus"],
      heart: ["White Jasmine Absolute", "Tuberose", "Gardenia"],
      base:  ["White Musk", "Sandalwood", "Warm Amber"]
    },
    description: "A nocturnal white floral of dramatic intensity — the intoxicating bloom of night jasmine captured at midnight, deep and unforgettable. Cold-process stable, Ekora Bazaar Jasmine Knight is a distinguished choice for luxury artisan soaps, evening-inspired candles, and premium home fragrance that transforms night into magic."
  },
  "588": {
    name: "Fresh Oudh Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Fresh Bergamot", "Citrus Accord", "Light Pepper"],
      heart: ["Oud Accord", "Rose", "Clean Wood"],
      base:  ["Dark Amber", "White Musk", "Sandalwood"]
    },
    description: "A contemporary, fresh-meets-oriental oud that balances the ancient depth of agarwood with the brightness of citrus and bergamot. Ekora Bazaar Fresh Oudh is a modern, accessible oud for luxury candles, premium reed diffusers, and home fragrance seeking the prestige of oud without heaviness."
  },
  "589": {
    name: "Cactus Blossom Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Cactus Flower", "Mandarin", "Fresh Citrus"],
      heart: ["Desert Agave", "Water Lily", "White Jasmine"],
      base:  ["White Musk", "Driftwood", "Light Amber"]
    },
    description: "The unexpected, luminous beauty of a desert cactus in full bloom — fresh, watery, and exquisitely delicate against an arid backdrop. Ekora Bazaar Cactus Blossom is a unique, modern choice for nature-inspired candles, minimalist reed diffusers, and contemporary home fragrance with desert chic appeal."
  },
  "590": {
    name: "Midnight Blue Citrus Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Bergamot", "Blood Orange", "Pink Grapefruit"],
      heart: ["Night Jasmine", "Violet", "Blue Accord"],
      base:  ["Dark Musk", "Cedarwood", "Deep Amber"]
    },
    description: "A dramatic, nocturnal citrus fragrance that pairs the brightness of blood orange with the mysterious depth of a midnight floral accord. Ekora Bazaar Midnight Blue Citrus is a striking choice for sophisticated luxury candles, premium reed diffusers, and distinguished home fragrance collections with bold, unexpected character."
  },
  "591": {
    name: "Butterfly Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Floral Burst", "White Peach", "Raspberry"],
      heart: ["Butterfly Bush", "White Jasmine", "Soft Lily"],
      base:  ["White Musk", "Sandalwood", "Light Vanilla"]
    },
    description: "A light, free-spirited floral-fruity fragrance as delicate and uplifting as a butterfly in a summer garden. Ekora Bazaar Butterfly is a beautiful choice for feminine luxury candles, spring room fragrance, and garden-inspired home fragrance collections evoking the pure joy of warm, flower-filled days."
  },
  "592": {
    name: "Temple Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Sacred Incense", "Marigold", "Camphor"],
      heart: ["White Jasmine", "Damask Rose", "Holy Smoke"],
      base:  ["Oud", "Warm Amber", "Dark Patchouli"]
    },
    description: "The deeply evocative, spiritually grounding fragrance of an ancient Indian temple — sacred incense, marigold garlands, and holy offerings. Ekora Bazaar Temple is an extraordinary choice for devotional candles, puja-inspired home fragrance, and meditation spaces seeking genuine spiritual atmosphere."
  },
  "593": {
    name: "Rose Candle Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Fresh Rose Petals", "Bergamot", "Pink Citrus"],
      heart: ["Damask Rose", "Soft Geranium", "Violet"],
      base:  ["White Musk", "Sandalwood", "Light Amber"]
    },
    description: "A classic, beautifully balanced rose fragrance engineered specifically for exceptional candle performance — with superior hot throw and excellent wax compatibility. Ekora Bazaar Rose is the definitive floral candle fragrance, ideal for soy and paraffin candle makers seeking a timeless, premium rose experience."
  },
  "594": {
    name: "Mulberry Vanilla Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Wild Mulberry", "Dark Blackberry", "Plum"],
      heart: ["Vanilla Orchid", "Soft Jasmine", "Sweet Floral"],
      base:  ["Rich Vanilla", "White Musk", "Warm Sandalwood"]
    },
    description: "A lusciously dark berry fragrance warmed by the sweet creaminess of vanilla bean — indulgent, romantic, and deeply comforting. Ekora Bazaar Mulberry Vanilla is an outstanding performer in luxury soy candles and wax melts, delivering rich, berry-sweet warmth with excellent hot and cold throw."
  },
  "595": {
    name: "Lavender Florence Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Florentine Lavender", "Bergamot", "Fresh Herbs"],
      heart: ["Lavender Heart", "Rose", "Soft Geranium"],
      base:  ["Cedarwood", "White Musk", "Golden Amber"]
    },
    description: "An Italian-inspired lavender of exceptional aromatic complexity — deeper and more floral than French lavender, with the sun-warmed richness of the Tuscan hillsides. Ekora Bazaar Lavender Florence is an outstanding candle fragrance with superior hot throw and enduring, sophisticated character."
  },
  "596": {
    name: "Vanilla Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Sweet Vanilla Bean", "Warm Tonka", "Caramel"],
      heart: ["Heliotrope", "Creamy Vanilla Heart", "Powder"],
      base:  ["White Musk", "Warm Sandalwood", "Benzoin"]
    },
    description: "The eternally comforting, deeply warm sweetness of pure vanilla bean — a fragrance that instantly transforms any space into a sanctuary of warmth. Ekora Bazaar Vanilla is the essential gourmand candle fragrance, a top performer in soy candles and wax melts with outstanding hot throw and universal appeal."
  },
  "597": {
    name: "Orange & Cinnamon Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Sweet Orange", "Cinnamon Bark", "Mandarin"],
      heart: ["Clove Bud", "Nutmeg", "Orange Blossom"],
      base:  ["Vanilla", "Warm Amber", "Sandalwood"]
    },
    description: "A vibrant, festive blend of juicy sweet orange and warming cinnamon — the ultimate winter candle fragrance. Ekora Bazaar Orange & Cinnamon delivers joyful, spiced citrus warmth with powerful hot throw in soy and paraffin candles, wax melts, and seasonal home fragrance collections."
  },
  "598": {
    name: "Clean Ocean Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Sea Salt", "Ozone Accord", "Citrus Freshness"],
      heart: ["Aquatic Accord", "Driftwood", "White Floral"],
      base:  ["White Musk", "Light Cedarwood", "Clean Amber"]
    },
    description: "The pristine, bracing freshness of a clean ocean horizon — pure, airy, and endlessly invigorating. Ekora Bazaar Clean Ocean is a premium candle-grade aquatic fragrance with excellent hot throw, ideal for coastal-inspired luxury soy candles, reed diffusers, and refreshing home fragrance collections."
  },
  "599": {
    name: "Bubble Gum Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Strawberry", "Raspberry", "Cotton Candy"],
      heart: ["Classic Bubble Gum", "Sweet Floral", "Fruity Accord"],
      base:  ["White Musk", "Warm Vanilla", "Light Sugar"]
    },
    description: "A fun, nostalgic, and irresistibly sweet bubble gum fragrance that brings the joy of childhood right into your creative products. Ekora Bazaar Bubble Gum is a playful candle and wax melt favourite, delivering vibrant, sweet-fruity warmth with outstanding hot throw and instant crowd-pleasing appeal."
  },
  "600": {
    name: "New Aqua Fresh Fragrance Oil",
    filters: { skinSafe: false, cpStable: false, candle: true },
    fragranceNotes: {
      top:   ["Fresh Bergamot", "Citrus Zest", "Clean Ozone"],
      heart: ["Aquatic Accord", "White Jasmine", "Spearmint"],
      base:  ["White Musk", "Driftwood", "Light Amber"]
    },
    description: "An energising, ultra-fresh aquatic fragrance with the clean vitality of a new day — bright, airy, and endlessly refreshing. Ekora Bazaar New Aqua Fresh is an outstanding candle-grade fragrance with superior cold and hot throw, perfect for refreshing spring candles, clean-inspired wax melts, and invigorating reed diffusers."
  }
};

// ─── Brand removal helper ─────────────────────────────────────────────────────
const BRAND_TAGS = ['jindeal', 'vedini', 'vedini\'s', 'jindeal.com'];

function cleanTags(tags) {
  if (!Array.isArray(tags)) return tags;
  return tags
    .filter(t => !BRAND_TAGS.includes(t.toLowerCase().trim()))
    .concat(['ekora bazaar', 'fragrance oil', 'ekora wholesale']);
}

// ─── Main update routine ──────────────────────────────────────────────────────
console.log('📦 Loading products.json...');
const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
let updatedCount = 0;

const updated = products.map(product => {
  const update = UPDATES[String(product.id)];
  if (!update) return product; // Not a fragrance oil we're targeting

  updatedCount++;

  return {
    ...product,
    name: update.name,
    description: update.description,
    tags: cleanTags(product.tags || []),
    filters: update.filters,
    fragranceNotes: update.fragranceNotes,
    usageLevels: USAGE_LEVELS,
  };
});

// ─── Write back ───────────────────────────────────────────────────────────────
console.log(`✏️  Updating ${updatedCount} fragrance oil products...`);
fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(updated, null, 2), 'utf8');
console.log(`✅  Done! ${updatedCount} products updated in products.json`);

// ─── Verification: check for brand strings in updated FO products ─────────────
console.log('\n🔍 Running brand-name audit on updated products...');
let brandViolations = 0;
updated
  .filter(p => UPDATES[String(p.id)])
  .forEach(p => {
    const dump = JSON.stringify(p).toLowerCase();
    if (dump.includes('jindeal') || dump.includes('vedini')) {
      console.error(`  ❌ Brand string found in product ID ${p.id}: ${p.name}`);
      brandViolations++;
    }
  });

if (brandViolations === 0) {
  console.log('  ✅ No brand violations found in fragrance oil products.');
} else {
  console.error(`  ❌ ${brandViolations} products still contain old brand strings!`);
  process.exit(1);
}

console.log('\n🎉 Update complete. Run `npm run dev` to verify locally.');

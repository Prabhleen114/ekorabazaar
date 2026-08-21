import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, max: 1 });

const categoryRules = [
  // Fragrances & Oils
  { id: "Fragrance Oils", keywords: ["fragrance oil", "perfume", "aroma diffuser", "diffuser bottle", "fragrance"] },
  { id: "Essential Oils", keywords: ["essential oil", "pure oil", "natural oil"] },
  { id: "Food Safe Flavour Oil", keywords: ["flavour oil", "candy", "lip balm", "bakery flavour"] },
  
  // Waxes & Bases
  { id: "Premium Bases & Waxes", keywords: ["wax", "paraffin", "soy wax", "beeswax", "soap base", "melt and pour", "melt & pour"] },
  
  // Botanicals
  { id: "DRY FLOWERS", keywords: ["dry flower", "dried petal", "botanical"] },
  { id: "Hydrosols", keywords: ["hydrosol", "floral water"] },
  
  // Accessories & Pigments
  { id: "Pigments & Colors", keywords: ["pigment", "mica", "color", "colour", "dye"] },
  { id: "Candle Making Accessories", keywords: ["wick", "sustainer", "thermometer", "pouring pitcher", "candle tool"] },
  
  // Containers
  { id: "Containers & Packaging", keywords: ["tin", "jar", "packaging", "box", "bottle", "container"] },
  
  // Moulds (Specific)
  { id: "Culinary & Fondant Moulds", keywords: ["fondant", "baking", "cake", "chocolate", "culinary"] },
  { id: "Candle & Pillar Moulds", keywords: ["candle", "pillar"] },
  { id: "Eco-Resin & Stone Moulds", keywords: ["concrete", "tray", "coaster", "dish", "resin", "planter", "jesmonite"] },
  { id: "Soap & Bar Moulds", keywords: ["soap", "bar mould", "massage bar"] },
];

async function main() {
  const { rows: products } = await pool.query('SELECT id, title, category FROM "Product"');
  
  let updated = 0;
  
  for (const p of products) {
    const t = p.title.toLowerCase();
    let newCategory = null;
    
    // Check specific rules first
    for (const rule of categoryRules) {
      if (rule.keywords.some(kw => t.includes(kw))) {
        newCategory = rule.id;
        break;
      }
    }
    
    // Fallback to General if no specific match
    if (!newCategory) {
      newCategory = "General Silicone Moulds";
    }
    
    if (p.category !== newCategory) {
      await pool.query('UPDATE "Product" SET category = $1 WHERE id = $2', [newCategory, p.id]);
      updated++;
    }
  }
  
  console.log(`Finished updating ${updated} products categories.`);
  
  // Show counts
  const { rows: counts } = await pool.query('SELECT category, count(*) FROM "Product" GROUP BY category ORDER BY count DESC');
  console.log("New DB Categories:");
  console.table(counts);
  
  pool.end();
}

main().catch(e => { console.error(e); pool.end(); });

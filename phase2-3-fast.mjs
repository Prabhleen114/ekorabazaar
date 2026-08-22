import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

function classify(title, desc) {
  const t = (title || '').toUpperCase();
  const isBottle = t.match(/\b(BOTTLE|JAR|TIN|CONTAINER|SPRAY PUMP|DROPPER|CUP)\b/);
  const isMould = t.match(/\b(MOLD|MOULD|MOLDS|MOULDS)\b/);
  const isOil = t.match(/\b(OIL|F O|ESSENTIAL OIL)\b/);
  const isWax = t.match(/\b(WAX|SOAP BASE|BASE|MELT & POUR)\b/);
  const isUtensil = t.match(/\b(SPOON|BAG|THERMOMETER|TOOL|STICKER)\b/);
  const isColor = t.match(/\b(PIGMENT|COLOR|DYE|MICA|LIQUID COLOR)\b/);
  const isWick = t.match(/\b(WICK|SUSTAINER)\b/);
  
  const isFragrance = t.match(/\b(FRAGRANCE|F O|PERFUME)\b/);
  const isEssential = t.match(/\b(ESSENTIAL|ESSENTIAL OIL)\b/);
  const isFlavour = t.match(/\b(FLAVOUR|FLAVOR|FLAVOUR OIL)\b/);
  const isHydrosol = t.match(/\b(HYDROSOL|HYDROSOL WATER)\b/);

  const isCandle = t.match(/\b(CANDLE|PILLAR)\b/);
  const isSoap = t.match(/\b(SOAP|BATH BOMB)\b/);
  const isResin = t.match(/\b(RESIN|CONCRETE|JESMONITE|TRAY|COASTER)\b/);
  const isCulinary = t.match(/\b(CHOCOLATE|FONDANT|CAKE|BAKING)\b/);

  if (isBottle) return { category: 'Containers & Packaging', conf: 'HIGH', type: 'Bottle/Container' };
  if (isColor) return { category: 'Pigments & Colors', conf: 'HIGH', type: 'Pigment/Color' };
  if (isWax) return { category: 'Premium Bases & Waxes', conf: 'HIGH', type: 'Wax/Base' };
  
  if (isOil || isFragrance || isEssential || isFlavour || isHydrosol) {
    if (isEssential) return { category: 'Essential Oils', conf: 'HIGH', type: 'Essential Oil' };
    if (isFlavour) return { category: 'Food Safe Flavour Oil', conf: 'HIGH', type: 'Flavour Oil' };
    if (isHydrosol) return { category: 'Hydrosols', conf: 'HIGH', type: 'Hydrosol' };
    if (isFragrance || isOil) return { category: 'Fragrance Oils', conf: 'HIGH', type: 'Fragrance Oil' };
  }

  if (isMould) {
    if (isCulinary) return { category: 'Culinary & Fondant Moulds', conf: 'HIGH', type: 'Culinary Mould' };
    if (isSoap) return { category: 'Soap & Bar Moulds', conf: 'HIGH', type: 'Soap Mould' };
    if (isResin) return { category: 'Eco-Resin & Stone Moulds', conf: 'HIGH', type: 'Resin/Concrete Mould' };
    if (isCandle) return { category: 'Candle & Pillar Moulds', conf: 'HIGH', type: 'Candle Mould' };
    return { category: 'General Silicone Moulds', conf: 'HIGH', type: 'General Mould' };
  }
  
  if (isUtensil) return { category: 'Candle Making Accessories', conf: 'HIGH', type: 'Accessory/Tool' };
  if (isWick) return { category: 'Candle Making Accessories', conf: 'HIGH', type: 'Wick/Tool' };

  return { category: 'Uncategorized', conf: 'LOW', type: 'Unknown' };
}

async function run() {
  const result = await pool.query('SELECT id, title, description, category FROM "Product"');
  
  let highConfUpdates = 0;
  let valuesArr = [];
  
  for (const row of result.rows) {
    const { category, conf, type } = classify(row.title, row.description);
    let finalCat = row.category;
    let finalStatus = 'CLASSIFIED';
    
    if (conf === 'LOW') {
      finalStatus = 'NEEDS_REVIEW';
    } else {
      if (category !== row.category) highConfUpdates++;
      finalCat = category;
    }

    // Escape single quotes for SQL VALUES
    const id = row.id.replace(/'/g, "''");
    const cat = finalCat ? finalCat.replace(/'/g, "''") : "General Silicone Moulds";
    
    valuesArr.push(`('${id}', '${cat}', '${conf}'::"ClassificationConfidence", '${finalStatus}'::"ClassificationStatus")`);
  }

  console.log(`Executing bulk update. Expecting ${highConfUpdates} high-confidence category changes.`);
  
  const chunks = [];
  const chunkSize = 1000;
  for (let i=0; i<valuesArr.length; i+=chunkSize) {
    chunks.push(valuesArr.slice(i, i+chunkSize));
  }

  for (const chunk of chunks) {
    const query = `
      UPDATE "Product" AS p 
      SET 
        category = v.category,
        "classificationConfidence" = v.conf,
        "classificationStatus" = v.status
      FROM (VALUES ${chunk.join(', ')}) AS v(id, category, conf, status)
      WHERE p.id = v.id;
    `;
    await pool.query(query);
  }
  
  console.log("Done updating!");
  pool.end();
}

run().catch(console.error);

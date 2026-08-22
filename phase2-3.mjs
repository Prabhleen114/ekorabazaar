import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, max: 1 });

function classify(title, desc) {
  const t = (title || '').toUpperCase();
  
  // Product Types
  const isBottle = t.match(/\b(BOTTLE|JAR|TIN|CONTAINER|SPRAY PUMP|DROPPER|CUP)\b/);
  const isMould = t.match(/\b(MOLD|MOULD|MOLDS|MOULDS)\b/);
  const isOil = t.match(/\b(OIL|F O|ESSENTIAL OIL)\b/);
  const isWax = t.match(/\b(WAX|SOAP BASE|BASE|MELT & POUR)\b/);
  const isUtensil = t.match(/\b(SPOON|BAG|THERMOMETER|TOOL|STICKER)\b/);
  const isColor = t.match(/\b(PIGMENT|COLOR|DYE|MICA|LIQUID COLOR)\b/);
  const isWick = t.match(/\b(WICK|SUSTAINER)\b/);
  
  // Scents
  const isFragrance = t.match(/\b(FRAGRANCE|F O|PERFUME)\b/);
  const isEssential = t.match(/\b(ESSENTIAL|ESSENTIAL OIL)\b/);
  const isFlavour = t.match(/\b(FLAVOUR|FLAVOR|FLAVOUR OIL)\b/);
  const isHydrosol = t.match(/\b(HYDROSOL|HYDROSOL WATER)\b/);

  // Mould Uses
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
  
  const updates = [];
  const backups = [];
  const lowConfGroups = {};
  
  let highConfUpdates = 0;
  
  for (const row of result.rows) {
    const { category, conf, type } = classify(row.title, row.description);
    
    // Group LOW confidence
    if (conf === 'LOW') {
      const words = row.title.toUpperCase().split(/[^A-Z]+/);
      let matchedType = 'Misc';
      if (words.includes('PRESERVATIVE') || words.includes('SERUM') || words.includes('EMULSIFIER')) matchedType = 'Cosmetic Ingredients';
      if (words.includes('POWDER') || words.includes('CLAY')) matchedType = 'Clays/Powders';
      if (words.includes('INDUCTION') || words.includes('COOKTOP')) matchedType = 'Appliances';
      
      lowConfGroups[matchedType] = (lowConfGroups[matchedType] || 0) + 1;
      
      updates.push({
        id: row.id,
        newCat: row.category, // Keep existing category
        conf: 'LOW',
        status: 'NEEDS_REVIEW'
      });
      continue;
    }
    
    // High confidence logic
    if (category !== row.category) {
      highConfUpdates++;
      backups.push(`${row.id},"${row.category}","${category}","${conf}","Matched type ${type}"`);
      updates.push({
        id: row.id,
        newCat: category,
        conf: 'HIGH',
        status: 'CLASSIFIED'
      });
    } else {
      updates.push({
        id: row.id,
        newCat: row.category,
        conf: 'HIGH',
        status: 'CLASSIFIED'
      });
    }
  }

  console.log("Low Confidence Groupings:");
  for (const [k, v] of Object.entries(lowConfGroups).sort((a,b) => b[1] - a[1])) {
    console.log(`- ${k}: ${v}`);
  }
  
  fs.writeFileSync('classification_backup.csv', 'id,old_category,proposed_category,confidence,reason\n' + backups.join('\n'));
  console.log(`Created backup of ${highConfUpdates} high-confidence changes.`);
  
  // Actually execute the updates
  let done = 0;
  console.log("Updating database...");
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100);
    // Since we need to update category, classificationConfidence, classificationStatus
    // we do it one by one or in a single transaction. We'll do parallel promises for simplicity.
    await Promise.all(batch.map(u => 
      pool.query(
        'UPDATE "Product" SET category = $1, "classificationConfidence" = $2, "classificationStatus" = $3 WHERE id = $4',
        [u.newCat, u.conf, u.status, u.id]
      )
    ));
    done += batch.length;
    console.log(`Updated ${done} / ${updates.length}`);
  }

  pool.end();
}

run().catch(console.error);

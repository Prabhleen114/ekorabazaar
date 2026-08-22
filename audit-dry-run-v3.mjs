import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, max: 1 });
const publicDir = "d:\\ekora tech\\ekorabazaar\\public";

async function checkUrl(url) {
  if (!url || url === '/og-image.jpg' || url.trim() === '') return 'MISSING';
  
  if (url.startsWith('http')) {
    if (url.includes('images.unsplash.com')) return 'SUSPICIOUS';
    return 'WORKING'; 
  }
  
  if (url.startsWith('/')) {
    const localPath = path.join(publicDir, url);
    if (fs.existsSync(localPath)) {
      if (url.includes('_17873225')) return 'REPAIRED';
      return 'WORKING';
    }
    return 'BROKEN';
  }
  
  return 'BROKEN';
}

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
    return { category: 'General Silicone Moulds', conf: 'MEDIUM', type: 'General Mould' };
  }
  
  if (isUtensil) return { category: 'Candle Making Accessories', conf: 'MEDIUM', type: 'Accessory/Tool' };
  if (isWick) return { category: 'Candle Making Accessories', conf: 'HIGH', type: 'Wick/Tool' };

  return { category: 'Uncategorized', conf: 'LOW', type: 'Unknown' };
}

async function run() {
  const result = await pool.query('SELECT id, title, description, category, "imageUrl", status FROM "Product"');
  
  const images = { WORKING: 0, MISSING: 0, BROKEN: 0, SUSPICIOUS: 0, REPAIRED: 0 };
  const categories = {};
  const uncategorized = [];

  for (const row of result.rows) {
    const iStatus = await checkUrl(row.imageUrl);
    images[iStatus]++;
    
    const { category, conf, type } = classify(row.title, row.description);
    
    if (!categories[category]) categories[category] = { count: 0, samples: [] };
    categories[category].count++;
    if (categories[category].samples.length < 20) categories[category].samples.push(row.title);
    
    if (conf === 'LOW' || category === 'Uncategorized') {
      uncategorized.push({ title: row.title, type, existing: row.category });
    }
  }

  fs.writeFileSync('audit-v3.json', JSON.stringify({ images, categories, uncategorized: uncategorized.slice(0, 50), uncategorizedCount: uncategorized.length }, null, 2));
  pool.end();
}
run().catch(console.error);

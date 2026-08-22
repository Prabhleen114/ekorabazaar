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
    return 'WORKING'; // Assume working external for now, or check real fetch?
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
  const isBottle = t.includes('BOTTLE') || t.includes('JAR') || t.includes('TIN') || t.includes('CONTAINER') || t.includes('SPRAY PUMP') || t.includes('DROPPER');
  const isMould = t.includes('MOLD') || t.includes('MOULD');
  const isOil = t.includes('OIL');
  const isWax = t.includes('WAX') || t.includes('SOAP BASE') || t.includes('BASE');
  const isUtensil = t.includes('SPOON') || t.includes('BAG') || t.includes('THERMOMETER') || t.includes('TOOL');
  const isColor = t.includes('PIGMENT') || t.includes('COLOR') || t.includes('DYE') || t.includes('MICA');
  const isWick = t.includes('WICK') || t.includes('SUSTAINER');
  
  // Scents
  const isFragrance = t.includes('FRAGRANCE');
  const isEssential = t.includes('ESSENTIAL');
  const isFlavour = t.includes('FLAVOUR');
  const isHydrosol = t.includes('HYDROSOL');

  // Mould Uses
  const isCandle = t.includes('CANDLE') || t.includes('PILLAR');
  const isSoap = t.includes('SOAP') || t.includes('BATH BOMB');
  const isResin = t.includes('RESIN') || t.includes('CONCRETE') || t.includes('JESMONITE') || t.includes('TRAY') || t.includes('COASTER');
  const isCulinary = t.includes('CHOCOLATE') || t.includes('FONDANT') || t.includes('CAKE') || t.includes('BAKING');

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
  const lowConfidence = [];
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

  fs.writeFileSync('audit-v2.json', JSON.stringify({ images, categories, uncategorized: uncategorized.slice(0, 100), uncategorizedCount: uncategorized.length }, null, 2));
  pool.end();
}
run().catch(console.error);

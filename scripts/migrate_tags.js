/**
 * migrate_tags.js — One-time migration script
 * 
 * Transforms the existing products.json to use:
 *   - master_category: A clean, human-readable top-level grouping
 *   - tags: Meaningful, filterable attribute tags (NOT SEO keywords)
 * 
 * The old SEO-style tags are preserved in a separate "seoKeywords" field.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../src/lib/data/products.json');

// ── Master Category Mapping ────────────────────────────────────────
// Maps the raw category strings to clean master_category values
const MASTER_CAT_MAP = {
  'ESSENTIAL OIL': 'Essential Oils',
  'ESSENTIAL OILS': 'Essential Oils',
  'FRAGRANCE OIL': 'Fragrance Oils',
  'FRAGRANCE OILS': 'Fragrance Oils',
  'BULK FRAGRANCE OILS': 'Fragrance Oils',
  'CANDLE FRAGRANCE OILS': 'Fragrance Oils',
  'FINE FRAGRANCE INGREDIENTS (PREMIUM PERFUME RAW MATERIALS)': 'Fragrance Oils',
  'CARRIER OIL': 'Carrier Oils',
  'CARRIER OILS': 'Carrier Oils',
  'WAX': 'Waxes & Butters',
  'WAXES AND BUTTERS': 'Waxes & Butters',
  'BUTTER': 'Waxes & Butters',
  'BASES': 'Bases & Ingredients',
  'MELT AND POUR SOAP BASE': 'Bases & Ingredients',
  'LIQUID & CREAM BASE': 'Bases & Ingredients',
  'PRESERVATIVE & BULK INGREDIENTS': 'Bases & Ingredients',
  'CLAY POWDERS': 'Bases & Ingredients',
  'CANDLE MOLD': 'Molds & Tools',
  'MOLDS': 'Molds & Tools',
  'FONDANT MOLDS': 'Molds & Tools',
  'CHOCOLATE MOULD': 'Molds & Tools',
  'TUBE & LOAF MOLD': 'Molds & Tools',
  'CONCRETE MOLDS & MATERIALS': 'Molds & Tools',
  'RESIN MOLD & MATERIAL': 'Molds & Tools',
  'DIY TOOLS': 'Molds & Tools',
  'COSMETIC LIQUID COLORS & MICA POWDER': 'Colors & Pigments',
  'DRY FLOWERS': 'Decoratives & Add-ins',
  'DIY ACCESSORIES & MISC SUPPLIES': 'Decoratives & Add-ins',
  'PACKAGING': 'Packaging',
  'PACKAGING MATERIALS': 'Packaging',
  'WOOD, GLASS, METAL URLIS & TEALIGHT CANDLE JAR': 'Containers & Vessels',
  'HANDMADE SOAPS': 'Finished Products',
  'HYDROSOL': 'Hydrosols & Floral Waters',
  'FRUIT FLAVOUR': 'Flavors',
  'OTHER': 'Other',
};

// ── Scent Family Heuristic Keywords ─────────────────────────────────
const SCENT_FAMILIES = {
  'Floral': ['rose', 'jasmine', 'frangipani', 'neroli', 'lavender', 'geranium', 'chamomile', 'ylang', 'lotus', 'magnolia', 'orchid', 'tuberose', 'lily', 'violet', 'hibiscus', 'peony'],
  'Citrus': ['lemon', 'orange', 'bergamot', 'lime', 'grapefruit', 'mandarin', 'citronella', 'tangerine', 'yuzu', 'pomelo'],
  'Woody': ['cedarwood', 'sandalwood', 'pine', 'rosewood', 'patchouli', 'vetiver', 'cypress', 'fir', 'oud', 'agarwood', 'teak', 'birch'],
  'Spicy': ['clove', 'cinnamon', 'pepper', 'nutmeg', 'cardamom', 'ginger', 'anise', 'coriander', 'cumin', 'turmeric', 'ajwain', 'ajowain', 'curry'],
  'Fresh & Herbal': ['tea tree', 'eucalyptus', 'thyme', 'oregano', 'basil', 'mint', 'peppermint', 'spearmint', 'rosemary', 'sage', 'lemongrass', 'camphor', 'dill', 'fennel', 'marjoram'],
  'Resinous': ['frankincense', 'myrrh', 'labdanum', 'benzoin', 'copal', 'elemi'],
  'Gourmand': ['vanilla', 'coffee', 'chocolate', 'caramel', 'honey', 'coconut', 'butter'],
  'Aquatic': ['ocean', 'sea', 'rain', 'water', 'breeze', 'aqua', 'marine'],
};

// ── Note Level Heuristic ────────────────────────────────────────────
const TOP_NOTES = ['citrus', 'lemon', 'orange', 'bergamot', 'lime', 'grapefruit', 'mandarin', 'mint', 'peppermint', 'spearmint', 'eucalyptus', 'lemongrass', 'ginger', 'basil'];
const BASE_NOTES = ['sandalwood', 'cedarwood', 'vetiver', 'patchouli', 'vanilla', 'frankincense', 'myrrh', 'oud', 'agarwood', 'labdanum', 'benzoin', 'musk', 'amber'];

// ── Application Safety ──────────────────────────────────────────────
function getApplicationTags(product) {
  const tags = [];
  const name = product.name.toLowerCase();
  const filters = product.filters || {};
  
  if (filters.skinSafe) tags.push('Skin Safe');
  if (filters.cpStable) tags.push('CP Stable');
  if (filters.candle) tags.push('Candle Grade');
  
  // Infer from usage levels if they exist
  if (product.usageLevels) {
    const levels = product.usageLevels;
    if (levels['Cold Process Soap']) tags.push('Soap Making');
    if (levels['Candles (Soy & Paraffin)'] || levels['Wax Melts & Tarts']) tags.push('Candle Making');
    if (levels['Fine Perfume (EDP)']) tags.push('Perfumery');
    if (levels['Reed Diffusers']) tags.push('Reed Diffusers');
    if (levels['Lotions & Creams']) tags.push('Body Care');
  }

  return [...new Set(tags)];
}

// ── Mold-Specific Tags ─────────────────────────────────────────────
function getMoldTags(name) {
  const tags = [];
  const n = name.toLowerCase();
  
  if (n.includes('silicone')) tags.push('Silicone Mold');
  if (n.includes('single cavity') || n.includes('single')) tags.push('Single Cavity');
  if (n.includes('multi') || n.includes('multiple') || n.includes('6 cavity') || n.includes('4 cavity')) tags.push('Multi Cavity');
  if (n.includes('3d')) tags.push('3D Mold');
  if (n.includes('candle')) tags.push('Candle Making');
  if (n.includes('soap')) tags.push('Soap Making');
  if (n.includes('resin')) tags.push('Resin Art');
  if (n.includes('concrete') || n.includes('cement')) tags.push('Concrete Craft');
  if (n.includes('chocolate') || n.includes('fondant') || n.includes('cake')) tags.push('Baking & Food');
  if (n.includes('tray') || n.includes('coaster')) tags.push('Home Décor');
  if (n.includes('flower') || n.includes('rose') || n.includes('leaf')) tags.push('Botanical Design');
  if (n.includes('geometric')) tags.push('Geometric');
  if (n.includes('tube') || n.includes('loaf')) tags.push('Tube & Loaf');
  
  return [...new Set(tags)];
}

// ── Wax/Base/Packaging Tags ─────────────────────────────────────────
function getWaxTags(name) {
  const tags = [];
  const n = name.toLowerCase();
  if (n.includes('soy')) tags.push('Soy Wax');
  if (n.includes('paraffin')) tags.push('Paraffin Wax');
  if (n.includes('beeswax') || n.includes('bee')) tags.push('Beeswax');
  if (n.includes('coconut')) tags.push('Coconut Wax');
  if (n.includes('palm')) tags.push('Palm Wax');
  if (n.includes('gel')) tags.push('Gel Wax');
  if (n.includes('pillar')) tags.push('Pillar Grade');
  if (n.includes('container')) tags.push('Container Grade');
  if (n.includes('shea')) tags.push('Shea Butter');
  if (n.includes('cocoa')) tags.push('Cocoa Butter');
  if (n.includes('mango')) tags.push('Mango Butter');
  return [...new Set(tags)];
}

// ── Main Migration ──────────────────────────────────────────────────
function main() {
  console.log('Reading products.json...');
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  
  let migrated = 0;
  
  products.forEach(p => {
    const rawCat = (p.category || '').toUpperCase().trim();
    
    // 1. Set master_category
    p.master_category = MASTER_CAT_MAP[rawCat] || 'Other';
    
    // 2. Preserve old tags as seoKeywords
    if (p.tags && p.tags.length > 0) {
      p.seoKeywords = [...p.tags];
    }
    
    // 3. Build new meaningful tags array
    const newTags = [];
    const name = p.name.toLowerCase();
    
    // ── Oil-specific tags (Essential & Fragrance) ──
    if (p.master_category === 'Essential Oils' || p.master_category === 'Fragrance Oils' || p.master_category === 'Carrier Oils') {
      
      // Scent Family
      for (const [family, keywords] of Object.entries(SCENT_FAMILIES)) {
        if (keywords.some(kw => name.includes(kw))) {
          newTags.push(family);
        }
      }
      
      // Note Level
      let noteLevel = 'Heart Note';
      if (TOP_NOTES.some(kw => name.includes(kw))) noteLevel = 'Top Note';
      if (BASE_NOTES.some(kw => name.includes(kw))) noteLevel = 'Base Note';
      newTags.push(noteLevel);
      
      // Blend detection
      if (name.includes('&') || name.includes('blend')) {
        newTags.push('Blend');
      } else {
        newTags.push('Single Origin');
      }
      
      // Application safety
      newTags.push(...getApplicationTags(p));
      
      // If it's an essential oil, add "Aromatherapy"
      if (p.master_category === 'Essential Oils') {
        newTags.push('Aromatherapy');
      }
    }
    
    // ── Mold tags ──
    if (p.master_category === 'Molds & Tools') {
      newTags.push(...getMoldTags(p.name));
    }
    
    // ── Wax/Butter tags ──
    if (p.master_category === 'Waxes & Butters') {
      newTags.push(...getWaxTags(p.name));
    }
    
    // ── Packaging tags ──
    if (p.master_category === 'Packaging') {
      if (name.includes('bottle')) newTags.push('Bottles');
      if (name.includes('jar')) newTags.push('Jars');
      if (name.includes('box')) newTags.push('Boxes');
      if (name.includes('label')) newTags.push('Labels');
      if (name.includes('tin')) newTags.push('Tins');
      if (name.includes('pouch') || name.includes('bag')) newTags.push('Pouches & Bags');
    }
    
    // ── Bases tags ──
    if (p.master_category === 'Bases & Ingredients') {
      if (name.includes('soap')) newTags.push('Soap Base');
      if (name.includes('shampoo')) newTags.push('Shampoo Base');
      if (name.includes('lotion') || name.includes('cream')) newTags.push('Lotion Base');
      if (name.includes('melt') || name.includes('pour')) newTags.push('Melt & Pour');
      if (name.includes('transparent') || name.includes('clear')) newTags.push('Transparent');
      if (name.includes('white') || name.includes('opaque')) newTags.push('Opaque');
      if (name.includes('goat') || name.includes('goatmilk')) newTags.push('Goat Milk');
      if (name.includes('glycerin')) newTags.push('Glycerin');
    }
    
    // Deduplicate
    p.tags = [...new Set(newTags)];
    migrated++;
  });
  
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  console.log(`✅ Migrated ${migrated} products to new tag schema.`);
  
  // Print summary
  const masterCats = {};
  products.forEach(p => {
    if (!masterCats[p.master_category]) masterCats[p.master_category] = { count: 0, sampleTags: new Set() };
    masterCats[p.master_category].count++;
    p.tags.forEach(t => masterCats[p.master_category].sampleTags.add(t));
  });
  
  console.log('\n── Master Category Summary ──');
  for (const [cat, info] of Object.entries(masterCats)) {
    console.log(`  ${cat}: ${info.count} products | Tags: [${[...info.sampleTags].slice(0, 8).join(', ')}${info.sampleTags.size > 8 ? '...' : ''}]`);
  }
}

main();

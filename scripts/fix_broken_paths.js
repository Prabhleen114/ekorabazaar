/**
 * fix_broken_paths.js — Fixes products pointing to deleted old-named files
 * by finding the correct ekora-bazaar-* or .webp file on disk.
 */
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../src/lib/data/products.json');
const IMAGES_ROOT = path.join(__dirname, '../public/images/products');

function getAllImages(dir, baseWebPath = '/images/products') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllImages(fullPath, `${baseWebPath}/${entry.name}`));
    } else if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name) && !entry.name.startsWith('Gemini')) {
      results.push({ 
        webPath: `${baseWebPath}/${entry.name}`,
        key: entry.name.replace(/\.(png|jpg|jpeg|webp)$/i, '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      });
    }
  }
  return results;
}

function extractCore(name) {
  return name
    .replace(/essential oil[s]?/gi, '')
    .replace(/fragrance oil[s]?/gi, '')
    .replace(/100%|pure|natural|undiluted|therapeutic|grade|steam|distilled|origin \w+|certified|organic|for skin.*|for hair.*/gi, '')
    .replace(/\(.*?\)/g, '')
    .replace(/–|-|,/g, ' ')
    .trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function main() {
  const images = getAllImages(IMAGES_ROOT);
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  
  let fixed = 0;
  
  for (const p of products) {
    if (!p.image || !p.image.startsWith('/')) continue;
    
    const filePath = path.join(__dirname, '..', 'public', p.image);
    if (fs.existsSync(filePath)) continue; // File exists, no fix needed
    
    // File is broken — find the right one
    const core = extractCore(p.name);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const img of images) {
      // Check if the core is in the image key or vice versa
      if (core.length >= 4 && img.key.length >= 4) {
        if (img.key.includes(core) || core.includes(img.key)) {
          const score = Math.min(core.length, img.key.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = img;
          }
        }
      }
    }
    
    // Also try with ekora-bazaar prefix
    for (const img of images) {
      const stripped = img.key.replace(/^ekorabazaar/, '');
      if (core.length >= 4 && stripped.length >= 4) {
        if (stripped.includes(core) || core.includes(stripped)) {
          const score = Math.min(core.length, stripped.length) + 1; // +1 bonus for SEO named
          if (score > bestScore) {
            bestScore = score;
            bestMatch = img;
          }
        }
      }
    }
    
    if (bestMatch) {
      console.log(`✅ FIXED [${p.id}] "${p.name}"`);
      console.log(`   OLD: ${p.image}`);
      console.log(`   NEW: ${bestMatch.webPath}`);
      p.image = bestMatch.webPath;
      fixed++;
    } else {
      console.log(`❌ STILL BROKEN [${p.id}] "${p.name}" (core: ${core})`);
    }
  }
  
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  console.log(`\nFixed ${fixed} broken paths.`);
}

main();

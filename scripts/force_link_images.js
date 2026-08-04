/**
 * force_link_images.js — EXPLICIT image path replacement.
 * 
 * 1. Scans ALL files in public/images/products/ (recursively)
 * 2. Builds a lookup map of filename -> web path
 * 3. For each product in products.json, attempts to match by name
 * 4. Overwrites the image field with the local path
 * 5. Logs EVERY mapping for manual verification
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../src/lib/data/products.json');
const IMAGES_ROOT = path.join(__dirname, '../public/images/products');

// ── Step 1: Build a complete map of all available image files ────────
function getAllImages(dir, baseWebPath = '/images/products') {
  const results = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subWebPath = `${baseWebPath}/${entry.name}`;
      Object.assign(results, getAllImages(fullPath, subWebPath));
    } else if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
      // Skip Gemini generated images (unmatched leftovers)
      if (entry.name.startsWith('Gemini_Generated_Image')) continue;
      
      const webPath = `${baseWebPath}/${entry.name}`;
      // Create multiple lookup keys for matching
      const baseName = entry.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
      const normalizedKey = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      results[normalizedKey] = { webPath, baseName, fullPath: fullPath };
    }
  }
  return results;
}

// ── Step 2: Extract core matching key from a product name ───────────
function getMatchKey(productName) {
  // Strip common suffixes like "Essential Oil", "Fragrance Oil", etc.
  let name = productName
    .replace(/\bessential\s*oil\b/gi, '')
    .replace(/\bfragrance\s*oil\b/gi, '')
    .replace(/\bcarrier\s*oil\b/gi, '')
    .replace(/\b100%\b/g, '')
    .replace(/\bpure\b/gi, '')
    .replace(/\bnatural\b/gi, '')
    .replace(/\bundiluted\b/gi, '')
    .replace(/\btherapeutic\s*grade\b/gi, '')
    .replace(/\bsteam\s*distilled\b/gi, '')
    .replace(/\borigin\s*\w+\b/gi, '')
    .replace(/\bcertified\s*organic\b/gi, '')
    .replace(/\bfor\s+skin\s+care.*$/gi, '')
    .replace(/\d+\s*ml\b/gi, '')
    .trim();
  
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ── Main ────────────────────────────────────────────────────────────
function main() {
  console.log('=== FORCE IMAGE PATH REPLACEMENT ===\n');
  
  // 1. Scan filesystem
  const imageMap = getAllImages(IMAGES_ROOT);
  const imageKeys = Object.keys(imageMap);
  console.log(`Found ${imageKeys.length} image files on disk.\n`);
  
  // 2. Load products
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  console.log(`Loaded ${products.length} products from database.\n`);
  
  let linked = 0;
  let skipped = 0;
  let alreadyLocal = 0;
  const log = [];
  const unmatched = [];

  for (const product of products) {
    const matchKey = getMatchKey(product.name);
    
    // Try exact key match first
    let match = imageMap[matchKey];
    
    // If no exact match, try substring matching (image key in product key or vice versa)
    if (!match) {
      for (const imgKey of imageKeys) {
        if (imgKey.length >= 4 && (matchKey.includes(imgKey) || imgKey.includes(matchKey))) {
          match = imageMap[imgKey];
          break;
        }
      }
    }

    // Try matching with ekora-bazaar prefix stripped
    if (!match) {
      for (const imgKey of imageKeys) {
        const stripped = imgKey.replace(/^ekorabazaar/, '');
        if (stripped.length >= 4 && (matchKey.includes(stripped) || stripped.includes(matchKey))) {
          match = imageMap[imgKey];
          break;
        }
      }
    }
    
    if (match) {
      const oldImage = product.image;
      product.image = match.webPath;
      
      if (oldImage === match.webPath) {
        alreadyLocal++;
      } else {
        linked++;
        log.push(`✅ [${product.id}] "${product.name}" -> ${match.webPath}`);
        if (oldImage) {
          log.push(`   (was: ${oldImage.substring(0, 80)}...)`);
        }
      }
    } else {
      skipped++;
      unmatched.push(`❌ [${product.id}] "${product.name}" (key: ${matchKey}) — NO LOCAL IMAGE`);
    }
  }
  
  // 3. Save updated JSON
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  
  // 4. Print full log
  console.log('=== SUCCESSFULLY LINKED ===');
  log.forEach(l => console.log(l));
  
  console.log('\n=== UNMATCHED (no local image found) ===');
  unmatched.forEach(u => console.log(u));
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`  Newly linked:    ${linked}`);
  console.log(`  Already correct: ${alreadyLocal}`);
  console.log(`  No local image:  ${skipped}`);
  console.log(`  Total products:  ${products.length}`);
}

main();

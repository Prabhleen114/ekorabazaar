const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const productsFile = path.join(rootDir, 'src/lib/data/products.json');
const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

const targetPhotoId = 'photo-1608528577891-eb055944f2e7';
const matchingItems = products.filter(p => (p.image && p.image.includes(targetPhotoId)) || (p.imageUrl && p.imageUrl.includes(targetPhotoId)));

console.log(`Total products in catalog: ${products.length}`);
console.log(`Products with Red Diamond cover (${targetPhotoId}): ${matchingItems.length}`);

// Normalizer
function norm(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// 1. Load output.json
let outputData = [];
try {
  outputData = JSON.parse(fs.readFileSync(path.join(rootDir, 'output.json'), 'utf8'));
  console.log(`Loaded output.json with ${outputData.length} records.`);
} catch (e) {
  console.log('Could not load output.json:', e.message);
}

// 2. Load shop 400 products jindeal.json
let jindealData = [];
try {
  jindealData = JSON.parse(fs.readFileSync(path.join(rootDir, 'shop 400 products jindeal.json'), 'utf8'));
  console.log(`Loaded shop 400 products jindeal.json with ${jindealData.length} records.`);
} catch (e) {
  console.log('Could not load jindeal:', e.message);
}

// 3. Load all soap-base-products-list files
const soapFiles = fs.readdirSync(rootDir).filter(f => f.startsWith('soap-base-products-list') && f.endsWith('.json'));
let soapData = [];
for (const sf of soapFiles) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(rootDir, sf), 'utf8'));
    soapData = soapData.concat(d);
  } catch (e) {}
}
console.log(`Loaded ${soapData.length} records from ${soapFiles.length} soap files.`);

// 4. Check local files in public/images/products
let localFiles = [];
try {
  localFiles = fs.readdirSync(path.join(rootDir, 'public/images/products'));
} catch (e) {}

const localFileMap = new Map();
localFiles.forEach(f => {
  const base = f.replace(/\.[^/.]+$/, '');
  localFileMap.set(norm(base), `/images/products/${f}`);
});

// Build lookup maps
const outputMap = new Map();
outputData.forEach(item => {
  const name = item.title || item.name || '';
  const img = item.image || item.imageUrl || item.img || '';
  if (name && img) outputMap.set(norm(name), { img, title: name });
});

const jindealMap = new Map();
jindealData.forEach(item => {
  const name = item["Product Name"] || item.title || item.name || '';
  const img = item["Main Image"] || item.image || '';
  if (name && img) jindealMap.set(norm(name), { img, title: name });
});

const soapMap = new Map();
soapData.forEach(item => {
  const name = item["Product Name"] || item.title || item.name || '';
  const img = item["Main Image"] || item.image || '';
  if (name && img) soapMap.set(norm(name), { img, title: name });
});

let foundExact = 0;
let foundFuzzy = 0;
let notFound = 0;

const results = [];

matchingItems.forEach(p => {
  const n = norm(p.name);
  let originalImage = null;
  let source = null;
  let matchedName = null;

  // 1. Local files exact
  if (localFileMap.has(n)) {
    originalImage = localFileMap.get(n);
    source = 'local_file_exact';
    matchedName = p.name;
    foundExact++;
  }
  // 2. output.json exact
  else if (outputMap.has(n)) {
    const m = outputMap.get(n);
    originalImage = m.img;
    source = 'output_json_exact';
    matchedName = m.title;
    foundExact++;
  }
  // 3. jindeal exact
  else if (jindealMap.has(n)) {
    const m = jindealMap.get(n);
    originalImage = m.img;
    source = 'jindeal_exact';
    matchedName = m.title;
    foundExact++;
  }
  // 4. soap exact
  else if (soapMap.has(n)) {
    const m = soapMap.get(n);
    originalImage = m.img;
    source = 'soap_json_exact';
    matchedName = m.title;
    foundExact++;
  }
  // 5. Fuzzy match in local files
  else {
    // Check local files fuzzy
    for (const [k, img] of localFileMap.entries()) {
      if (k.length > 5 && (n.includes(k) || k.includes(n))) {
        originalImage = img;
        source = 'local_file_fuzzy';
        matchedName = k;
        foundFuzzy++;
        break;
      }
    }
    // Check output.json fuzzy
    if (!originalImage) {
      for (const [k, item] of outputMap.entries()) {
        if (k.length > 8 && (n.includes(k) || k.includes(n))) {
          originalImage = item.img;
          source = 'output_json_fuzzy';
          matchedName = item.title;
          foundFuzzy++;
          break;
        }
      }
    }
    // Check jindeal fuzzy
    if (!originalImage) {
      for (const [k, item] of jindealMap.entries()) {
        if (k.length > 8 && (n.includes(k) || k.includes(n))) {
          originalImage = item.img;
          source = 'jindeal_fuzzy';
          matchedName = item.title;
          foundFuzzy++;
          break;
        }
      }
    }
    // Check soap fuzzy
    if (!originalImage) {
      for (const [k, item] of soapMap.entries()) {
        if (k.length > 8 && (n.includes(k) || k.includes(n))) {
          originalImage = item.img;
          source = 'soap_fuzzy';
          matchedName = item.title;
          foundFuzzy++;
          break;
        }
      }
    }
  }

  if (!originalImage) {
    notFound++;
  }

  results.push({
    id: p.id,
    name: p.name,
    category: p.category,
    currentImage: p.image,
    originalImage,
    source,
    matchedName
  });
});

console.log(`\nAudit Results for ${matchingItems.length} products with Red Diamond cover:`);
console.log(`  Found Exact Match: ${foundExact}`);
console.log(`  Found Fuzzy Match: ${foundFuzzy}`);
console.log(`  No Image Found in Local/Scraped datasets: ${notFound}`);

const reportPath = path.join(__dirname, 'matched_sources_result.json');
fs.writeFileSync(reportPath, JSON.stringify({
  totalMatching: matchingItems.length,
  foundExact,
  foundFuzzy,
  notFound,
  results
}, null, 2));

console.log(`Report written to ${reportPath}`);

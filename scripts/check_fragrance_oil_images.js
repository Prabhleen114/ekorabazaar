const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const products = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/lib/data/products.json'), 'utf8'));
const files = fs.readdirSync(path.join(rootDir, 'public/images/products'));

const fileMap = new Map();
files.forEach(f => {
  const base = f.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  fileMap.set(base, f);
});

// The 42 fragrance oils with unsplash
const foList = products.filter(p => p.category === 'Fragrance Oils' && p.image && p.image.includes('unsplash.com'));
console.log(`Auditing ${foList.length} fragrance oils with unsplash images...`);

const matched = [];
const unmatched = [];

foList.forEach(p => {
  // Normalize product name
  let cleanName = p.name
    .replace(/\b(Candle & Cosmetic|Candle|Cosmetic|F O|FO|F\.O\.|Skin Safe|Cold Process Stable)\b/gi, '')
    .trim();
  let key = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (fileMap.has(key)) {
    matched.push({ id: p.id, name: p.name, file: fileMap.get(key) });
  } else {
    // Check partial
    let partial = null;
    for (const [k, f] of fileMap.entries()) {
      if (k.length > 5 && (key.includes(k) || k.includes(key))) {
        partial = f;
        break;
      }
    }
    if (partial) {
      matched.push({ id: p.id, name: p.name, file: partial, partial: true });
    } else {
      unmatched.push({ id: p.id, name: p.name });
    }
  }
});

console.log(`Matched to local image: ${matched.length}`);
matched.forEach(m => console.log(`  [${m.id}] ${m.name} -> /images/products/${m.file} ${m.partial ? '(partial)' : ''}`));

console.log(`\nUnmatched: ${unmatched.length}`);
unmatched.forEach(u => console.log(`  [${u.id}] ${u.name}`));

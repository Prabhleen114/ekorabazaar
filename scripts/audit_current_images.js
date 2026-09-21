const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const products = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/lib/data/products.json'), 'utf8'));

console.log(`Total products in catalog: ${products.length}`);

const imageTypes = {
  localWebp: 0,
  localPngJpg: 0,
  jindeal: 0,
  matinimpex: 0,
  unsplash: 0,
  placeholderOgImage: 0,
  categoryBg: 0,
  other: 0,
  missing: 0
};

const suspiciousOrMissing = [];

products.forEach(p => {
  const img = p.image || p.imageUrl || '';
  if (!img) {
    imageTypes.missing++;
    suspiciousOrMissing.push({ id: p.id, name: p.name, category: p.category, reason: 'missing', image: img });
  } else if (img === '/og-image.jpg' || img.includes('placehold')) {
    imageTypes.placeholderOgImage++;
    suspiciousOrMissing.push({ id: p.id, name: p.name, category: p.category, reason: 'placeholder_og_image', image: img });
  } else if (img.includes('_bg.jpg') || img.includes('_bg.png')) {
    imageTypes.categoryBg++;
    suspiciousOrMissing.push({ id: p.id, name: p.name, category: p.category, reason: 'category_background_image', image: img });
  } else if (img.includes('images.unsplash.com')) {
    imageTypes.unsplash++;
    suspiciousOrMissing.push({ id: p.id, name: p.name, category: p.category, reason: 'unsplash_stock_photo', image: img });
  } else if (img.includes('jindeal.com')) {
    imageTypes.jindeal++;
  } else if (img.includes('matinimpex.com')) {
    imageTypes.matinimpex++;
  } else if (img.endsWith('.webp')) {
    imageTypes.localWebp++;
  } else if (img.endsWith('.png') || img.endsWith('.jpg') || img.endsWith('.jpeg')) {
    imageTypes.localPngJpg++;
  } else {
    imageTypes.other++;
    suspiciousOrMissing.push({ id: p.id, name: p.name, category: p.category, reason: 'other_unknown', image: img });
  }
});

console.log('=== Image Type Breakdown ===');
console.log(imageTypes);

console.log(`\nTotal products needing attention (missing/placeholder/category bg/unsplash): ${suspiciousOrMissing.length}`);

// Breakdown of suspicious by reason
const reasonCounts = {};
suspiciousOrMissing.forEach(item => {
  reasonCounts[item.reason] = (reasonCounts[item.reason] || 0) + 1;
});
console.log('Breakdown by reason:', reasonCounts);

// Save report
fs.writeFileSync(path.join(__dirname, 'current_image_audit.json'), JSON.stringify({
  total: products.length,
  breakdown: imageTypes,
  needsAttentionCount: suspiciousOrMissing.length,
  reasonCounts,
  items: suspiciousOrMissing
}, null, 2));

console.log('Report saved to scripts/current_image_audit.json');

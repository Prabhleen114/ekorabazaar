const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const products = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/lib/data/products.json'), 'utf8'));

const placeholderPatterns = [
  'base-bottle',
  'paintings',
  '_bg.',
  'og-image',
  'placehold',
  'unsplash.com',
  'jewelry.png',
  'pottery.png',
  'crochet.png',
  'candles.png',
  'resin_art.png',
  'home_decor.png'
];

const needsRealPhoto = [];

products.forEach(p => {
  const img = p.image || p.imageUrl || '';
  let isPlaceholder = false;
  let placeholderType = '';

  if (!img) {
    isPlaceholder = true;
    placeholderType = 'empty';
  } else {
    for (const pat of placeholderPatterns) {
      if (img.includes(pat)) {
        isPlaceholder = true;
        placeholderType = pat;
        break;
      }
    }
  }

  if (isPlaceholder) {
    needsRealPhoto.push({
      id: p.id,
      name: p.name,
      category: p.category,
      department: p.department,
      currentImage: img,
      placeholderType: placeholderType
    });
  }
});

console.log(`Total products in catalog: ${products.length}`);
console.log(`Total products with placeholder/stock/missing images: ${needsRealPhoto.length}`);

// Group by placeholderType
const byType = {};
needsRealPhoto.forEach(p => {
  byType[p.placeholderType] = (byType[p.placeholderType] || 0) + 1;
});
console.log('Breakdown by placeholder type:', byType);

// Group by category
const byCat = {};
needsRealPhoto.forEach(p => {
  byCat[p.category] = (byCat[p.category] || 0) + 1;
});
console.log('Breakdown by category:', byCat);

fs.writeFileSync(path.join(__dirname, 'all_products_needing_photos.json'), JSON.stringify({
  total: needsRealPhoto.length,
  byType,
  byCat,
  products: needsRealPhoto
}, null, 2));

console.log('Saved to scripts/all_products_needing_photos.json');

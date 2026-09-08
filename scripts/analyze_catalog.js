const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '../src/lib/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

console.log('Total products:', products.length);

const targetPhotoId = 'photo-1608528577891-eb055944f2e7';

const matching = products.filter(p => p.image && p.image.includes(targetPhotoId));
console.log('Products with target photo:', matching.length);

const otherUnsplash = products.filter(p => p.image && p.image.includes('images.unsplash.com') && !p.image.includes(targetPhotoId));
console.log('Products with other unsplash photo:', otherUnsplash.length);

const jindealImages = products.filter(p => p.image && p.image.includes('jindeal.com'));
console.log('Products with jindeal image:', jindealImages.length);

const localImages = products.filter(p => p.image && p.image.startsWith('/images/'));
console.log('Products with local image:', localImages.length);

const placeholderImages = products.filter(p => p.image && (p.image.includes('placehold') || p.image === '/og-image.jpg' || !p.image));
console.log('Products with placeholder/missing image:', placeholderImages.length);

const outSummary = {
  total: products.length,
  matchingCount: matching.length,
  matchingItems: matching.map(p => ({ id: p.id, name: p.name, category: p.category, image: p.image }))
};
fs.writeFileSync(path.join(__dirname, 'catalog_scan_result.json'), JSON.stringify(outSummary, null, 2));
console.log('Written to scripts/catalog_scan_result.json');

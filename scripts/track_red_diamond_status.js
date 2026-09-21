const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Get the list of products from commit 9fb4b73~1 (just before the remediation) that had the Red Diamond photo
const beforeJson = execSync('git show 9fb4b73~1:src/lib/data/products.json', { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024 });
const beforeProducts = JSON.parse(beforeJson);

const targetPhotoId = 'photo-1608528577891-eb055944f2e7';
const redDiamondProducts = beforeProducts.filter(p => (p.image && p.image.includes(targetPhotoId)) || (p.imageUrl && p.imageUrl.includes(targetPhotoId)));

console.log(`Products that had Red Diamond photo in 9fb4b73~1: ${redDiamondProducts.length}`);

// 2. Load current products.json
const currentProducts = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/data/products.json'), 'utf8'));
const currentMap = new Map();
currentProducts.forEach(p => currentMap.set(p.id, p));
const currentNameMap = new Map();
currentProducts.forEach(p => currentNameMap.set(p.name.toLowerCase().trim(), p));

let stillInCatalog = 0;
let removedFromCatalog = 0;
const currentStatusList = [];

redDiamondProducts.forEach(p => {
  const curr = currentMap.get(p.id) || currentNameMap.get(p.name.toLowerCase().trim());
  if (curr) {
    stillInCatalog++;
    currentStatusList.push({
      id: curr.id,
      name: curr.name,
      category: curr.category,
      currentImage: curr.image || curr.imageUrl,
      status: 'in_catalog'
    });
  } else {
    removedFromCatalog++;
    currentStatusList.push({
      id: p.id,
      name: p.name,
      category: p.category,
      originalRedImage: p.image,
      status: 'removed_or_deleted'
    });
  }
});

console.log(`Still in current catalog: ${stillInCatalog}`);
console.log(`Removed/deleted in current catalog: ${removedFromCatalog}`);

// Check image breakdown of the ones still in catalog
const imageBreakdown = {};
currentStatusList.filter(x => x.status === 'in_catalog').forEach(x => {
  let type = 'unknown';
  if (x.currentImage.includes('_bg.jpg')) type = 'category_bg_placeholder';
  else if (x.currentImage.includes('unsplash.com')) type = 'unsplash_photo';
  else if (x.currentImage.includes('jindeal.com')) type = 'jindeal_supplier';
  else if (x.currentImage.includes('matinimpex.com')) type = 'matinimpex_supplier';
  else if (x.currentImage.startsWith('/images/products/')) type = 'custom_local_image';
  else type = x.currentImage;
  imageBreakdown[type] = (imageBreakdown[type] || 0) + 1;
});

console.log('Current image breakdown for these products:\n', imageBreakdown);

fs.writeFileSync(path.join(__dirname, 'red_diamond_current_status.json'), JSON.stringify({
  totalRedDiamond: redDiamondProducts.length,
  stillInCatalog,
  removedFromCatalog,
  imageBreakdown,
  products: currentStatusList
}, null, 2));

console.log('Saved to scripts/red_diamond_current_status.json');

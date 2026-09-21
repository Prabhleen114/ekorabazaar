const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(path.join(__dirname, '../public/images/products')).sort();
console.log(`Total image files in public/images/products: ${files.length}`);
fs.writeFileSync(path.join(__dirname, 'all_local_images.txt'), files.join('\n'));
console.log('Saved to scripts/all_local_images.txt');

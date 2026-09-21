const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'current_image_audit.json'), 'utf8'));
const unsplashUrls = new Map();

data.items.forEach(item => {
  const url = item.image;
  unsplashUrls.set(url, (unsplashUrls.get(url) || 0) + 1);
});

console.log('Unique Unsplash / attention URLs:');
for (const [url, count] of unsplashUrls.entries()) {
  console.log(`  ${count}x : ${url}`);
}

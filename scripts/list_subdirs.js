const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../public/images/products');
const subdirs = ['essential oils', 'hydrosols', 'waxes', 'butters', 'scrubs'];

subdirs.forEach(sd => {
  const dirPath = path.join(baseDir, sd);
  if (fs.existsSync(dirPath)) {
    const fList = fs.readdirSync(dirPath);
    console.log(`\n=== ${sd} (${fList.length} files) ===`);
    console.log(fList.slice(0, 15).join(', '));
    if (fList.length > 15) console.log(`... and ${fList.length - 15} more`);
  }
});

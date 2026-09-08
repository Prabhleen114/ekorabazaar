const fs = require('fs');
const path = require('path');

const scanResult = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalog_scan_result.json'), 'utf8'));
const items = scanResult.matchingItems;

const byCategory = {};
const idRanges = [];

items.forEach(p => {
  byCategory[p.category] = (byCategory[p.category] || 0) + 1;
});

console.log('Category breakdown of matching products (221 total):');
for (const [cat, count] of Object.entries(byCategory)) {
  console.log(`  ${cat}: ${count}`);
}

// Find min and max id
const ids = items.map(p => parseInt(p.id, 10)).filter(n => !isNaN(n)).sort((a,b) => a - b);
console.log(`ID range: ${ids[0]} to ${ids[ids.length - 1]}`);

// Check if there are gaps or contiguous blocks
const idBlocks = [];
let blockStart = ids[0];
let prev = ids[0];
for (let i = 1; i < ids.length; i++) {
  if (ids[i] === prev + 1) {
    prev = ids[i];
  } else {
    idBlocks.push(`${blockStart}-${prev}`);
    blockStart = ids[i];
    prev = ids[i];
  }
}
idBlocks.push(`${blockStart}-${prev}`);
console.log('ID blocks:', idBlocks.join(', '));

const fs = require('fs');
const path = require('path');

const productsFile = path.join(__dirname, '../src/lib/data/products.json');
const csvFile = path.join(__dirname, '../products.csv');

const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
const fragranceOils = products.filter(p => p.category && p.category.toLowerCase().includes('fragrance oil'));

let csvContent = 'id,name,display_name\n';
fragranceOils.forEach(p => {
    // Strip tags like "(skin safe)" and "Fragrance Oil" for the display name
    let displayName = p.name.split(' (')[0].replace('Fragrance Oil', '').trim();
    // Wrap in quotes to avoid comma issues
    csvContent += `"${p.id}","${p.name}","${displayName}"\n`;
});

fs.writeFileSync(csvFile, csvContent);
console.log(`Created products.csv with ${fragranceOils.length} items.`);

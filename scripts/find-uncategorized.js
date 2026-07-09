const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Find all relevant JSON files
const files = fs.readdirSync(rootDir);
const originalFile = 'shop 400 products jindeal.json';
const soapFiles = files.filter(f => f.startsWith('soap-base-products-list') && f.endsWith('.json'));
const filesToRead = [originalFile, ...soapFiles].filter(f => files.includes(f));

let rawData = [];
for (const file of filesToRead) {
  const filePath = path.join(rootDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    rawData = rawData.concat(data);
  } catch (e) {}
}

const uniqueDataMap = new Map();
for (const item of rawData) {
  const name = item["Product Name"] || item["Title"] || item["name"];
  if (name && !uniqueDataMap.has(name.toLowerCase())) {
    uniqueDataMap.set(name.toLowerCase(), item);
  }
}
const deduplicatedData = Array.from(uniqueDataMap.values());

const uncategorizedItems = [];

for (const item of deduplicatedData) {
  const name = item["Product Name"] || item["Title"] || item["name"] || "Unnamed Product";
  let category = item["Category"] || item["category"];
  
  if (!category || category === "Uncategorized") {
    uncategorizedItems.push(name);
  }
}

fs.writeFileSync(path.join(__dirname, 'uncategorized.json'), JSON.stringify(uncategorizedItems, null, 2));
console.log(`Found ${uncategorizedItems.length} items without a category.`);

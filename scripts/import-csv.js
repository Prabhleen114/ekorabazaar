const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../clean_products.csv'); // We have it in artifact dir, but wait, the artifact is at C:\Users\krary\.gemini\antigravity\brain\...\clean_products.csv
const actualCsvPath = 'C:/Users/krary/.gemini/antigravity/brain/f6c1e214-c9a1-4546-bade-20e8d72820c7/clean_products.csv';
const jsonPath = path.join(__dirname, '../src/lib/data/products.json');

// 1. Read existing products
let existingProducts = [];
try {
  existingProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
} catch (e) {
  console.error("Error reading products.json", e);
  process.exit(1);
}

// 2. Map existing names (case-insensitive) for deduplication
const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase().trim()));

// Generate next available ID
let maxId = 0;
existingProducts.forEach(p => {
  const idNum = parseInt(p.id, 10);
  if (!isNaN(idNum) && idNum > maxId) {
    maxId = idNum;
  }
});
let nextId = maxId + 1;

// 3. Read and parse CSV
const csvData = fs.readFileSync(actualCsvPath, 'utf8');
const lines = csvData.split('\n').filter(l => l.trim().length > 0);
lines.shift(); // remove header: Title,Category,Subcategory,Tags

let importedCount = 0;

function parseCsvLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i+1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

const defaultImage = "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

for (const line of lines) {
  const [title, category, subcat, rawTags] = parseCsvLine(line);
  if (!title) continue;

  const key = title.toLowerCase();
  if (existingNames.has(key)) {
    console.log(`Skipping duplicate: ${title}`);
    continue;
  }

  // Create new product object matching schema
  const parsedTags = rawTags ? rawTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0) : [];
  
  // Add some default SEO/search tags
  const tags = [...new Set([...parsedTags, ...title.toLowerCase().split(' '), "wholesale", "bulk", "premium", subcat.toLowerCase(), category.toLowerCase()])];

  const newProduct = {
    id: nextId.toString(),
    name: title,
    category: subcat.toUpperCase(), // Using subcategory as the main category tag to match existing format
    description: `Premium quality ${title.toLowerCase()} sourced directly for creators. Perfect for your next creative project with batch-tested reliability.`,
    price: Math.floor(Math.random() * 500) + 100, // Placeholder realistic price
    bulkDiscountAvailable: true,
    maxDiscount: 15,
    image: defaultImage,
    tiers: [
      {
        minQty: 1,
        maxQty: 11,
        price: 250,
        discountPct: 0
      },
      {
        minQty: 12,
        maxQty: 51,
        price: 225,
        discountPct: 10
      },
      {
        minQty: 52,
        maxQty: null,
        price: 212,
        discountPct: 15
      }
    ],
    tags: tags
  };

  // Adjust placeholder tiers based on generated price
  newProduct.tiers[0].price = newProduct.price;
  newProduct.tiers[1].price = Math.floor(newProduct.price * 0.9);
  newProduct.tiers[2].price = Math.floor(newProduct.price * 0.85);

  existingProducts.push(newProduct);
  existingNames.add(key);
  nextId++;
  importedCount++;
}

// 4. Write back to products.json
fs.writeFileSync(jsonPath, JSON.stringify(existingProducts, null, 2), 'utf8');

console.log(`Successfully imported ${importedCount} new products!`);
console.log(`Total products in catalog: ${existingProducts.length}`);

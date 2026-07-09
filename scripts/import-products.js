const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outputDataDir = path.join(rootDir, 'src', 'lib', 'data');
const outputPath = path.join(outputDataDir, 'products.json');

// Ensure output directory exists
if (!fs.existsSync(outputDataDir)) {
  fs.mkdirSync(outputDataDir, { recursive: true });
}

// 1. Find all relevant JSON files
const files = fs.readdirSync(rootDir);
const originalFile = 'shop 400 products jindeal.json';
const soapFiles = files.filter(f => f.startsWith('soap-base-products-list') && f.endsWith('.json'));
const filesToRead = [originalFile, ...soapFiles].filter(f => files.includes(f));

console.log(`Found ${filesToRead.length} files to import.`);

// 2. Read and merge raw data
let rawData = [];
for (const file of filesToRead) {
  const filePath = path.join(rootDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    rawData = rawData.concat(data);
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}

// 3. Deduplicate by Product Name
const uniqueDataMap = new Map();
for (const item of rawData) {
  const name = item["Product Name"] || item["Title"] || item["name"];
  if (name && !uniqueDataMap.has(name.toLowerCase())) {
    uniqueDataMap.set(name.toLowerCase(), item);
  }
}
const deduplicatedData = Array.from(uniqueDataMap.values());

// Common keywords for wholesale and crafts
const baseKeywords = ["wholesale", "b2b", "bulk", "supplies", "raw materials", "india", "premium", "craft", "handmade", "artisan", "diy", "manufacturing", "manufacturer", "distributor", "vendor", "sourcing", "factory price", "discount", "cheap", "quality", "ekora", "jindeal", "eco-friendly", "natural", "organic", "pure", "essential", "maker", "creator", "small business"];

const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  // Handle formats like "₹35.00" or "₹1,235.00"
  const cleaned = String(priceStr).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const generateTags = (name, category) => {
  const nameWords = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
  const catWords = category.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
  
  // Combine unique tags, up to ~40-50 tags
  const tagsSet = new Set([...nameWords, ...catWords, ...baseKeywords]);
  return Array.from(tagsSet).slice(0, 50); // Will hit 30+ due to expanded baseKeywords
};

let currentId = 1;
const products = deduplicatedData.map((item) => {
  const name = item["Product Name"] || item["Title"] || item["name"] || "Unnamed Product";
  
  // Categorization fallback
  let category = item["Category"] || item["category"];
  if (!category || category === "Uncategorized") {
    if (name.toLowerCase().includes('soap') || name.toLowerCase().includes('base')) {
      category = "Soap Making";
    } else {
      category = "Uncategorized";
    }
  }
  
  const basePrice = parsePrice(item["Minimum Price"] || item["Price"] || item["Price Range"] || item["price"]);
  const maxPriceStr = item["Maximum Price"];
  const maxPrice = maxPriceStr ? parsePrice(maxPriceStr) : basePrice;

  // Price used for calculation is the minimum price
  const price = basePrice || maxPrice || 0;

  const isGlass = category.toLowerCase().includes('glass');

  let tiers = [];
  if (isGlass) {
    tiers = [
      { minQty: 1, maxQty: 11, price: price, discountPct: 0 },
      { minQty: 12, maxQty: 51, price: Math.round(price * 0.95 * 100) / 100, discountPct: 5 },
      { minQty: 52, maxQty: null, price: Math.round(price * 0.90 * 100) / 100, discountPct: 10 },
    ];
  } else {
    tiers = [
      { minQty: 1, maxQty: 9, price: price, discountPct: 0 },
      { minQty: 10, maxQty: 49, price: Math.round(price * 0.95 * 100) / 100, discountPct: 5 },
      { minQty: 50, maxQty: null, price: Math.round(price * 0.90 * 100) / 100, discountPct: 10 },
    ];
  }

  const tags = generateTags(name, category);
  
  // Try to use a placeholder image if it's missing, since mock images were expected.
  const image = item["Main Image"] || item["Image URL"] || item["image"] || "https://placehold.co/600x600/png?text=Product";

  return {
    id: String(currentId++),
    name: name,
    category: category,
    description: `Premium quality ${name.toLowerCase()} sourced directly for creators. Perfect for your next creative project with batch-tested reliability.`,
    price: price,
    bulkDiscountAvailable: true,
    maxDiscount: 10,
    image: image,
    tiers: tiers,
    tags: tags
  };
});

fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

console.log(`Successfully parsed and deduplicated ${products.length} products (from ${rawData.length} total rows) and saved to ${outputPath}`);

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'shop 400 products jindeal.json');
const outputDataDir = path.join(__dirname, '..', 'src', 'lib', 'data');
const outputPath = path.join(outputDataDir, 'products.json');

// Ensure output directory exists
if (!fs.existsSync(outputDataDir)) {
  fs.mkdirSync(outputDataDir, { recursive: true });
}

const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Common keywords for wholesale and crafts
const baseKeywords = ["wholesale", "b2b", "bulk", "supplies", "raw materials", "india", "premium", "craft", "handmade", "artisan"];

const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  // Handle formats like "₹35.00" or "₹1,235.00"
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned);
};

const generateTags = (name, category) => {
  const nameWords = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
  const catWords = category.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
  
  // Combine unique tags, up to ~40-50 tags
  const tagsSet = new Set([...nameWords, ...catWords, ...baseKeywords]);
  return Array.from(tagsSet).slice(0, 50);
};

const products = rawData.map((item, index) => {
  const name = item["Product Name"] || "Unnamed Product";
  const category = item["Category"] || "Uncategorized";
  
  const basePrice = parsePrice(item["Minimum Price"]);
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
  const image = item["Main Image"] || "https://placehold.co/600x600/png?text=Product";

  return {
    id: String(index + 1), // Using index + 1 as ID
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

console.log(`Successfully parsed ${products.length} products and saved to ${outputPath}`);

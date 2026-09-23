require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No connection string");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const countBefore = await prisma.product.count();
  console.log("Product count before:", countBefore);
  
  const products = await prisma.product.findMany();
  for (const product of products) {
    const newPrice = Math.round(product.price * 1.20);
    const newCustomerPrice = product.customerPrice ? Math.round(product.customerPrice * 1.20) : null;
    let newTiers = null;
    
    if (product.wholesaleTiers && Array.isArray(product.wholesaleTiers)) {
      newTiers = product.wholesaleTiers.map(t => ({
        ...t,
        price: Math.round((Number(t.price) || 0) * 1.20)
      }));
    } else if (typeof product.wholesaleTiers === 'string') {
      try {
        const parsed = JSON.parse(product.wholesaleTiers);
        if (Array.isArray(parsed)) {
          newTiers = parsed.map(t => ({
            ...t,
            price: Math.round((Number(t.price) || 0) * 1.20)
          }));
        }
      } catch (e) {}
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: newPrice,
        customerPrice: newCustomerPrice,
        wholesaleTiers: newTiers || product.wholesaleTiers
      }
    });
  }

  const countAfter = await prisma.product.count();
  console.log("Product count after:", countAfter);
  
  const jsonPath = 'src/lib/data/products.json';
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  for (const item of jsonData) {
    if (item.price != null) item.price = Math.round(item.price * 1.20);
    if (item.customerPrice != null) item.customerPrice = Math.round(item.customerPrice * 1.20);
    if (item.tiers && Array.isArray(item.tiers)) {
      item.tiers.forEach(t => {
        if (t.price != null) t.price = Math.round(Number(t.price) * 1.20);
      });
    }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
  console.log("Updated products.json");
  
  await prisma.$disconnect();
  process.exit(0);
}
run().catch(console.error);

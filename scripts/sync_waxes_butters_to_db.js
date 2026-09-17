const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const catalog = JSON.parse(fs.readFileSync('src/lib/data/products.json', 'utf-8'));
  const catalogMap = new Map();
  for (const p of catalog) {
    catalogMap.set(String(p.id), p);
  }

  // Get all products currently in PostgreSQL
  const dbProducts = await prisma.product.findMany({
    select: { id: true, title: true, imageUrl: true }
  });

  console.log(`Found ${dbProducts.length} total products in PostgreSQL database.`);
  let updatedInDb = 0;

  for (const dbP of dbProducts) {
    const catP = catalogMap.get(String(dbP.id));
    if (catP && (catP.category === 'Candle Waxes & Additives' || catP.category === 'Raw Butters & Carrier Oils')) {
      await prisma.product.update({
        where: { id: dbP.id },
        data: {
          title: catP.name,
          imageUrl: catP.image,
          description: catP.description,
          price: Math.round(catP.price * 100),
          customerPrice: Math.round(catP.price * 100),
          category: catP.category,
          wholesaleTiers: catP.tiers
        }
      });
      console.log(`Synced DB product ID ${dbP.id}: ${catP.name} -> ${catP.image}`);
      updatedInDb++;
    }
  }

  console.log(`Total wax/butter products synchronized to PostgreSQL: ${updatedInDb}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

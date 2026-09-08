const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const dbMatch = envContent.replace(/\r\n/g,'').replace(/\n/g,'').match(/DATABASE_URL="([^"]+)"/);
const connectionString = dbMatch[1];
const pool = new pg.Pool({ connectionString, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Creating pg_trgm extension and indexes...');
  await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
  
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS product_title_trgm_idx 
    ON "Product" USING GIN (title gin_trgm_ops);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS product_category_trgm_idx 
    ON "Product" USING GIN (category gin_trgm_ops);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS product_description_trgm_idx 
    ON "Product" USING GIN (description gin_trgm_ops);
  `);
  console.log('Indexes created successfully.');
}
main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const updated = await prisma.product.update({
    where: { id: '7' },
    data: {
      title: 'ECO CRAFT CASTING POWDER (NATURAL WHITE) - 98% PURITY, HEAVY METAL TESTED, COA CERTIFICATE AVAILABLE - SUPER FINE GRADE FOR JESMONITE, TRAYS, CANDLE JARS & PLANTERS',
      imageUrl: '/images/products/eco-craft-casting-powder.webp',
      description: 'Ekora Bazaar Eco Craft Casting Powder (Natural White) - Super Fine Grade engineered for superior stone casting, Jesmonite-style creations, decorative trays, candle vessels, planters, and architectural home decor. Formulated with 98% purity, thoroughly heavy metal tested, and accompanied by an official Certificate of Analysis (COA) available upon request. Features an ultra-fine particle distribution delivering an exceptionally smooth, porcelain-like satin finish with high impact resistance and rapid demolding strength. 100% non-toxic, eco-friendly, and batch-certified for professional artisans and studios.'
    }
  });

  console.log('Successfully updated product 7 in PostgreSQL Database:');
  console.log('ID:', updated.id);
  console.log('Title:', updated.title);
  console.log('ImageUrl:', updated.imageUrl);
}

main()
  .catch((e) => {
    console.error('Error updating DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

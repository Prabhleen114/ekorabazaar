import prisma from '../src/lib/db';
import dotenv from 'dotenv';
dotenv.config();

async function setup() {
  console.log('1. Creating partial unique index for single running crawl per supplier...');
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS crawlrun_one_running
      ON "CrawlRun"("supplierKey") WHERE status = 'RUNNING';
  `);

  console.log('2. Backfilling canonical 38 categories into Category table...');
  const categories = [
    { name: 'Eco-Resin & Stone Moulds', slug: 'eco-resin-stone-moulds' },
    { name: 'Culinary & Fondant Moulds', slug: 'culinary-fondant-moulds' },
    { name: 'General Silicone Moulds', slug: 'general-silicone-moulds' },
    { name: 'Candle & Pillar Moulds', slug: 'candle-pillar-moulds' },
    { name: 'Soap & Bar Moulds', slug: 'soap-bar-moulds' },
    { name: 'Candle Jars & Containers', slug: 'candle-jars-containers' },
    { name: 'Attar & Perfume Bottles', slug: 'attar-perfume-bottles' },
    { name: 'Cosmetic Jars & Bottles', slug: 'cosmetic-jars-bottles' },
    { name: 'Packaging Boxes & Mailers', slug: 'packaging-boxes-mailers' },
    { name: 'Lids, Caps & Closures', slug: 'lids-caps-closures' },
    { name: 'Metal Containers & Tins', slug: 'metal-containers-tins' },
    { name: 'Diffuser Bottles & Accessories', slug: 'diffuser-bottles-accessories' },
    { name: 'Studio Equipment', slug: 'studio-equipment' },
    { name: 'Soap Making Tools', slug: 'soap-making-tools' },
    { name: 'Wick Systems & Hardware', slug: 'wick-systems-hardware' },
    { name: 'Micas & Pigments', slug: 'micas-pigments' },
    { name: 'Essential Oils', slug: 'essential-oils' },
    { name: 'Fragrance Oils', slug: 'fragrance-oils' },
    { name: 'Candle Waxes & Additives', slug: 'candle-waxes-additives' },
    { name: 'Raw Butters & Carrier Oils', slug: 'raw-butters-carrier-oils' },
    { name: 'Skin Safe Fragrances', slug: 'skin-safe-fragrances' },
    { name: 'Hydrosols & Floral Waters', slug: 'hydrosols-floral-waters' },
    { name: 'Artisan Soap Bases', slug: 'artisan-soap-bases' },
    { name: 'Skincare & Body Bases', slug: 'skincare-body-bases' },
    { name: 'Cosmetic Preservatives & Chemicals', slug: 'cosmetic-preservatives-chemicals' },
    { name: 'Food-Grade Flavor Oils', slug: 'food-grade-flavor-oils' },
    { name: 'Body & Facial Scrubs', slug: 'body-facial-scrubs' },
    { name: 'Haircare & Wash Bases', slug: 'haircare-wash-bases' },
    { name: 'Dried Botanicals & Additives', slug: 'dried-botanicals-additives' },
    { name: 'Stickers & Labels', slug: 'stickers-labels' },
    { name: 'Gift Bags & Pouches', slug: 'gift-bags-pouches' },
    { name: 'Packaging & Containers', slug: 'packaging-containers' },
    { name: 'Silicone & Baking Molds', slug: 'silicone-baking-molds' },
    { name: 'Candle & Soap Making', slug: 'candle-soap-making' },
    { name: 'Resin & Concrete Craft', slug: 'resin-concrete-craft' },
    { name: 'Festive & Holiday Molds', slug: 'festive-holiday-molds' },
    { name: 'Cake & Chocolate Decorating', slug: 'cake-chocolate-decorating' },
    { name: 'Storage & Trays', slug: 'storage-trays' }
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug }
    });
  }

  console.log('3. Linking existing Product rows to Category FK...');
  await prisma.$executeRawUnsafe(`
    UPDATE "Product" p
    SET "categoryId" = c."id"
    FROM "Category" c
    WHERE p."category" = c."name" AND p."categoryId" IS NULL;
  `);

  const catCount = await prisma.category.count();
  const prodLinked = await prisma.product.count({ where: { categoryId: { not: null } } });
  const totalProd = await prisma.product.count();

  console.log('Setup complete!');
  console.log(`Total categories in DB: ${catCount}`);
  console.log(`Products linked to Category FK: ${prodLinked} / ${totalProd}`);
  await prisma.$disconnect();
}

setup().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});

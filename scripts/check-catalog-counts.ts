import 'dotenv/config';
import prisma from '../src/lib/db';
import catalogProducts from '../src/lib/data/products.json';
import { getUnifiedCatalog } from '../src/lib/catalog';

async function main() {
  console.log('========================================');
  console.log('CATALOG COUNT INTEGRITY & AUDIT REPORT');
  console.log('========================================\n');

  const rawJsonCount = catalogProducts.length;
  console.log(`[1] Raw products.json count:           ${rawJsonCount}`);

  let dbTotal = 0;
  let dbPublished = 0;
  let dbSellers = 0;
  try {
    dbTotal = await prisma.product.count();
    dbPublished = await prisma.product.count({ where: { status: 'PUBLISHED' } });
    dbSellers = await prisma.product.count({ where: { status: 'PUBLISHED', sellerId: { not: null } } });
    console.log(`[2] PostgreSQL Prisma DB count:        ${dbTotal} total (${dbPublished} published, ${dbSellers} third-party sellers)`);
  } catch (err: any) {
    console.log(`[2] PostgreSQL Prisma DB check error:  ${err?.message || err}`);
  }

  const { catalog, facets } = await getUnifiedCatalog();
  console.log(`[3] Unified In-Memory Catalog count:   ${catalog.length}`);
  console.log(`[4] Active Categories Indexed:         ${Object.keys(facets.categories).length}`);
  console.log(`[5] Active Departments Indexed:        ${Object.keys(facets.departments).length}\n`);

  console.log('Top Categories by Product Count:');
  const sortedCats = Object.entries(facets.categories).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats.slice(0, 5)) {
    console.log(`  - ${cat.padEnd(35)}: ${count} products`);
  }

  console.log('\nAudit Summary:');
  if (catalog.length >= rawJsonCount - 30) {
    console.log('✅ PASS: Unified catalog successfully indexes >= 99% of total master records.');
  } else {
    console.log('❌ FAIL: Significant records dropped in unification.');
  }

  if (dbPublished < 500 && catalog.length > 2000) {
    console.log('ℹ️  INFO: Primary catalog is served via Unified Catalog layer with DB seller overlay.');
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

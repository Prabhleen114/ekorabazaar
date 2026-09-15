import prisma from '../src/lib/db';

async function main() {
  try {
    const total = await prisma.product.count();
    console.log(`Total products in DB: ${total}`);

    const eoCount = await prisma.product.count({ where: { category: 'Essential Oils' } });
    console.log(`Products in DB with category 'Essential Oils': ${eoCount}`);

    const hydroCount = await prisma.product.count({ where: { category: { contains: 'Hydrosol', mode: 'insensitive' } } });
    console.log(`Products in DB with Hydrosol in category: ${hydroCount}`);

    const customSellers = await prisma.product.count({
      where: {
        sellerId: { not: null },
        source: { not: 'EKORA_OFFICIAL' }
      }
    });
    console.log(`Custom third-party seller products in DB: ${customSellers}`);

    const sampleEO = await prisma.product.findMany({
      where: { category: 'Essential Oils' },
      take: 10,
      select: { id: true, title: true, category: true, imageUrl: true }
    });
    console.log('\nSample 10 DB Essential Oils:');
    for (const p of sampleEO) {
      console.log(`  ID=${p.id} | Title='${p.title.slice(0, 50)}' | Img='${p.imageUrl}'`);
    }
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

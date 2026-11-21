import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/lib/db';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PRODUCTS_JSON_PATH = path.join(ROOT_DIR, 'src/lib/data/products.json');

export async function exportCatalogJson(): Promise<number> {
  console.log('[Export] Fetching published products from PostgreSQL...');
  const dbProducts = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
    },
    include: {
      categoryRef: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formatted = dbProducts.map((p) => {
    const isOutOfStock = p.supplierAvailable === false || p.stock <= 0;
    const categoryName = p.categoryRef?.name || p.category || 'General Silicone Moulds';
    const priceRupees = Math.round(p.price);

    // Calculate wholesale discount tiers
    const tiers = (p.wholesaleTiers as any[]) || [
      { minQty: 1, maxQty: 9, price: priceRupees, discountPct: 0 },
      { minQty: 10, maxQty: 49, price: Math.round(priceRupees * 0.95), discountPct: 5 },
      { minQty: 50, maxQty: null, price: Math.round(priceRupees * 0.90), discountPct: 10 },
    ];

    return {
      id: p.id,
      name: p.title,
      category: categoryName,
      description: p.description || '',
      price: priceRupees,
      bulkDiscountAvailable: true,
      maxDiscount: 10,
      image: p.imageUrl || '',
      tiers,
      tags: [
        categoryName.toLowerCase(),
        'wholesale',
        'b2b',
        'bulk',
        'supplies',
        'india',
        'craft',
        'quality',
        'ekora',
      ],
      department: 'Precision Studio Moulds',
      disciplines: ['candle-studio', 'resin-lab', 'soap-atelier'],
      isQuoteOnly: isOutOfStock,
      inStock: !isOutOfStock,
    };
  });

  // Atomic write via temp file
  const tmpPath = `${PRODUCTS_JSON_PATH}.tmp`;
  fs.mkdirSync(path.dirname(PRODUCTS_JSON_PATH), { recursive: true });
  fs.writeFileSync(tmpPath, JSON.stringify(formatted, null, 2), 'utf-8');
  fs.renameSync(tmpPath, PRODUCTS_JSON_PATH);

  console.log(`[Export] Successfully exported ${formatted.length} products to ${PRODUCTS_JSON_PATH}`);
  return formatted.length;
}

if (process.argv[1] && process.argv[1].endsWith('export-catalog-json.ts')) {
  exportCatalogJson()
    .then((count) => {
      console.log(`Export finished. Total: ${count}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Export error:', err);
      process.exit(1);
    });
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/lib/db';
import { getDepartmentForCategory } from '../src/lib/taxonomy';
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
    select: {
      id: true,
      title: true,
      category: true,
      price: true,
      stock: true,
      supplierAvailable: true,
      imageUrl: true,
      description: true,
      wholesaleTiers: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`[Export] Fetched ${dbProducts.length} published products. Formatting JSON...`);

  const formatted = dbProducts.map((p) => {
    const isOutOfStock = p.supplierAvailable === false || p.stock <= 0;
    const categoryName = p.category || 'General Silicone Moulds';
    const departmentName = getDepartmentForCategory(categoryName) || 'Precision Studio Moulds';
    const priceRupees = Math.round(p.price);

    // Wholesale discount tiers: respect explicit empty array [] for multi-packs
    const hasExplicitEmptyTiers = Array.isArray(p.wholesaleTiers) && (p.wholesaleTiers as any[]).length === 0;
    const defaultTiers = [
      { minQty: 1, maxQty: 9, price: priceRupees, discountPct: 0 },
      { minQty: 10, maxQty: 49, price: Math.round(priceRupees * 0.95), discountPct: 5 },
      { minQty: 50, maxQty: null, price: Math.round(priceRupees * 0.90), discountPct: 10 },
    ];

    const tiers = hasExplicitEmptyTiers
      ? []
      : (Array.isArray(p.wholesaleTiers) && (p.wholesaleTiers as any[]).length > 0
          ? (p.wholesaleTiers as any[])
          : defaultTiers);

    const bulkDiscountAvailable = !isOutOfStock && tiers.length > 1;

    return {
      id: p.id,
      name: p.title,
      category: categoryName,
      description: p.description || '',
      price: priceRupees,
      bulkDiscountAvailable,
      maxDiscount: bulkDiscountAvailable ? 10 : 0,
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
      department: departmentName,
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

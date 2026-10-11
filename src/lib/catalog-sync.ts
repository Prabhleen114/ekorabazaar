import prisma from '@/lib/db'
import catalogProducts from '@/lib/data/products.json'
import { ProductStatus } from '@prisma/client'

/**
 * Checks for missing catalog products in the DB and upserts them.
 */
export async function syncCatalogProducts(productIds: string[]) {
  const missingIds = productIds.filter(Boolean);
  if (missingIds.length === 0) return [];
  
  const syncedProducts = [];
  
  for (const missingId of missingIds) {
    const catalogItem = (catalogProducts as any[]).find((p: any) => String(p.id) === String(missingId));
    if (catalogItem) {
      if (catalogItem.isQuoteOnly || catalogItem.price <= 0 || catalogItem.inStock === false) {
        continue;
      }

      const officialUser = await prisma.user.upsert({
        where: { email: 'official@ekorabazaar.in' },
        update: {},
        create: { email: 'official@ekorabazaar.in', role: 'SELLER' }
      });
      
      const officialSeller = await prisma.seller.upsert({
        where: { id: 'EKO-OFFICIAL-01' },
        update: {},
        create: {
          id: 'EKO-OFFICIAL-01',
          userId: officialUser.id,
          brandName: 'Ekora Official Supplier',
          accountStatus: 'ACTIVE',
          applicationStatus: 'APPROVED'
        }
      });

      const rawPricePaise = Math.round((typeof catalogItem.price === 'number' ? catalogItem.price : parseFloat(catalogItem.price || '0')) * 100);
      
      const newProduct = await prisma.product.upsert({
        where: { id: String(catalogItem.id) },
        update: {},
        create: {
          id: String(catalogItem.id),
          title: catalogItem.name || 'Untitled Product',
          price: rawPricePaise,
          customerPrice: rawPricePaise,
          stock: 500,
          status: ProductStatus.PUBLISHED,
          sellerId: officialSeller.id,
          source: 'EKORA_OFFICIAL',
          category: catalogItem.category || 'General Silicone Moulds',
          imageUrl: catalogItem.image || '/og-image.jpg',
          wholesaleTiers: (catalogItem.tiers || []).map((t: any) => ({
            ...t,
            price: Math.round((Number(t.price) || 0) * 100)
          }))
        }
      });
      syncedProducts.push(newProduct);
    }
  }
  return syncedProducts;
}

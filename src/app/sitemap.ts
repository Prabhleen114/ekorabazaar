import type { MetadataRoute } from 'next';
import prisma from '@/lib/db';
import { ProductStatus } from '@prisma/client';
import { getAllWholesaleDefinitions, WholesaleCategoryDefinition } from '@/lib/fragrance-collections';
import catalogProducts from '@/lib/data/products.json';
import { isDeprecatedProductId } from '@/lib/product-redirects';

const BASE_URL = 'https://ekorabazaar.in';



export async function generateSitemaps() {
  return [
    { id: 'static' },
    { id: 'categories' },
    { id: 'products' },
    { id: 'guides' },
    { id: 'blog' },
    { id: 'stores' },
    { id: 'formulations' }
  ];
}

async function getCategoriesWithProducts() {
  const definitions = getAllWholesaleDefinitions();
  const finalCategories: { cat: WholesaleCategoryDefinition, lastModified?: Date }[] = [];
  
  for (const cat of definitions) {
    const categoryNames = cat.includeCategories && cat.includeCategories.length > 0
      ? cat.includeCategories
      : [cat.id];
    try {
      const latestProduct = await prisma.product.findFirst({
        where: {
          OR: categoryNames.map((name) => ({ category: { equals: name, mode: 'insensitive' as const } })),
          status: ProductStatus.PUBLISHED,
          isActive: true,
          AND: [
            {
              OR: [
                { sellerId: null },
                { seller: { accountStatus: 'ACTIVE' } }
              ]
            }
          ]
        },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      });
      
      if (latestProduct) {
        finalCategories.push({ cat, lastModified: latestProduct.updatedAt });
        continue;
      }
    } catch (err) {
      console.warn("Could not check category count:", err);
    }

    // Check fallback products.json
    const categoryNamesLower = new Set(categoryNames.map((c) => c.toLowerCase()));
    const hasStatic = (catalogProducts as any[]).some((p: any) =>
      p.category && (categoryNamesLower.has(String(p.category).toLowerCase()) || String(p.category).toLowerCase() === cat.label.toLowerCase())
    );
    if (hasStatic) {
      finalCategories.push({ cat });
    }
  }
  return finalCategories;
}

export default async function sitemap(props: { id: string | Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await Promise.resolve(props.id);

  if (id === 'static') {
    const staticRoutes: {
      path: string;
      priority: number;
      changeFrequency: 'daily' | 'weekly' | 'monthly';
    }[] = [
      { path: '', priority: 1.0, changeFrequency: 'daily' },
      { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
      { path: '/guides', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
      { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
      { path: '/classes', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/tools/fragrance-load-calculator', priority: 0.8, changeFrequency: 'monthly' },
      { path: '/sell', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/sell/how-it-works', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/sell/categories', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/sell/why-ekora', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/sell/platform', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/sell/faq', priority: 0.6, changeFrequency: 'monthly' },
      { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
      { path: '/creator-guidelines', priority: 0.5, changeFrequency: 'monthly' },
      { path: '/shipping-policy', priority: 0.5, changeFrequency: 'monthly' },
      { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
      { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
      { path: '/refund-policy', priority: 0.3, changeFrequency: 'monthly' },
    ];

    return staticRoutes.map((route) => ({
      url: `${BASE_URL}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));
  }

  if (id === 'categories') {
    const activeCats = await getCategoriesWithProducts();
    return activeCats.map(({ cat, lastModified }) => {
      const route: any = {
        url: `${BASE_URL}/wholesale/${cat.slug}`,
        changeFrequency: 'weekly',
        priority: cat.isFragranceRelated ? 0.95 : 0.9,
      };
      if (lastModified) route.lastModified = lastModified;
      return route;
    });
  }

  if (id === 'guides') {
    const activeCats = await getCategoriesWithProducts();
    return activeCats.map(({ cat, lastModified }) => {
      const route: any = {
        url: `${BASE_URL}/guides/${cat.slug}`,
        changeFrequency: 'monthly',
        priority: 0.7,
      };
      if (lastModified) route.lastModified = lastModified;
      return route;
    });
  }

  if (id === 'products') {
    const routes: MetadataRoute.Sitemap = [];
    const inactiveDbIds = new Set<string>();
    
    try {
      const allDbProducts = await prisma.product.findMany({
        select: {
          id: true,
          status: true,
          isActive: true,
          sellerId: true,
          seller: { select: { accountStatus: true } },
          updatedAt: true,
        },
      });

      for (const product of allDbProducts) {
        const isPublic =
          product.status === ProductStatus.PUBLISHED &&
          product.isActive !== false &&
          (product.sellerId === null || product.seller?.accountStatus === 'ACTIVE');

        if (!isPublic) {
          inactiveDbIds.add(product.id);
          continue;
        }
        if (isDeprecatedProductId(product.id)) continue;
        routes.push({
          url: `${BASE_URL}/products/${product.id}`,
          lastModified: product.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    } catch (err) {
      console.warn("Could not load dynamic products for sitemap:", err);
    }
    
    // Fallback: append any from products.json that weren't in DB (and not inactive/draft in DB)
    const existingIds = new Set(routes.map(r => {
      const parts = r.url.split('/');
      return parts[parts.length - 1];
    }));
    
    for (const p of catalogProducts as any[]) {
      const pid = String(p.id);
      if (!existingIds.has(pid) && !inactiveDbIds.has(pid) && !isDeprecatedProductId(pid)) {
        routes.push({
          url: `${BASE_URL}/products/${pid}`,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    return routes;
  }

  if (id === 'blog') {
    const { getAllPosts } = await import('@/lib/blog');
    const posts = getAllPosts();
    return posts.map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.frontmatter.updatedAt || post.frontmatter.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  }

  if (id === 'stores') {
    try {
      const activeSellers = await prisma.seller.findMany({
        where: { accountStatus: 'ACTIVE' },
        include: {
          products: {
            where: { status: ProductStatus.PUBLISHED },
            select: { id: true }
          }
        }
      });

      // Sitemap only when indexable (at least 3 published products)
      const indexable = activeSellers.filter(s => s.products.length >= 3);
      return indexable.map(s => ({
        url: `${BASE_URL}/store/${s.id}`,
        lastModified: s.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    } catch (err) {
      console.warn("Could not load stores for sitemap:", err);
      return [];
    }
  }

  if (id === 'formulations') {
    const rawFormulations = (await import('@/lib/data/formulations.json')).default;
    const routes: MetadataRoute.Sitemap = [
      {
        url: `${BASE_URL}/formulations`,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ];

    for (const item of rawFormulations) {
      const slug = item.url.split('/').pop() || '';
      if (slug) {
        routes.push({
          url: `${BASE_URL}/formulations/${slug}`,
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    }

    return routes;
  }

  return [];
}

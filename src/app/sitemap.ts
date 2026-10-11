import type { MetadataRoute } from 'next';
import prisma from '@/lib/db';
import { ProductStatus } from '@prisma/client';
import { ALL_CATEGORIES } from '@/lib/categories';
import catalogProducts from '@/lib/data/products.json';

const BASE_URL = 'https://www.ekorabazaar.in';

export const revalidate = 3600;

export async function generateSitemaps() {
  return [
    { id: 'static' },
    { id: 'categories' },
    { id: 'products' },
    { id: 'guides' },
    { id: 'blog' },
    { id: 'stores' }
  ];
}

async function getCategoriesWithProducts() {
  const finalCategories: { cat: typeof ALL_CATEGORIES[0], lastModified?: Date }[] = [];
  
  for (const cat of ALL_CATEGORIES) {
    try {
      const latestProduct = await prisma.product.findFirst({
        where: {
          category: cat.id,
          status: ProductStatus.PUBLISHED,
          OR: [
            { sellerId: null },
            { seller: { accountStatus: 'ACTIVE' } }
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
    const hasStatic = catalogProducts.some((p: any) => p.category === cat.id || p.category === cat.label || p.category?.toLowerCase() === cat.id.toLowerCase());
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
      { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
      { path: '/classes', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/tools/fragrance-load-calculator', priority: 0.8, changeFrequency: 'monthly' },
      { path: '/sell', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/sell/how-it-works', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/sell/categories', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/sell/why-ekora', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/sell/platform', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/sell/faq', priority: 0.6, changeFrequency: 'monthly' },
      { path: '/creator-guidelines', priority: 0.5, changeFrequency: 'monthly' },
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
        url: `${BASE_URL}/wholesale/${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        changeFrequency: 'weekly',
        priority: 0.9,
      };
      if (lastModified) route.lastModified = lastModified;
      return route;
    });
  }

  if (id === 'guides') {
    const activeCats = await getCategoriesWithProducts();
    return activeCats.map(({ cat, lastModified }) => {
      const route: any = {
        url: `${BASE_URL}/guides/${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        changeFrequency: 'monthly',
        priority: 0.7,
      };
      if (lastModified) route.lastModified = lastModified;
      return route;
    });
  }

  if (id === 'products') {
    const routes: MetadataRoute.Sitemap = [];
    
    try {
      const dbProducts = await prisma.product.findMany({
        where: { 
          status: ProductStatus.PUBLISHED,
          OR: [
            { sellerId: null },
            { seller: { accountStatus: 'ACTIVE' } }
          ]
        },
        select: { id: true, updatedAt: true },
      });

      for (const product of dbProducts) {
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
    
    // Fallback: append any from products.json that weren't in DB
    const existingIds = new Set(routes.map(r => {
      const parts = r.url.split('/');
      return parts[parts.length - 1];
    }));
    
    for (const p of catalogProducts as any[]) {
      if (!existingIds.has(String(p.id))) {
        routes.push({
          url: `${BASE_URL}/products/${p.id}`,
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

  return [];
}

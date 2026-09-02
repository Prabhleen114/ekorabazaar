import type { MetadataRoute } from 'next';
import prisma from '@/lib/db';
import { ProductStatus } from '@prisma/client';
import { ALL_CATEGORIES } from '@/lib/categories';

const BASE_URL = 'https://www.ekorabazaar.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: 'daily' | 'weekly' | 'monthly';
  }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
    { path: '/classes', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/sell', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/start-selling', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/sell/how-it-works', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/sell/categories', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/sell/why-ekora', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/sell/start-selling', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/sell/platform', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/sell/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/creator-guidelines', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/refund-policy', priority: 0.3, changeFrequency: 'monthly' },
  ];

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const products = await prisma.product.findMany({
    where: { status: ProductStatus.PUBLISHED, seller: { accountStatus: 'ACTIVE' } },
    select: { id: true, updatedAt: true },
  });

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/products/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const wholesalePages: MetadataRoute.Sitemap = ALL_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/wholesale/${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const guidePages: MetadataRoute.Sitemap = ALL_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/guides/${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...wholesalePages, ...guidePages];
}

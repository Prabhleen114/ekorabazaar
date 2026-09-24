import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/seller/dashboard/',
          '/admin/',
          '/start-selling', // application form
          '/login',
          '/account/',
          '/checkout/',
          '/cart/'
        ],
      },
    ],
    sitemap: 'https://www.ekorabazaar.in/sitemap.xml',
  };
}

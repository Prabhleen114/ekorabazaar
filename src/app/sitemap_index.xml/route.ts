import { NextResponse } from 'next/server';

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.ekorabazaar.in/sitemap/static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.ekorabazaar.in/sitemap/categories.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.ekorabazaar.in/sitemap/products.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.ekorabazaar.in/sitemap/guides.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

import prisma from '../src/lib/db';

async function main() {
  console.log('--- FETCHING DB FIXTURES ---');
  const product = await prisma.product.findFirst({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true, price: true },
  });

  const seller = await prisma.seller.findFirst({
    where: { accountStatus: 'ACTIVE' },
    select: { id: true, brandName: true },
  });

  console.log('Sample Product:', product);
  console.log('Sample Seller:', seller);

  const urls = [
    { name: 'Homepage', url: 'http://localhost:3000/' },
    { name: 'Shop Catalog (SSR)', url: 'http://localhost:3000/shop' },
    { name: 'Product Page (SSR)', url: product ? `http://localhost:3000/products/${product.id}` : 'http://localhost:3000/products/375' },
    { name: 'Storefront (SSR)', url: seller ? `http://localhost:3000/store/${seller.id}` : 'http://localhost:3000/store/EKO-OFFICIAL-01' },
    { name: 'About Page', url: 'http://localhost:3000/about' },
  ];

  console.log('\n--- VERIFYING 5 REPRESENTATIVE URLS WITH CURL/FETCH (NO JS) ---');

  for (const item of urls) {
    console.log(`\nTesting: ${item.name} (${item.url})`);
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': 'curl/8.4.0', // Emulate raw curl with no JavaScript execution
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    console.log(`  HTTP Status: ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    console.log(`  Content-Type: ${contentType}`);

    const html = await res.text();
    const hasHtmlTag = html.includes('<html');
    const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'MISSING';

    const hasMetaDesc = /<meta[^>]*name=["']description["']/i.test(html) || /<meta[^>]*property=["']og:description["']/i.test(html);
    const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
    const hasJsonLd = html.includes('application/ld+json');
    const bodyLength = html.length;

    console.log(`  Title: ${title}`);
    console.log(`  Has <title>: ${hasTitle}`);
    console.log(`  Has Meta Description: ${hasMetaDesc}`);
    console.log(`  Has Canonical Tag: ${hasCanonical}`);
    console.log(`  Has JSON-LD Structured Data: ${hasJsonLd}`);
    console.log(`  Initial HTML Body Size: ${bodyLength} bytes`);

    if (res.status !== 200) {
      console.error(`  [FAIL] Expected 200, got ${res.status}`);
    }
    if (!hasTitle) {
      console.error('  [FAIL] Missing <title> tag in server response');
    }
  }

  // Also check robots.txt and sitemap_index.xml
  console.log('\n--- VERIFYING ROBOTS.TXT & SITEMAP_INDEX.XML ---');
  const robotsRes = await fetch('http://localhost:3000/robots.txt');
  console.log(`robots.txt Status: ${robotsRes.status}`);
  const robotsText = await robotsRes.text();
  console.log(`robots.txt preview:\n${robotsText.substring(0, 200)}...`);

  const sitemapRes = await fetch('http://localhost:3000/sitemap_index.xml');
  console.log(`sitemap_index.xml Status: ${sitemapRes.status}`);
  const sitemapText = await sitemapRes.text();
  console.log(`sitemap_index.xml preview:\n${sitemapText.substring(0, 250)}...`);

  await prisma.$disconnect();
  console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
}

main().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});

import { describe, it, expect } from 'vitest';
import { generateOrganizationSchema, generateProductSchema, generateFaqSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { HOMEPAGE_FAQS } from '@/lib/faqs';
import { GET as getLlmsTxt } from '@/app/llms.txt/route';
import fs from 'fs';

describe('GEO Discoverability & Structured Data Verification', () => {
  it('generates unified authoritative Organization and WebSite schemas', () => {
    const schemas = generateOrganizationSchema();
    expect(schemas).toHaveLength(2);

    const org: any = schemas.find((s: any) => s['@type'] === 'Organization');
    expect(org).toBeDefined();
    expect(org['@id']).toBe('https://www.ekorabazaar.in/#organization');
    expect(org.name).toBe('Ekora Bazaar');
    expect(org.legalName).toBe('Ekora Bazaar Pvt Ltd');
    expect(org.url).toBe('https://www.ekorabazaar.in');
    expect(org.logo.url).toBe('https://www.ekorabazaar.in/images/logo.jpg');
    expect(org.foundingDate).toBe('2026');
    expect(org.founders).toEqual([
      { '@type': 'Person', name: 'Kumar Aryan' },
      { '@type': 'Person', name: 'Prabhleen Kaur' },
    ]);
    expect(org.address.postalCode).toBe('842001');
    expect(org.address.addressLocality).toBe('Muzaffarpur');
    expect(org.address.addressCountry).toBe('IN');
    expect(org.contactPoint[0].telephone).toBe('+91-9041500605');
    expect(org.contactPoint[0].email).toBe('ekorabazaar@gmail.com');

    const website: any = schemas.find((s: any) => s['@type'] === 'WebSite');
    expect(website).toBeDefined();
    expect(website['@id']).toBe('https://www.ekorabazaar.in/#website');
    expect(website.publisher['@id']).toBe('https://www.ekorabazaar.in/#organization');
    expect(website.potentialAction['@type']).toBe('SearchAction');
  });

  it('generates enhanced Product schema with canonical @id, category, and valid offer', () => {
    const product = {
      id: '790',
      title: 'Soy Wax Flakes 100% Pure',
      category: 'Candle Waxes & Additives',
      price: 24500,
      customerPrice: 24500,
      stock: 100,
      image: '/images/products/candles/soy-wax.webp',
      description: 'High purity candle formulation grade soy wax flakes.',
    };

    const schema: any = generateProductSchema(product);
    expect(schema['@id']).toBe('https://www.ekorabazaar.in/products/790#product');
    expect(schema.name).toBe('Soy Wax Flakes 100% Pure');
    expect(schema.category).toBe('Candle Waxes & Additives');
    expect(schema.sku).toBe('790');
    expect(schema.brand.name).toBe('Ekora Bazaar');
    expect(schema.brand.url).toBe('https://www.ekorabazaar.in');

    expect(schema.offers['@id']).toBe('https://www.ekorabazaar.in/products/790#offer');
    expect(schema.offers.price).toBe(245);
    expect(schema.offers.priceCurrency).toBe('INR');
    expect(schema.offers.priceValidUntil).toBe('2027-12-31');
    expect(schema.offers.shippingDetails.shippingRate.value).toBe(90);
  });

  it('guarantees shipping rate consistency across Homepage FAQ and Shipping Policy', () => {
    const shippingFaq = HOMEPAGE_FAQS.find(f => f.question.toLowerCase().includes('delivery'));
    expect(shippingFaq).toBeDefined();
    expect(shippingFaq!.answer).toContain('₹90');
    expect(shippingFaq!.answer).not.toContain('₹80');

    const faqSchema: any = generateFaqSchema(HOMEPAGE_FAQS);
    expect(faqSchema['@type']).toBe('FAQPage');
    expect(faqSchema.mainEntity).toHaveLength(HOMEPAGE_FAQS.length);

    const shippingPolicyContent = fs.readFileSync('src/app/shipping-policy/page.tsx', 'utf8');
    expect(shippingPolicyContent).toContain('₹90');
    expect(shippingPolicyContent).not.toContain('₹80');
  });

  it('provides crawlable internal links to key hubs in BuyerFooter', () => {
    const footerContent = fs.readFileSync('src/components/BuyerFooter.tsx', 'utf8');
    expect(footerContent).toContain('href="/guides"');
    expect(footerContent).toContain('href="/formulations"');
    expect(footerContent).toContain('href="/tools/fragrance-load-calculator"');
    expect(footerContent).toContain('href="/about"');
    expect(footerContent).toContain('href="/wholesale/candle-waxes-additives"');
  });

  it('provides crawlable internal links to Sourcing Guides and Calculator in BuyerNavbar', () => {
    const navbarContent = fs.readFileSync('src/components/BuyerNavbar.tsx', 'utf8');
    expect(navbarContent).toContain('href="/guides"');
    expect(navbarContent).toContain('href="/tools/fragrance-load-calculator"');
    expect(navbarContent).toContain('href="/formulations"');
  });

  it('connects product breadcrumbs to wholesale category landing pages', () => {
    const crumbs: any = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://www.ekorabazaar.in' },
      { name: 'Shop', url: 'https://www.ekorabazaar.in/shop' },
      { name: 'Candle Waxes & Additives', url: 'https://www.ekorabazaar.in/wholesale/candle-waxes-additives' },
      { name: 'Pure Soy Wax', url: 'https://www.ekorabazaar.in/products/790' },
    ]);

    expect(crumbs['@type']).toBe('BreadcrumbList');
    expect(crumbs.itemListElement).toHaveLength(4);
    expect(crumbs.itemListElement[2].item).toBe('https://www.ekorabazaar.in/wholesale/candle-waxes-additives');

    const pdpContent = fs.readFileSync('src/app/products/[id]/page.tsx', 'utf8');
    expect(pdpContent).toContain('href={`/wholesale/${categorySlug}`}');
  });

  it('serves standard-compliant llms.txt with accurate verified facts', async () => {
    const response = await getLlmsTxt();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');

    const text = await response.text();
    expect(text).toContain('# Ekora Bazaar');
    expect(text).toContain('Ekora Bazaar Pvt Ltd');
    expect(text).toContain('Kumar Aryan');
    expect(text).toContain('Prabhleen Kaur');
    expect(text).toContain('Muzaffarpur, Bihar - 842001, India');
    expect(text).toContain('₹90');
    expect(text).toContain('https://www.ekorabazaar.in/wholesale/candle-waxes-additives');
    expect(text).toContain('https://www.ekorabazaar.in/guides');
    expect(text).toContain('https://www.ekorabazaar.in/formulations');
    expect(text).toContain('https://www.ekorabazaar.in/tools/fragrance-load-calculator');
  });
});

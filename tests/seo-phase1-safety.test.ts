import { describe, it, expect, vi } from 'vitest';
import { GET as docGetRoute } from '@/app/api/docs/[slug]/[type]/route';
import { NextRequest } from 'next/server';
import { metadata as formulationsMetadata } from '@/app/formulations/page';
import { generateMetadata as formulationDetailMetadata } from '@/app/formulations/[slug]/page';
import { metadata as contactMetadata } from '@/app/contact/page';
import { metadata as shippingPolicyMetadata } from '@/app/shipping-policy/page';
import { metadata as privacyMetadata } from '@/app/privacy/page';
import { metadata as refundMetadata } from '@/app/refund-policy/page';
import { metadata as termsMetadata } from '@/app/terms/page';
import { metadata as sellerAgreementMetadata } from '@/app/seller-agreement/page';
import { metadata as guidesMetadata } from '@/app/guides/page';
import { metadata as shopMetadata } from '@/app/shop/layout';
import { metadata as aboutMetadata } from '@/app/about/page';
import { metadata as blogMetadata } from '@/app/blog/page';
import { metadata as classesMetadata } from '@/app/classes/page';

describe('Phase 1 SEO Safety & Metadata Integrity Tests', () => {
  describe('Document / Certificate Endpoint Safety', () => {
    it('returns honest 404 and noindex when authentic document does not exist', async () => {
      // Test with product 1426 (mould) or 375 (mango butter)
      const req = new NextRequest('http://localhost:3000/api/docs/1426/coa');
      const params = Promise.resolve({ slug: '1426', type: 'coa' });

      const response = await docGetRoute(req, { params });

      expect(response.status).toBe(404);
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

      const bodyText = await response.text();
      // Ensure zero fabricated claims
      expect(bodyText).not.toContain('99.68%');
      expect(bodyText).not.toContain('Ekora Central QA Laboratory');
      expect(bodyText).not.toContain('STAMP_AUTHENTICATED');
      expect(bodyText).not.toContain('Lead (Pb) < 0.1 ppm');
      expect(bodyText).toContain('Document Verification');
      expect(bodyText).toContain('Verification Policy:');
      expect(bodyText).toContain('We do not generate synthetic or generic test data online.');
    });

    it('safely escapes HTML and script payloads in slug to prevent reflected XSS', async () => {
      const xssSlug = '<script>alert("xss")</script>';
      const req = new NextRequest(`http://localhost:3000/api/docs/${encodeURIComponent(xssSlug)}/coa`);
      const params = Promise.resolve({ slug: xssSlug, type: 'coa' });

      const response = await docGetRoute(req, { params });
      expect(response.status).toBe(404);
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

      const bodyText = await response.text();
      expect(bodyText).not.toContain('<script>alert("xss")</script>');
      expect(bodyText).toContain('Invalid Request');
      expect(bodyText).toContain('Product Not Found');
    });

    it('rejects unsupported document types and prototype keys with 404 before lookup', async () => {
      const invalidTypes = ['constructor', '__proto__', 'toString', 'valueOf', 'invalid_doc', 'exe'];

      for (const type of invalidTypes) {
        const req = new NextRequest(`http://localhost:3000/api/docs/1426/${type}`);
        const params = Promise.resolve({ slug: '1426', type });

        const response = await docGetRoute(req, { params });
        expect(response.status).toBe(404);
        expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

        const bodyText = await response.text();
        expect(bodyText).toContain('Document Not Found');
        expect(bodyText).not.toContain('99.68%');
      }
    });

    it('safely redirects for trusted origins and fails closed for untrusted external URLs', async () => {
      const prismaModule = await import('@/lib/db');
      const findUniqueSpy = vi.spyOn(prismaModule.default.product, 'findUnique');

      // 1. Untrusted external domain -> fails closed to honest 404
      findUniqueSpy.mockResolvedValueOnce({
        id: 'mock-sku-untrusted',
        title: 'Untrusted Test Product',
        category: 'Test Category',
        status: 'PUBLISHED' as any,
        documentUrls: { coa: 'https://malicious-phishing-site.com/fake-coa.pdf' },
      } as any);

      const req1 = new NextRequest('http://localhost:3000/api/docs/mock-sku-untrusted/coa');
      const res1 = await docGetRoute(req1, { params: Promise.resolve({ slug: 'mock-sku-untrusted', type: 'coa' }) });
      expect(res1.status).toBe(404);
      const text1 = await res1.text();
      expect(text1).toContain('Verification Policy:');

      // 2. Safe same-origin relative path -> redirects
      findUniqueSpy.mockResolvedValueOnce({
        id: 'mock-sku-trusted',
        title: 'Trusted Test Product',
        category: 'Test Category',
        status: 'PUBLISHED' as any,
        documentUrls: { coa: '/documents/verified-coa.pdf' },
      } as any);

      const req2 = new NextRequest('https://www.ekorabazaar.in/api/docs/mock-sku-trusted/coa');
      const res2 = await docGetRoute(req2, { params: Promise.resolve({ slug: 'mock-sku-trusted', type: 'coa' }) });
      expect(res2.status).toBe(307);
      expect(res2.headers.get('location')).toBe('https://www.ekorabazaar.in/documents/verified-coa.pdf');

      // 3. Approved absolute origin -> redirects
      findUniqueSpy.mockResolvedValueOnce({
        id: 'mock-sku-absolute-trusted',
        title: 'Trusted Absolute Product',
        category: 'Test Category',
        status: 'PUBLISHED' as any,
        documentUrls: { coa: 'https://www.ekorabazaar.in/static-docs/batch-coa.pdf' },
      } as any);

      const req3 = new NextRequest('https://www.ekorabazaar.in/api/docs/mock-sku-absolute-trusted/coa');
      const res3 = await docGetRoute(req3, { params: Promise.resolve({ slug: 'mock-sku-absolute-trusted', type: 'coa' }) });
      expect(res3.status).toBe(307);
      expect(res3.headers.get('location')).toBe('https://www.ekorabazaar.in/static-docs/batch-coa.pdf');

      findUniqueSpy.mockRestore();
    });
  });

  describe('Canonical URL Integrity', () => {
    it('ensures formulations index page specifies its own canonical URL', () => {
      expect(formulationsMetadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/formulations');
    });

    it('ensures formulation detail pages generate their own canonical URL and article schema', async () => {
      const meta = await formulationDetailMetadata({
        params: Promise.resolve({ slug: 'tranexamic-acid-serum-spot-correcting-serum' }),
      });
      expect(meta.alternates?.canonical).toBe(
        'https://www.ekorabazaar.in/formulations/tranexamic-acid-serum-spot-correcting-serum'
      );
      expect(meta.openGraph?.url).toBe(
        'https://www.ekorabazaar.in/formulations/tranexamic-acid-serum-spot-correcting-serum'
      );
    });

    it('ensures public static routes specify their canonical URLs', () => {
      expect(contactMetadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/contact');
      expect(shippingPolicyMetadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/shipping-policy');
      expect(privacyMetadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/privacy');
      expect(refundMetadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/refund-policy');
      expect(termsMetadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/terms');
      expect(guidesMetadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/guides');
    });

    it('ensures placeholder seller agreement is noindexed but has canonical', () => {
      expect(sellerAgreementMetadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/seller-agreement');
      expect(sellerAgreementMetadata.robots?.index).toBe(false);
      expect(sellerAgreementMetadata.robots?.follow).toBe(true);
    });
  });

  describe('Title Suffix Deduplication', () => {
    it('ensures pages do not append redundant "| Ekora Bazaar" in their title definition', () => {
      const titleStrings = [
        String(formulationsMetadata.title),
        String(shippingPolicyMetadata.title),
        String(privacyMetadata.title),
        String(refundMetadata.title),
        String(termsMetadata.title),
        String(sellerAgreementMetadata.title),
        String(guidesMetadata.title),
        String(shopMetadata.title),
        String(aboutMetadata.title),
        String(classesMetadata.title),
      ];

      for (const title of titleStrings) {
        expect(title).not.toContain('| Ekora Bazaar');
        expect(title).not.toContain('— Ekora');
      }
    });
  });

  describe('Sitemap Coverage', () => {
    it('ensures sitemaps index includes formulations.xml', async () => {
      const { GET: getSitemapIndex } = await import('@/app/sitemap_index.xml/route');
      const response = await getSitemapIndex();
      const xml = await response.text();
      expect(xml).toContain('https://www.ekorabazaar.in/sitemap/formulations.xml');
      expect(xml).toContain('https://www.ekorabazaar.in/sitemap/static.xml');
      expect(xml).toContain('https://www.ekorabazaar.in/sitemap/guides.xml');
    });

    it('ensures generateSitemaps includes formulations', async () => {
      const { generateSitemaps } = await import('@/app/sitemap');
      const sitemaps = await generateSitemaps();
      expect(sitemaps).toContainEqual({ id: 'formulations' });
    });

    it('ensures sitemap static includes contact, shipping-policy, and guides', async () => {
      const sitemapDefault = (await import('@/app/sitemap')).default;
      const staticEntries = await sitemapDefault({ id: 'static' });
      const urls = staticEntries.map(e => e.url);
      expect(urls).toContain('https://www.ekorabazaar.in/contact');
      expect(urls).toContain('https://www.ekorabazaar.in/shipping-policy');
      expect(urls).toContain('https://www.ekorabazaar.in/guides');
    });

    it('ensures sitemap formulations includes /formulations and all formulation slugs', async () => {
      const sitemapDefault = (await import('@/app/sitemap')).default;
      const formulationEntries = await sitemapDefault({ id: 'formulations' });
      const urls = formulationEntries.map(e => e.url);
      expect(urls).toContain('https://www.ekorabazaar.in/formulations');
      expect(urls).toContain('https://www.ekorabazaar.in/formulations/tranexamic-acid-serum-spot-correcting-serum');
      expect(urls.length).toBe(21); // 1 index + 20 articles
    });
  });

  describe('Shipping Consistency', () => {
    it('verifies PricingWidget uses the authoritative ₹90 flat shipping rate', async () => {
      const fs = await import('fs');
      const widgetContent = fs.readFileSync('src/components/PricingWidget.tsx', 'utf8');
      expect(widgetContent).toContain('Standard Flat Shipping: <strong className="text-stone-900">₹90</strong> across India');
      expect(widgetContent).not.toContain('₹80');
    });
  });
});

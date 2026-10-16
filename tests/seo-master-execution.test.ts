import { describe, it, expect } from 'vitest';
import {
  CONFIRMED_DUPLICATE_MAPPINGS,
  DEPRECATED_TO_CANONICAL_ID_MAP,
  isDeprecatedProductId,
  getCanonicalProductId,
} from '@/lib/product-redirects';
import { generateProductMetadata, generateProductSchema } from '@/lib/seo';
import { SYNONYM_GROUPS, expandQueryTokenGroups } from '@/lib/search';
import nextConfig from '../next.config';

describe('Stage A & B: Product Identity, Redirects and Catalog Integrity', () => {
  it('contains exactly 8 verified duplicate product pairs', () => {
    expect(CONFIRMED_DUPLICATE_MAPPINGS).toHaveLength(8);
  });

  it('maps each deprecated ID to its verified canonical ID', () => {
    expect(getCanonicalProductId('399')).toBe('375');
    expect(getCanonicalProductId('2383')).toBe('854');
    expect(getCanonicalProductId('2385')).toBe('857');
    expect(getCanonicalProductId('2390')).toBe('862');
    expect(getCanonicalProductId('2388')).toBe('932');
    expect(getCanonicalProductId('2401')).toBe('1262');
    expect(getCanonicalProductId('2399')).toBe('1283');
    expect(getCanonicalProductId('2403')).toBe('1285');

    // Non-deprecated IDs should resolve to themselves
    expect(getCanonicalProductId('375')).toBe('375');
    expect(getCanonicalProductId('854')).toBe('854');
    expect(getCanonicalProductId('99999')).toBe('99999');
  });

  it('identifies deprecated IDs correctly', () => {
    expect(isDeprecatedProductId('399')).toBe(true);
    expect(isDeprecatedProductId('2383')).toBe(true);
    expect(isDeprecatedProductId('375')).toBe(false);
    expect(isDeprecatedProductId('854')).toBe(false);
  });

  it('configures permanent 301 redirects in next.config.ts for all deprecated IDs', async () => {
    const redirectsFn = (nextConfig as any).redirects;
    expect(typeof redirectsFn).toBe('function');
    const redirects = await redirectsFn();

    for (const mapping of CONFIRMED_DUPLICATE_MAPPINGS) {
      const found = redirects.find(
        (r: any) =>
          r.source === `/products/${mapping.deprecatedId}` &&
          r.destination === `/products/${mapping.canonicalId}` &&
          r.permanent === true
      );
      expect(found).toBeDefined();
    }
  });

  it('emits canonical URL and SKU in generateProductMetadata and generateProductSchema', () => {
    const deprecatedProduct = {
      id: '399',
      title: 'Mango Butter',
      price: 12200,
      customerPrice: 12200,
      stock: 50,
      image: '/images/products/butters/mango-butter.webp',
    };

    const metadata = generateProductMetadata(deprecatedProduct);
    expect(metadata.alternates?.canonical).toBe('https://www.ekorabazaar.in/products/375');

    const schema = generateProductSchema(deprecatedProduct);
    expect(schema.sku).toBe('375');
    expect(schema.offers.url).toBe('https://www.ekorabazaar.in/products/375');
    // Ensure no unsubstantiated "Lab-tested" claim in fallback description
    expect(schema.description).not.toContain('Lab-tested');
  });

  it('configures next.config.ts images formats without global unoptimized override', () => {
    const imageConfig = (nextConfig as any).images;
    expect(imageConfig.formats).toEqual(['image/avif', 'image/webp']);
    expect(imageConfig.unoptimized).toBeUndefined();
  });
});

describe('Stage B & C: Search Synonyms and Entity Accuracy', () => {
  it('does not lump different plant butters into a single synonym cluster', () => {
    // mango butter, shea butter, cocoa butter must be in separate clusters
    for (const group of SYNONYM_GROUPS) {
      const hasMango = group.includes('mango butter');
      const hasShea = group.includes('shea butter');
      const hasCocoa = group.includes('cocoa butter');

      const matches = [hasMango, hasShea, hasCocoa].filter(Boolean).length;
      expect(matches).toBeLessThanOrEqual(1);
    }
  });

  it('does not lump different waxes into a single synonym cluster', () => {
    for (const group of SYNONYM_GROUPS) {
      const hasSoy = group.includes('soy wax');
      const hasBees = group.includes('beeswax');
      const hasParaffin = group.includes('paraffin');

      const matches = [hasSoy, hasBees, hasParaffin].filter(Boolean).length;
      expect(matches).toBeLessThanOrEqual(1);
    }
  });

  it('keeps search query specific for mango butter', () => {
    const groups = expandQueryTokenGroups('mango butter');
    const flatTokens = groups.flat();
    expect(flatTokens).toContain('mango butter');
    expect(flatTokens).not.toContain('cocoa butter');
    expect(flatTokens).not.toContain('shea butter');
  });
});

describe('Stage C & D: AEO, Content and Checkout Telemetry Safety', () => {
  it('authoritative flat shipping charge is preserved as ₹90', async () => {
    const { TEMP_FLAT_SHIPPING_CHARGE } = await import('@/lib/pricing');
    expect(TEMP_FLAT_SHIPPING_CHARGE).toBe(90);
  });
});

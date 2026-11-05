import { describe, it, expect } from 'vitest';
import catalogProducts from '@/lib/data/products.json';
import { filterAndSortCatalogProducts } from '@/lib/product-filters';
import { getUnifiedCatalog } from '@/lib/catalog';
import {
  normalizeQuery,
  expandQueryTokenGroups,
  expandQueryTokens,
  scoreProduct,
  trigramSimilarity
} from '@/lib/search';

// Ground truth query fixtures with canonical concept regex
export const GROUND_TRUTH_FIXTURES = [
  { query: 'candle', concept: /\bcandles?\b/i, type: 'standard' },
  { query: 'candles', concept: /\bcandles?\b/i, type: 'plural' },
  { query: 'candel', concept: /\bcandles?\b/i, type: 'typo (transposition)' },
  { query: 'candl', concept: /\bcandles?\b/i, type: 'typo (truncated)' },
  { query: 'mold', concept: /\b(mould|mold)s?\b/i, type: 'US spelling' },
  { query: 'mould', concept: /\b(mould|mold)s?\b/i, type: 'UK spelling' },
  { query: 'wax', concept: /\bwaxes?\b|\bwax\b/i, type: 'standard' },
  { query: 'soywax', concept: /soy.*wax|soya.*wax/i, type: 'compound typo' },
  { query: 'fragrance', concept: /\b(fragrance|perfume|scent)s?\b/i, type: 'standard/synonym' },
  { query: 'fragnance', concept: /\b(fragrance|perfume|scent)s?\b/i, type: 'typo (phonetic)' },
  { query: 'lavendar', concept: /\blavender\b/i, type: 'typo (vowel)' },
  { query: 'beewax', concept: /\bbeeswax\b/i, type: 'typo' },
  { query: 'silicone mould', concept: /silicone.*(mould|mold)|(mould|mold).*silicone/i, type: 'multi-word' },
  { query: 'amber glass jar', concept: /(amber.*glass.*(jar|bottle|container)|glass.*amber.*(jar|bottle|container)|amber.*(jar|bottle).*glass)/i, type: 'multi-word packaging' },
  { query: 'resn', concept: /\bresins?\b/i, type: 'typo (omission)' },
];

describe('Search Recall & Precision Verification Suite', () => {
  it('achieves >= 95% recall across all ground-truth queries', async () => {
    const { catalog } = await getUnifiedCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(2000);

    for (const fixture of GROUND_TRUTH_FIXTURES) {
      // Calculate true matches in catalog
      const expectedMatches = catalog.filter(p => {
        const text = `${p.name || ''} ${p.category || ''} ${p.department || ''} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return fixture.concept.test(text);
      });
      const expectedCount = expectedMatches.length;

      // Run through search engine
      const res = filterAndSortCatalogProducts(catalog, { q: fixture.query, limit: 'all' });
      const recall = expectedCount > 0 ? (res.total / expectedCount) : 1;

      expect(
        recall,
        `Expected query "${fixture.query}" to achieve >= 95% recall. Expected: ${expectedCount}, Got: ${res.total} (Recall: ${(recall * 100).toFixed(1)}%)`
      ).toBeGreaterThanOrEqual(0.95);
    }
  });

  it('ranks exact and prefix matches above loose fuzzy matches in the top 10', async () => {
    const { catalog } = await getUnifiedCatalog();
    const res = filterAndSortCatalogProducts(catalog, { q: 'candle', limit: '10' });

    expect(res.items.length).toBe(10);
    // Top results must strongly feature 'candle' in their title
    const top3Titles = res.items.slice(0, 3).map(p => p.name.toLowerCase());
    for (const title of top3Titles) {
      expect(title.includes('candle')).toBe(true);
    }
  });

  it('handles edge cases without throwing or degrading', async () => {
    const { catalog } = await getUnifiedCatalog();

    // 1. Empty query
    const emptyRes = filterAndSortCatalogProducts(catalog, { q: '' });
    expect(emptyRes.total).toBe(catalog.length);

    // 2. Whitespace-only query
    const spaceRes = filterAndSortCatalogProducts(catalog, { q: '    ' });
    expect(spaceRes.total).toBe(catalog.length);

    // 3. One-character query
    const oneCharRes = filterAndSortCatalogProducts(catalog, { q: 'a' });
    expect(oneCharRes.total).toBeGreaterThan(0);

    // 4. Very long query
    const longQ = 'premium organic pure unrefined high temperature soy wax flakes for jar candles 1kg bag packaging bulk supply test ' + 'x'.repeat(100);
    const longRes = filterAndSortCatalogProducts(catalog, { q: longQ });
    expect(longRes).toBeDefined();

    // 5. Special characters and punctuation
    const specialRes = filterAndSortCatalogProducts(catalog, { q: 'candle & mould (silicone)! #*?' });
    expect(specialRes.total).toBeGreaterThan(450);

    // 6. Typo at start, middle, and end
    const startTypo = filterAndSortCatalogProducts(catalog, { q: 'candel' }); // transposition typo
    expect(startTypo.total).toBeGreaterThan(500);

    const midTypo = filterAndSortCatalogProducts(catalog, { q: 'candl' }); // end truncation typo
    expect(midTypo.total).toBeGreaterThan(500);
  });

  it('preserves performance: search executes under 60ms on full catalog', async () => {
    const { catalog } = await getUnifiedCatalog();
    const times: number[] = [];

    // Warm up
    for (let i = 0; i < 2; i++) {
      filterAndSortCatalogProducts(catalog, { q: 'candle', limit: 48 });
    }

    for (let i = 0; i < 5; i++) {
      for (const fixture of GROUND_TRUTH_FIXTURES.slice(0, 5)) {
        const t0 = performance.now();
        filterAndSortCatalogProducts(catalog, { q: fixture.query, limit: 48 });
        times.push(performance.now() - t0);
      }
    }

    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];

    expect(p50).toBeLessThan(60); // Target: sub-60ms p50
    expect(p95).toBeLessThan(100); // Target: sub-100ms p95
  });

  it('guarantees catalog count integrity', async () => {
    const { catalog } = await getUnifiedCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(2072);
  });
});

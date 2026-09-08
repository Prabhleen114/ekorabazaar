/**
 * Search synonyms and alias expansion for Ekora Bazaar.
 *
 * Each entry maps a set of user-typed terms (keys) to a canonical set
 * of extra tokens that should be injected into the search query.
 *
 * Rules:
 * - Keep all terms lowercase.
 * - Bidirectional: if a user types any word in a group, the others are added.
 * - Groups should be meaningful for this marketplace (fragrance, craft, packaging).
 * - Never add unrelated terms — specificity over recall.
 */

export const SYNONYM_GROUPS: string[][] = [
  // Fragrance / Scent
  ['perfume', 'fragrance', 'scent', 'parfum', 'fragnance', 'fragranze', 'fragerance'],
  ['itr', 'attar', 'ittar', 'itar'],
  ['essential oil', 'eo', 'essential'],
  ['fragrance oil', 'fo', 'fragrance oils'],
  ['aroma', 'aromatic', 'aromatherapy'],

  // Ingredient / Material synonyms
  ['wax', 'paraffin', 'soy wax', 'beeswax', 'coconut wax'],
  ['mold', 'mould', 'silicone mould', 'silicone mold'],
  ['mica', 'pigment', 'color', 'colour', 'colorant'],
  ['lye', 'sodium hydroxide', 'naoh'],
  ['base', 'soap base', 'melt and pour', 'mp base'],
  ['resin', 'epoxy', 'epoxy resin'],
  ['butter', 'shea butter', 'cocoa butter', 'mango butter'],
  ['carrier oil', 'carrier', 'base oil'],
  ['preservative', 'preservatives'],
  ['emulsifier', 'emulsifiers'],
  ['hydrosol', 'floral water', 'rose water', 'rosewater'],

  // Commerce terms — kept narrow to avoid matching near-universal catalog tags
  // ('wholesale' and 'b2b' appear as tags on nearly every product, so they are intentionally NOT synonyms)
  ['bulk', 'large quantity', 'bulk order'],
  ['sample', 'trial', 'tester'],

  // Container / Packaging synonyms
  ['jar', 'container', 'pot'],
  ['bottle', 'vial', 'flacon'],
  ['tin', 'metal container', 'aluminum'],
  ['box', 'packaging', 'mailer'],
  ['lid', 'cap', 'closure', 'cover'],
  ['label', 'sticker', 'tag'],

  // Scent families (common misspellings / alternate spellings)
  ['lavender', 'lavendar', 'lavander'],
  ['sandalwood', 'sandal', 'chandan'],
  ['rose', 'gulab', 'rosa'],
  ['jasmine', 'chameli', 'yasmin'],
  ['patchouli', 'patchouly', 'patcholie'],
  ['vetiver', 'khas', 'khus'],
  ['bergamot', 'bergamont'],
  ['eucalyptus', 'eucalyptis'],
  ['peppermint', 'pepper mint', 'spearmint'],
  ['tea tree', 'teatree', 'melaleuca'],
  ['frankincense', 'frank incense', 'boswellia', 'olibanum'],
  ['ylang ylang', 'ylang', 'ilang'],
  ['clary sage', 'clary'],
  ['lemon', 'lemon oil', 'citrus', 'lemongrass'],
  ['orange', 'sweet orange', 'blood orange'],
  ['cedarwood', 'cedar wood', 'cedar'],
  ['cinnamon', 'dalchini'],
  ['vanilla', 'vanillin'],
  ['musk', 'white musk'],

  // Tool / Equipment
  ['thermometer', 'temp probe'],
  ['scale', 'weighing scale', 'digital scale'],
  ['pouring pitcher', 'pitcher', 'pouring pot'],
  ['wick', 'candle wick', 'cotton wick'],
  ['wick tab', 'wick holder', 'wick sustainer'],
  ['candle dye', 'candle color', 'candle colour'],
];

/**
 * Build a lookup map: every word → set of synonyms to also search.
 * Pre-built once at module level.
 */
const SYNONYM_MAP = new Map<string, Set<string>>();

for (const group of SYNONYM_GROUPS) {
  for (const term of group) {
    const others = new Set(group.filter(t => t !== term));
    if (!SYNONYM_MAP.has(term)) {
      SYNONYM_MAP.set(term, new Set());
    }
    for (const o of others) {
      SYNONYM_MAP.get(term)!.add(o);
    }
  }
}

/**
 * Normalize a raw query string:
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Lowercase
 * - Remove purely punctuation-only tokens
 */
export function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')   // replace punctuation (keep hyphens)
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim();
}

/**
 * Expand a normalized query into groups of synonyms.
 * Each group represents one original concept (e.g. ['fragrance', 'scent', 'perfume']).
 * For DB queries, we can require all groups to match (AND between groups, OR within groups).
 */
export function expandQueryTokenGroups(normalized: string): string[][] {
  const originalTokens = normalized.split(' ').filter(t => t.length > 0);
  const groups: string[][] = [];

  const used = new Set<number>();
  
  // Try bigrams first
  for (let i = 0; i < originalTokens.length - 1; i++) {
    const bigram = originalTokens[i] + ' ' + originalTokens[i + 1];
    const syns = SYNONYM_MAP.get(bigram);
    if (syns) {
      groups.push([bigram, ...Array.from(syns)]);
      used.add(i);
      used.add(i + 1);
    }
  }

  // Then single tokens
  for (let i = 0; i < originalTokens.length; i++) {
    if (used.has(i)) continue;
    const token = originalTokens[i];
    const syns = SYNONYM_MAP.get(token);
    if (syns) {
      groups.push([token, ...Array.from(syns)]);
    } else {
      groups.push([token]);
    }
  }

  return groups;
}

/**
 * Expand a normalized query with synonyms.
 * Returns a deduplicated array of all search tokens (original + synonyms).
 */
export function expandQueryTokens(normalized: string): string[] {
  const groups = expandQueryTokenGroups(normalized);
  const allTokens = new Set<string>();
  
  for (const group of groups) {
    for (const term of group) {
      // Split multi-word synonyms into single tokens for the JS scorer
      for (const st of term.split(' ')) allTokens.add(st);
    }
  }
  
  return Array.from(allTokens);
}

/**
 * Validate and sanitize a search query parameter.
 * Returns null if the query is invalid/empty.
 */
export function sanitizeSearchQuery(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const normalized = normalizeQuery(raw);
  if (normalized.length < 1) return null;
  if (normalized.length > 200) return normalized.substring(0, 200);
  return normalized;
}

/**
 * Score a single CatalogProduct against a search query for client-side relevance ranking.
 *
 * Scoring weights:
 *  100 pts  - Exact product name match
 *   50 pts  - Exact category match
 *   40 pts  - All query tokens found in product name
 *   10 pts  - Per query token found in name
 *    6 pts  - Per query token found in category/department
 *    4 pts  - Per query token found in tags
 *    2 pts  - Per query token found in description (max 8)
 *    0 pts  - In-stock bonus / fallback
 */
export function scoreProduct(
  product: { name: string; category: string; department?: string; tags?: string[]; description?: string; inStock?: boolean },
  normalizedQuery: string,
  tokens: string[]
): number {
  if (!normalizedQuery || tokens.length === 0) return 0;

  const name        = (product.name        || '').toLowerCase();
  const category    = (product.category    || '').toLowerCase();
  const department  = (product.department  || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const tags        = (product.tags        || []).map((t: string) => t.toLowerCase()).join(' ');

  let score = 0;

  // Exact full name match
  if (name === normalizedQuery) score += 100;
  // Name contains the full query
  else if (name.includes(normalizedQuery)) score += 40;

  // Exact category match
  if (category.includes(normalizedQuery)) score += 50;

  // Per-token scoring
  let nameTokenHits = 0;
  let descHits = 0;
  for (const token of tokens) {
    if (token.length < 2) continue;
    if (name.includes(token)) { score += 10; nameTokenHits++; }
    if (category.includes(token)) score += 6;
    if (department.includes(token)) score += 4;
    if (tags.includes(token)) score += 4;
    if (description.includes(token) && descHits < 4) { score += 2; descHits++; }
  }

  // Bonus: all tokens matched in name
  if (nameTokenHits === tokens.length && tokens.length > 1) score += 30;

  // In-stock small bonus
  if (product.inStock) score += 1;

  return score;
}

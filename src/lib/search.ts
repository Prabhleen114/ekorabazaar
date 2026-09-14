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
  tokenGroups: string[][]
): number {
  if (!normalizedQuery || tokenGroups.length === 0) return 0;

  const name        = (product.name        || '').toLowerCase();
  const category    = (product.category    || '').toLowerCase();
  const department  = (product.department  || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const tags        = (product.tags        || []).map((t: string) => t.toLowerCase()).join(' ');

  let score = 0;

  // 1. EXACT INTENT MATCHES (Highest Priority)
  // Reconstruct the conceptually corrected query (first token of each group represents the primary intent)
  const correctedQuery = tokenGroups.map(g => g[0]).join(' ');

  if (name === normalizedQuery || name === correctedQuery) score += 500;
  else if (name.includes(normalizedQuery) || name.includes(correctedQuery)) {
    // If the full phrase is in the title, it's an extremely strong match
    score += 200;
    // Bonus if it starts with the query (e.g. "Rose Fragrance Oil - 100ml")
    if (name.startsWith(normalizedQuery) || name.startsWith(correctedQuery)) score += 50;
  }

  // Very strong bonus if the corrected intent matches the product's actual category
  if (
    category.includes(normalizedQuery) || 
    category.includes(correctedQuery) || 
    tokenGroups.some(g => g.some(t => t.length > 3 && (category.includes(t) || department.includes(t))))
  ) {
    score += 100;
  }

  // 2. GENERIC WORD HANDLING
  const GENERIC_TERMS = new Set(['oil', 'fragrance', 'scent', 'aroma', 'parfum', 'perfume', 'bottle', 'jar', 'mould', 'mold', 'powder', 'liquid', 'base', 'pack', 'bulk']);

  // 3. GROUP-LEVEL SCORING
  let titleGroupsMatched = 0;
  
  for (const group of tokenGroups) {
    let groupMatchedInTitle = false;
    let groupMatchedInDesc = false;
    let groupScore = 0;
    
    // Check if the group as a whole represents a generic concept
    // E.g., if group is ['fragrance', 'scent', 'perfume'], it's a generic concept if it's a single word group.
    const isGenericGroup = group.some(t => GENERIC_TERMS.has(t));

    for (const token of group) {
      if (token.length < 2) continue;
      
      const isGeneric = GENERIC_TERMS.has(token);
      let tokenScore = 0;

      // Title matches are king
      if (name.includes(token)) {
        groupMatchedInTitle = true;
        // Exact token boundary match is better than substring (e.g. 'oil' vs 'soil')
        const isWordBoundary = new RegExp(`\\b${token}\\b`, 'i').test(name);
        
        if (isGeneric) {
          tokenScore = isWordBoundary ? 15 : 10;
        } else {
          tokenScore = isWordBoundary ? 50 : 30; 
        }
      }
      
      // Category matches
      if (category.includes(token)) tokenScore = Math.max(tokenScore, isGeneric ? 10 : 25);
      if (department.includes(token)) tokenScore = Math.max(tokenScore, isGeneric ? 5 : 15);
      if (tags.includes(token)) tokenScore = Math.max(tokenScore, isGeneric ? 5 : 15);
      
      // Description matches (very weak)
      if (description.includes(token)) {
        groupMatchedInDesc = true;
        if (tokenScore === 0) tokenScore = isGeneric ? 2 : 5;
      }
      
      // Take the highest score within the synonym group (don't stack synonyms)
      if (tokenScore > groupScore) groupScore = tokenScore;
    }
    
    if (groupMatchedInTitle) titleGroupsMatched++;
    score += groupScore;
  }

  // 4. MULTI-WORD CONTEXT MULTIPLIERS
  // If the query has multiple distinct concepts (groups) and they ALL match the title, 
  // this is a massive signal that the product is exactly what they want.
  if (tokenGroups.length > 1 && titleGroupsMatched === tokenGroups.length) {
    score += 150; 
  } else if (tokenGroups.length > 2 && titleGroupsMatched >= 2) {
    // Partial but strong multi-word match
    score += 50;
  }

  // 5. PENALIZE ACCESSORIES/PACKAGING FOR MATERIAL QUERIES
  const ACCESSORY_TERMS = ['bottle', 'jar', 'tin', 'container', 'packaging', 'box', 'diffuser', 'stick', 'soap', 'spray', 'pump', 'cap', 'dropper'];
  const queryHasAccessoryTerm = tokenGroups.some(group => group.some(t => ACCESSORY_TERMS.includes(t)));
  
  if (!queryHasAccessoryTerm) {
    const hasAccessoryInName = ACCESSORY_TERMS.some(t => new RegExp(`\\b${t}s?\\b`, 'i').test(name));
    const hasAccessoryInCategory = ACCESSORY_TERMS.some(t => 
      new RegExp(`\\b${t}s?\\b`, 'i').test(category) || 
      new RegExp(`\\b${t}s?\\b`, 'i').test(department)
    );

    if (hasAccessoryInName) {
      score -= 100; // Large penalty if accessory term is in the actual title
    } else if (hasAccessoryInCategory) {
      score -= 30; // Small penalty if it just happens to live in an accessory category
    }
  }

  // 6. IN-STOCK BONUS
  if (product.inStock) score += 5;

  return score;
}

export function getTrigrams(str: string): Set<string> {
  const s = '  ' + str.toLowerCase() + ' ';
  const res = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) res.add(s.slice(i, i + 3));
  return res;
}

export function trigramSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const t1 = getTrigrams(s1);
  const t2 = getTrigrams(s2);
  let inter = 0;
  for (const t of t1) if (t2.has(t)) inter++;
  return inter / (t1.size + t2.size - inter);
}

export function autocorrectTokenGroups(tokenGroups: string[][], catalogTitles: string[]): string[][] {
  return tokenGroups.map(group => {
    const newGroup = [...group];
    for (const token of group) {
      if (token.length < 4) continue;
      
      let bestWord = token;
      let bestSim = 0;
      
      for (const title of catalogTitles) {
        const words = title.toLowerCase().split(/[^a-z0-9]+/);
        for (const w of words) {
          if (w.length < 4) continue;
          // Exact match means no need to correct this token
          if (w === token) {
            bestSim = 1;
            bestWord = w;
            break;
          }
          const sim = trigramSimilarity(token, w);
          if (sim > bestSim) {
            bestSim = sim;
            bestWord = w;
          }
        }
        if (bestSim === 1) break;
      }
      
      if (bestSim > 0.49 && bestWord !== token) {
        newGroup.push(bestWord);
        // Inject synonyms of the corrected word
        const syns = expandQueryTokens(bestWord);
        newGroup.push(...syns);
      }
    }
    return Array.from(new Set(newGroup));
  });
}

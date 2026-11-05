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

import catalogProducts from "@/lib/data/products.json";

export const SYNONYM_GROUPS: string[][] = [
  // Fragrance / Scent
  ['perfume', 'fragrance', 'scent', 'parfum', 'fragnance', 'fragranze', 'fragerance'],
  ['itr', 'attar', 'ittar', 'itar'],
  ['essential oil', 'eo', 'essential'],
  ['fragrance oil', 'fo', 'fragrance oils'],
  ['aroma', 'aromatic', 'aromatherapy'],

  // Ingredient / Material synonyms
  // Waxes - specific varieties kept distinct to prevent cross-material pollution
  ['wax', 'paraffin', 'cera'],
  ['soy wax', 'soya wax', 'soy candle wax'],
  ['beeswax', 'bees wax', 'cera alba'],
  ['coconut wax', 'coco wax'],
  ['paraffin', 'paraffin wax'],
  ['palm wax', 'palm candle wax'],
  ['gel wax', 'jelly wax'],

  ['mold', 'mould', 'silicone mould', 'silicone mold'],
  ['mica', 'pigment', 'color', 'colour', 'colorant'],
  ['lye', 'sodium hydroxide', 'naoh'],
  ['base', 'soap base', 'melt and pour', 'mp base'],
  ['resin', 'epoxy', 'epoxy resin'],

  // Butters - distinct plant butters kept separate to prevent false recommendations
  ['butter', 'raw butter', 'cosmetic butter', 'body butter base'],
  ['shea butter', 'karite'],
  ['mango butter', 'mango kernel butter'],
  ['cocoa butter', 'cacao butter', 'theobroma oil'],
  ['kokum butter', 'kokum'],
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
 * Pre-computed catalog vocabulary for fast fuzzy matching and spell correction.
 */
export const CATALOG_VOCABULARY = new Set<string>();
for (const p of (catalogProducts as any[])) {
  const text = `${p.name || ''} ${p.category || ''} ${p.department || ''} ${Array.isArray(p.tags) ? p.tags.join(' ') : ''}`.toLowerCase();
  for (const w of text.split(/[^a-z0-9]+/)) {
    if (w.length >= 2) CATALOG_VOCABULARY.add(w);
  }
}

/**
 * Compute trigrams of a string with whitespace boundary padding.
 */
export function getTrigrams(str: string): Set<string> {
  const s = '  ' + str.toLowerCase() + ' ';
  const res = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) res.add(s.slice(i, i + 3));
  return res;
}

/**
 * Calculate trigram Jaccard similarity between two strings.
 */
export function trigramSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const t1 = getTrigrams(s1);
  const t2 = getTrigrams(s2);
  let inter = 0;
  for (const t of t1) if (t2.has(t)) inter++;
  return inter / (t1.size + t2.size - inter);
}

/**
 * Strip common English plural and inflectional suffixes based on catalog vocabulary.
 */
export function stemWord(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) {
    const candidate = word.slice(0, -3) + 'y';
    if (CATALOG_VOCABULARY.has(candidate)) return candidate;
  }
  if (word.endsWith('es') && word.length > 4) {
    const base = word.slice(0, -2);
    if (CATALOG_VOCABULARY.has(base)) return base;
    const baseE = word.slice(0, -1);
    if (CATALOG_VOCABULARY.has(baseE)) return baseE;
  }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    const base = word.slice(0, -1);
    if (CATALOG_VOCABULARY.has(base)) return base;
  }
  return word;
}

/**
 * Attempt to split compound words into known catalog vocabulary tokens (e.g., "soywax" -> ["soy", "wax"]).
 */
export function splitCompound(word: string): string[] | null {
  if (word.length < 6) return null;
  for (let i = 3; i <= word.length - 3; i++) {
    const left = word.slice(0, i);
    const right = word.slice(i);
    if (CATALOG_VOCABULARY.has(left) && CATALOG_VOCABULARY.has(right)) {
      return [left, right];
    }
  }
  return null;
}

/**
 * Find fuzzy candidate words from the catalog vocabulary using trigram similarity.
 */
/**
 * Pre-computed trigram index mapping each trigram to vocabulary words for O(1) fuzzy candidate lookup.
 */
const VOCAB_TRIGRAMS = new Map<string, Set<string>>();
const INVERTED_TRIGRAM_INDEX = new Map<string, Set<string>>();

for (const word of CATALOG_VOCABULARY) {
  const trigrams = getTrigrams(word);
  VOCAB_TRIGRAMS.set(word, trigrams);
  for (const tri of trigrams) {
    let s = INVERTED_TRIGRAM_INDEX.get(tri);
    if (!s) {
      s = new Set<string>();
      INVERTED_TRIGRAM_INDEX.set(tri, s);
    }
    s.add(word);
  }
}

/**
 * Find fuzzy candidate words from the catalog vocabulary using inverted trigram index.
 */
export function findFuzzyCandidates(token: string, threshold = 0.32): string[] {
  if (token.length < 3) return [];
  const tokenTrigrams = getTrigrams(token);
  const t1Size = tokenTrigrams.size;
  const candidateCounts = new Map<string, number>();

  for (const tri of tokenTrigrams) {
    const words = INVERTED_TRIGRAM_INDEX.get(tri);
    if (words) {
      for (const w of words) {
        if (Math.abs(w.length - token.length) <= 3) {
          candidateCounts.set(w, (candidateCounts.get(w) || 0) + 1);
        }
      }
    }
  }

  const matches: Array<{ word: string; sim: number }> = [];
  for (const [w, inter] of candidateCounts) {
    const t2Size = VOCAB_TRIGRAMS.get(w)?.size ?? 0;
    const sim = inter / (t1Size + t2Size - inter);
    if (sim >= threshold) {
      matches.push({ word: w, sim });
    }
  }

  matches.sort((a, b) => b.sim - a.sim);
  return matches.slice(0, 3).map(m => m.word);
}

/**
 * Normalize a raw query string:
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Lowercase
 * - Remove punctuation (keep hyphens)
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
 * Expand a normalized query into groups of synonyms and fuzzy corrections.
 * Each group represents one original concept (e.g. ['fragrance', 'scent', 'perfume']).
 * For high precision & high recall, products match if all distinct groups are satisfied.
 */
export function expandQueryTokenGroups(normalized: string): string[][] {
  const originalTokens = normalized.split(' ').filter(t => t.length > 0);
  const groups: string[][] = [];
  const used = new Set<number>();

  // 1. Try bigram synonyms first (e.g. "soy wax", "essential oil")
  for (let i = 0; i < originalTokens.length - 1; i++) {
    const bigram = originalTokens[i] + ' ' + originalTokens[i + 1];
    const syns = SYNONYM_MAP.get(bigram);
    if (syns) {
      const g = new Set<string>([bigram, ...Array.from(syns)]);
      for (const s of Array.from(g)) {
        for (const part of s.split(' ')) g.add(part);
      }
      groups.push(Array.from(g));
      used.add(i);
      used.add(i + 1);
    }
  }

  // 2. Process remaining single tokens
  for (let i = 0; i < originalTokens.length; i++) {
    if (used.has(i)) continue;
    const token = originalTokens[i];

    // Compound word handling (e.g. "soywax" -> ["soy", "wax"])
    const compound = splitCompound(token);
    const subTokens = compound ? compound : [token];

    for (const st of subTokens) {
      const stemmed = stemWord(st);
      const groupTokens = new Set<string>([st, stemmed]);

      // If token and stem are unknown in catalog vocabulary and synonym map, perform fuzzy typo autocorrection
      if (!CATALOG_VOCABULARY.has(st) && !CATALOG_VOCABULARY.has(stemmed) && !SYNONYM_MAP.has(st) && !SYNONYM_MAP.has(stemmed)) {
        const fuzzy = findFuzzyCandidates(st, 0.32);
        for (const f of fuzzy) groupTokens.add(f);
      }

      // Expand synonyms for all tokens currently in this concept group
      for (const term of Array.from(groupTokens)) {
        const syns = SYNONYM_MAP.get(term);
        if (syns) {
          for (const s of syns) {
            for (const part of s.split(' ')) groupTokens.add(part);
          }
        }
      }

      groups.push(Array.from(groupTokens));
    }
  }

  return groups;
}

/**
 * Expand a normalized query with synonyms and fuzzy corrections.
 * Returns a deduplicated array of all search tokens.
 */
export function expandQueryTokens(normalized: string): string[] {
  const groups = expandQueryTokenGroups(normalized);
  const allTokens = new Set<string>();
  for (const group of groups) {
    for (const term of group) {
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
 * Autocorrect token groups based on provided candidate titles (backward compatibility).
 */
export function autocorrectTokenGroups(tokenGroups: string[][], catalogTitles: string[]): string[][] {
  return tokenGroups.map(group => {
    const newGroup = [...group];
    for (const token of group) {
      if (token.length < 3) continue;
      
      let bestWord = token;
      let bestSim = 0;
      
      for (const title of catalogTitles) {
        const words = title.toLowerCase().split(/[^a-z0-9]+/);
        for (const w of words) {
          if (w.length < 3) continue;
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
      
      if (bestSim >= 0.32 && bestWord !== token) {
        newGroup.push(bestWord);
        const syns = expandQueryTokens(bestWord);
        newGroup.push(...syns);
      }
    }
    return Array.from(new Set(newGroup));
  });
}

function hasWordBoundary(str: string, token: string): boolean {
  const idx = str.indexOf(token);
  if (idx === -1) return false;
  const before = idx === 0 || !/[a-z0-9]/.test(str[idx - 1]);
  const after = idx + token.length >= str.length || !/[a-z0-9]/.test(str[idx + token.length]);
  return before && after;
}

/**
 * Score a single product against a search query for relevance ranking.
 *
 * Scoring weights:
 *  500 pts  - Exact title match
 *  250 pts  - Title starts with query
 *  200 pts  - Full query contained in title
 *  150 pts  - All query concept groups matched in title
 *  100 pts  - Category match
 *   50 pts  - Exact word boundary token match in title (non-generic)
 *   30 pts  - Substring token match in title
 *   25 pts  - Token matched in category
 *   15 pts  - Token matched in department/tags
 *    5 pts  - Token matched in description
 *    5 pts  - In-stock availability bonus
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
  const correctedQuery = tokenGroups.map(g => g[0]).join(' ');

  if (name === normalizedQuery || name === correctedQuery) {
    score += 500;
  } else if (name.startsWith(normalizedQuery) || name.startsWith(correctedQuery)) {
    score += 250;
  } else if (name.includes(normalizedQuery) || name.includes(correctedQuery)) {
    score += 200;
  }

  // Very strong bonus if the intent matches the product's actual category
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
    let groupScore = 0;

    for (const token of group) {
      if (token.length < 2) continue;
      
      const isGeneric = GENERIC_TERMS.has(token);
      let tokenScore = 0;

      // Title matches are king
      if (name.includes(token)) {
        groupMatchedInTitle = true;
        const isWordBoundary = hasWordBoundary(name, token);
        tokenScore = isWordBoundary ? (isGeneric ? 20 : 50) : (isGeneric ? 10 : 30);
      }
      
      // Category & department matches
      if (category.includes(token)) tokenScore = Math.max(tokenScore, isGeneric ? 10 : 25);
      if (department.includes(token)) tokenScore = Math.max(tokenScore, isGeneric ? 5 : 15);
      if (tags.includes(token)) tokenScore = Math.max(tokenScore, isGeneric ? 5 : 15);
      
      // Description matches
      if (description.includes(token)) {
        tokenScore = Math.max(tokenScore, isGeneric ? 2 : 5);
      }
      
      if (tokenScore > groupScore) groupScore = tokenScore;
    }
    
    if (groupMatchedInTitle) titleGroupsMatched++;
    score += groupScore;
  }

  // 4. MULTI-WORD CONTEXT MULTIPLIERS
  if (tokenGroups.length > 1 && titleGroupsMatched === tokenGroups.length) {
    score += 150; 
  } else if (tokenGroups.length > 2 && titleGroupsMatched >= 2) {
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
      score -= 100;
    } else if (hasAccessoryInCategory) {
      score -= 30;
    }
  }

  // 6. IN-STOCK BONUS
  if (product.inStock) score += 5;

  return score;
}

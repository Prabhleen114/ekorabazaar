/**
 * Authoritative Canonical Redirects for Confirmed Duplicate Products
 *
 * Mappings:
 * - 399  -> 375  (Mango Butter)
 * - 2383 -> 854  (464 Soy Wax Natural Soy Wax Granule for Candle Making)
 * - 2385 -> 857  (Soy Butter Wax)
 * - 2390 -> 862  (Soy Wax White Chunk AA+)
 * - 2388 -> 932  (Natural Coconut Wax)
 * - 2401 -> 1262 (Bees Wax Natural Yellow)
 * - 2399 -> 1283 (100% Natural Pure Beeswax Pellets White)
 * - 2403 -> 1285 (Raw Shea Butter (Organic Raw) From Africa)
 */

export interface ProductRedirect {
  deprecatedId: string;
  canonicalId: string;
  productName: string;
  category: string;
}

export const CONFIRMED_DUPLICATE_MAPPINGS: ProductRedirect[] = [
  {
    deprecatedId: '399',
    canonicalId: '375',
    productName: 'Mango Butter',
    category: 'Raw Butters & Carrier Oils',
  },
  {
    deprecatedId: '2383',
    canonicalId: '854',
    productName: '464 Soy Wax Natural Soy Wax Granule for Candle Making',
    category: 'Candle Waxes & Additives',
  },
  {
    deprecatedId: '2385',
    canonicalId: '857',
    productName: 'Soy Butter Wax',
    category: 'Candle Waxes & Additives',
  },
  {
    deprecatedId: '2390',
    canonicalId: '862',
    productName: 'Soy Wax White Chunk AA+',
    category: 'Candle Waxes & Additives',
  },
  {
    deprecatedId: '2388',
    canonicalId: '932',
    productName: 'Natural Coconut Wax',
    category: 'Candle Waxes & Additives',
  },
  {
    deprecatedId: '2401',
    canonicalId: '1262',
    productName: 'Bees Wax Natural Yellow',
    category: 'Candle Waxes & Additives',
  },
  {
    deprecatedId: '2399',
    canonicalId: '1283',
    productName: '100% Natural Pure Beeswax Pellets White',
    category: 'Candle Waxes & Additives',
  },
  {
    deprecatedId: '2403',
    canonicalId: '1285',
    productName: 'Raw Shea Butter (Organic Raw) From Africa',
    category: 'Raw Butters & Carrier Oils',
  },
];

export const DEPRECATED_TO_CANONICAL_ID_MAP: Record<string, string> = Object.fromEntries(
  CONFIRMED_DUPLICATE_MAPPINGS.map((m) => [m.deprecatedId, m.canonicalId])
);

export const DEPRECATED_PRODUCT_IDS = new Set(
  CONFIRMED_DUPLICATE_MAPPINGS.map((m) => m.deprecatedId)
);

export function getCanonicalProductId(id: string): string {
  return DEPRECATED_TO_CANONICAL_ID_MAP[id] || id;
}

export function isDeprecatedProductId(id: string): boolean {
  return DEPRECATED_PRODUCT_IDS.has(id);
}

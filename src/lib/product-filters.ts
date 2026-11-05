import { normalizeCategoryName } from "./categories";
import { DEPARTMENTS, getDepartmentForCategory } from "./taxonomy";
import { sanitizeSearchQuery, expandQueryTokens, expandQueryTokenGroups, scoreProduct } from "./search";
import type { Prisma } from "@prisma/client";

export type SortKey = "recommended" | "price_asc" | "price_desc" | "newest" | "discount_desc";

export interface ProductFilterParams {
  q?: string | null;
  category?: string | null;
  department?: string | null;
  discipline?: string | null;
  priceOption?: string | null;
  minPrice?: string | number | null;
  maxPrice?: string | number | null;
  inStockOnly?: boolean | string | null;
  sort?: string | null;
  sortBy?: string | null;
  order?: string | null;
  page?: number | string | null;
  limit?: number | string | null;
}

export interface NormalizedProduct {
  id: string;
  name: string;
  category: string;
  department?: string;
  disciplines?: string[];
  price: number; // In Rupees
  image: string;
  inStock: boolean;
  bulkDiscountAvailable: boolean;
  maxDiscount: number;
  description?: string;
  tags?: string[];
  tiers?: any[];
  variants?: any[];
  isQuoteOnly?: boolean;
}

/**
 * Normalizes legacy and variant sort query parameters into a canonical SortKey.
 */
export function normalizeSortKey(rawSort?: string | null): SortKey {
  if (!rawSort) return "recommended";
  const s = rawSort.toLowerCase().trim();
  if (s === "new" || s === "latest" || s === "newest") return "newest";
  if (s === "price-asc" || s === "low_to_high" || s === "price_low" || s === "price_asc") return "price_asc";
  if (s === "price-desc" || s === "high_to_low" || s === "price_high" || s === "price_desc") return "price_desc";
  if (s === "discount" || s === "discount_high" || s === "discount_desc") return "discount_desc";
  return "recommended";
}

/**
 * Calculates numeric min and max price bounds in Rupees based on priceOption or custom values.
 */
export function parsePriceBounds(
  priceOption?: string | null,
  minPrice?: string | number | null,
  maxPrice?: string | number | null
): { min?: number; max?: number } {
  if (priceOption === "under_500") {
    return { max: 500 };
  }
  if (priceOption === "500_1500") {
    return { min: 500, max: 1500 };
  }
  if (priceOption === "1500_3000") {
    return { min: 1500, max: 3000 };
  }
  if (priceOption === "over_3000") {
    return { min: 3000 };
  }
  if (priceOption === "custom" || minPrice !== undefined || maxPrice !== undefined) {
    const minVal = typeof minPrice === "number" ? minPrice : parseFloat(String(minPrice || ""));
    const maxVal = typeof maxPrice === "number" ? maxPrice : parseFloat(String(maxPrice || ""));
    const res: { min?: number; max?: number } = {};
    if (!isNaN(minVal) && minVal > 0) res.min = minVal;
    if (!isNaN(maxVal) && maxVal > 0) res.max = maxVal;
    return res;
  }
  return {};
}

/**
 * Safely parses any price representation into a numeric Rupee value.
 */
export function normalizePriceRupees(rawPrice: any): number {
  if (typeof rawPrice === "number") {
    return isNaN(rawPrice) ? 0 : rawPrice;
  }
  if (typeof rawPrice === "string") {
    const cleaned = rawPrice.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Typed Map of SortKey to pure comparator function.
 */
export const SORT_COMPARATORS: Record<SortKey, (a: NormalizedProduct, b: NormalizedProduct) => number> = {
  price_asc: (a, b) => {
    const validA = !a.isQuoteOnly && a.inStock && a.price > 0;
    const validB = !b.isQuoteOnly && b.inStock && b.price > 0;
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;
    if (a.price !== b.price) return a.price - b.price;
    return a.name.localeCompare(b.name);
  },
  price_desc: (a, b) => {
    const validA = !a.isQuoteOnly && a.inStock && a.price > 0;
    const validB = !b.isQuoteOnly && b.inStock && b.price > 0;
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;
    if (b.price !== a.price) return b.price - a.price;
    return a.name.localeCompare(b.name);
  },
  newest: (a, b) => {
    const idA = parseInt(a.id, 10);
    const idB = parseInt(b.id, 10);
    const isNumA = !isNaN(idA);
    const isNumB = !isNaN(idB);
    if (!isNumA && isNumB) return -1;
    if (isNumA && !isNumB) return 1;
    if (isNumA && isNumB) return idB - idA;
    return b.id.localeCompare(a.id);
  },
  discount_desc: (a, b) => {
    const discA = a.maxDiscount || 0;
    const discB = b.maxDiscount || 0;
    if (discB !== discA) return discB - discA;
    if (a.bulkDiscountAvailable && !b.bulkDiscountAvailable) return -1;
    if (!a.bulkDiscountAvailable && b.bulkDiscountAvailable) return 1;
    return a.price - b.price;
  },
  recommended: (a, b) => {
    if (a.inStock && !b.inStock) return -1;
    if (!a.inStock && b.inStock) return 1;
    if (a.bulkDiscountAvailable && !b.bulkDiscountAvailable) return -1;
    if (!a.bulkDiscountAvailable && b.bulkDiscountAvailable) return 1;
    const idA = parseInt(a.id, 10);
    const idB = parseInt(b.id, 10);
    if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
    return 0;
  },
};

/**
 * Normalizes a raw product from JSON or Prisma into a standard NormalizedProduct.
 */
function getSearchableText(p: any): string {
  if (p._searchText) return p._searchText;
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : '';
  p._searchText = `${p.name || ''} ${p.category || ''} ${p.department || ''} ${p.description || ''} ${tagsStr} ${p.id || ''}`.toLowerCase();
  return p._searchText;
}

export function normalizeProduct(p: any): NormalizedProduct {
  if (p && (p as any)._isNormalized) return p;
  const rawName = p.name || p.title || "Untitled Product";
  const rawPrice = p.customerPrice !== undefined && p.customerPrice !== null
    ? p.customerPrice / 100
    : (p.price !== undefined && p.price !== null
      ? (typeof p.price === "number" && p.price > 100000 ? p.price / 100 : normalizePriceRupees(p.price))
      : 0);

  const category = normalizeCategoryName(p.category) || p.category || "General Silicone Moulds";
  const department = p.department || getDepartmentForCategory(category) || "Precision Studio Moulds";
  const disciplines = Array.isArray(p.disciplines) ? p.disciplines : [];
  const inStock = p.inStock !== false && (p.stock === undefined || p.stock > 0);
  const isQuoteOnly = p.isQuoteOnly === true || rawPrice === 0;

  return {
    id: String(p.id),
    name: rawName,
    category,
    department,
    disciplines,
    price: rawPrice,
    image: p.image || p.imageUrl || "/og-image.jpg",
    inStock: inStock && !isQuoteOnly,
    bulkDiscountAvailable: Boolean(
      p.bulkDiscountAvailable || (Array.isArray(p.wholesaleTiers) && p.wholesaleTiers.length > 1) || (Array.isArray(p.tiers) && p.tiers.length > 1)
    ),
    maxDiscount: p.maxDiscount || 0,
    description: p.description || "",
    tags: Array.isArray(p.tags) ? p.tags : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
    tiers: Array.isArray(p.tiers) ? p.tiers : (Array.isArray(p.wholesaleTiers) ? p.wholesaleTiers : []),
    isQuoteOnly,
    _isNormalized: true
  } as any;
}

/**
 * Pure, non-mutating filtering and sorting function for in-memory catalogs (products.json).
 */
export function filterAndSortCatalogProducts(
  rawProducts: any[],
  params: ProductFilterParams
): { items: NormalizedProduct[]; total: number; totalPages: number; page: number; limit: number } {
  const sortKey = normalizeSortKey(params.sort || params.sortBy || params.order);
  const rawCategory = params.category ? String(params.category).trim() : null;
  const normalizedCategory = rawCategory ? normalizeCategoryName(rawCategory) : null;
  const department = params.department ? String(params.department).trim().toLowerCase() : null;
  const discipline = params.discipline ? String(params.discipline).trim() : null;
  const inStockOnly = params.inStockOnly === true || params.inStockOnly === "true";
  const bounds = parsePriceBounds(params.priceOption, params.minPrice, params.maxPrice);

  const rawQ = params.q ? String(params.q).trim() : null;
  const normalizedQ = sanitizeSearchQuery(rawQ);
  const searchTokens = normalizedQ ? expandQueryTokens(normalizedQ) : [];
  const hasSearch = normalizedQ !== null && normalizedQ.length > 0;

  // 1. Normalize all products
  const normalized = rawProducts.map(normalizeProduct);

  const passesFacetFilters = (p: NormalizedProduct) => {
    if (normalizedCategory) {
      const pCat = (p.category || "").toLowerCase();
      const targetCat = normalizedCategory.toLowerCase();
      if (targetCat === "fragrance oils") {
        if (pCat !== "fragrance oils" && pCat !== "skin safe fragrances") {
          return false;
        }
      } else if (pCat !== targetCat) {
        return false;
      }
    }

    if (department && p.department && p.department.toLowerCase() !== department) {
      return false;
    }

    if (discipline && (!p.disciplines || !p.disciplines.includes(discipline))) {
      return false;
    }

    if (inStockOnly && !p.inStock) {
      return false;
    }

    if (bounds.min !== undefined && p.price < bounds.min) {
      return false;
    }
    if (bounds.max !== undefined && p.price > bounds.max) {
      return false;
    }

    return true;
  };

  const tokenGroups = normalizedQ ? expandQueryTokenGroups(normalizedQ) : [];

  // 2. Filter (pure predicate) with concept group matching
  let filtered = normalized.filter((p) => {
    if (!passesFacetFilters(p)) return false;

    if (hasSearch && tokenGroups.length > 0) {
      const searchable = getSearchableText(p);
      // Must match at least one token from EVERY query concept group
      const matchesAll = tokenGroups.every((group) =>
        group.some((token) => searchable.includes(token))
      );
      if (!matchesAll) return false;
    }

    return true;
  });

  // Fallback to partial group matching if strict AND yields 0 on a multi-concept query
  if (hasSearch && filtered.length === 0 && tokenGroups.length > 1) {
    filtered = normalized.filter((p) => {
      if (!passesFacetFilters(p)) return false;
      const searchable = getSearchableText(p);
      return tokenGroups.some((group) => group.some((token) => searchable.includes(token)));
    });
  }

  // 3. Sort (pure copy)
  let sorted = [...filtered];
  if (hasSearch && normalizedQ && sortKey === "recommended") {
    const scored = sorted.map((product) => ({
      product,
      score: scoreProduct(product as any, normalizedQ, tokenGroups),
    }));
    scored.sort((a, b) => b.score - a.score);
    sorted = scored.map((s) => s.product);
  } else {
    const comparator = SORT_COMPARATORS[sortKey] || SORT_COMPARATORS.recommended;
    sorted.sort(comparator);
  }

  // 4. Paginate
  const page = Math.max(parseInt(String(params.page || "1"), 10) || 1, 1);
  const rawLimit = params.limit;
  let limit = 48;
  if (rawLimit === "all") {
    limit = 5000;
  } else if (rawLimit) {
    const parsed = parseInt(String(rawLimit), 10);
    if (!isNaN(parsed) && parsed > 0) limit = Math.min(parsed, 5000);
  }

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const skip = (page - 1) * limit;
  const paginated = sorted.slice(skip, skip + limit);

  return {
    items: paginated,
    total,
    totalPages,
    page,
    limit,
  };
}

/**
 * Translates HTTP query parameters into Prisma where, orderBy, take, skip clauses.
 */
export function buildPrismaProductQuery(params: ProductFilterParams): {
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput;
  take: number;
  skip: number;
  page: number;
  limit: number;
} {
  const sortKey = normalizeSortKey(params.sort || params.sortBy || params.order);
  const rawCategory = params.category ? String(params.category).trim() : null;
  const normalizedCategory = rawCategory ? normalizeCategoryName(rawCategory) : null;
  const department = params.department ? String(params.department).trim() : null;
  const inStockOnly = params.inStockOnly === true || params.inStockOnly === "true";
  const bounds = parsePriceBounds(params.priceOption, params.minPrice, params.maxPrice);

  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED" as any,
    OR: [
      { sellerId: null },
      { seller: { accountStatus: "ACTIVE" as any } },
    ],
  };

  if (params.q) {
    where.title = { contains: String(params.q).trim(), mode: "insensitive" as any };
  }

  if (normalizedCategory) {
    if (normalizedCategory.toLowerCase() === "fragrance oils") {
      where.OR = [
        { category: { equals: "Fragrance Oils", mode: "insensitive" as any } },
        { category: { equals: "Skin Safe Fragrances", mode: "insensitive" as any } },
      ];
    } else {
      where.category = { equals: normalizedCategory, mode: "insensitive" as any };
    }
  } else if (department) {
    const deptConfig = DEPARTMENTS.find(d => d.name.toLowerCase() === department.toLowerCase());
    if (deptConfig && deptConfig.subcategories.length > 0) {
      where.category = { in: deptConfig.subcategories };
    }
  }

  if (bounds.min !== undefined || bounds.max !== undefined) {
    where.price = {};
    if (bounds.min !== undefined) {
      where.price.gte = Math.round(bounds.min * 100); // Convert Rupees to Paise for DB
    }
    if (bounds.max !== undefined) {
      where.price.lte = Math.round(bounds.max * 100); // Convert Rupees to Paise for DB
    }
  }

  if (inStockOnly) {
    where.stock = { gt: 0 };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sortKey === "price_asc") {
    orderBy = { price: "asc" };
  } else if (sortKey === "price_desc") {
    orderBy = { price: "desc" };
  } else if (sortKey === "newest") {
    orderBy = { createdAt: "desc" };
  } else {
    orderBy = { createdAt: "desc" };
  }

  const page = Math.max(parseInt(String(params.page || "1"), 10) || 1, 1);
  const rawLimit = params.limit;
  let limit = 48;
  if (rawLimit === "all") {
    limit = 5000;
  } else if (rawLimit) {
    const parsed = parseInt(String(rawLimit), 10);
    if (!isNaN(parsed) && parsed > 0) limit = Math.min(parsed, 5000);
  }
  const skip = (page - 1) * limit;

  return {
    where,
    orderBy,
    take: limit,
    skip,
    page,
    limit,
  };
}

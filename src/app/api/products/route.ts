import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { getDepartmentForCategory, DEPARTMENTS } from "@/lib/taxonomy";
import { normalizeCategoryName } from "@/lib/categories";
import catalogProducts from "@/lib/data/products.json";
import {
  sanitizeSearchQuery,
  expandQueryTokens,
  expandQueryTokenGroups,
  scoreProduct,
} from "@/lib/search";

export const dynamic = 'force-dynamic';

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  department: string;
  disciplines: string[];
  price: number;
  image: string;
  inStock: boolean;
  bulkDiscountAvailable: boolean;
  maxDiscount: number;
  description: string;
  tags: string[];
  tiers: any[];
  isQuoteOnly: boolean;
}

// Module-Level In-Memory Singleton: parsed once across warm serverless invocations
let cachedCatalog: CatalogProduct[] | null = null;
let cachedFacets: {
  departments: Record<string, number>;
  categories: Record<string, number>;
  disciplines: Record<string, number>;
} | null = null;

// Seller product cache: refreshed every 60s to avoid per-request DB round-trips
let cachedSellerProducts: CatalogProduct[] | null = null;
let cachedSellerProductsAt = 0;

function normalizeProductCore(text: string): string {
  const base = (text || "").split(/[|—–]/)[0].toUpperCase();
  return base
    .replace(/\b(VEDINI|JINDEAL|LYBA|EKORA\s*BAZAAR|EKORA)\b/g, "")
    .replace(/\b(WITH\s+MARKINGS|WITH\s+JUG\s+BEAKER\s+MARKINGS|WITH\s+BEAKER\s+MARKINGS)\b/g, "")
    .replace(/\b(FOR\s+DIY\s+CANDLE\s+MAKING|FOR\s+CANDLE\s+MAKING|FOR\s+SOAP\s+MAKING|FOR\s+RESIN\s+ART)\b/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function getSingletonCatalog(): { catalog: CatalogProduct[]; facets: NonNullable<typeof cachedFacets> } {
  if (cachedCatalog && cachedFacets) {
    return { catalog: cachedCatalog, facets: cachedFacets };
  }

  const deptCounts: Record<string, number> = {};
  const catCounts: Record<string, number> = {};
  const discCounts: Record<string, number> = {};
  const seenCores = new Set<string>();

  const catalog: CatalogProduct[] = [];

  for (const p of (catalogProducts as any[])) {
    const rawName = p.name || p.title || "Untitled Product";
    const core = normalizeProductCore(rawName);
    if (core.length >= 8) {
      if (seenCores.has(core)) continue;
      seenCores.add(core);
    }

    let priceVal = typeof p.price === "number" ? p.price : parseFloat(p.price || "0");
    if (isNaN(priceVal) || priceVal < 0) priceVal = 0;
    
    const isQuoteOnly = p.isQuoteOnly === true || priceVal === 0 || p.inStock === false;
    const category = normalizeCategoryName(p.category) || "General Silicone Moulds";
    const department = p.department || getDepartmentForCategory(category) || "Precision Studio Moulds";
    const disciplines = Array.isArray(p.disciplines) ? p.disciplines : [];

    deptCounts[department] = (deptCounts[department] || 0) + 1;
    catCounts[category] = (catCounts[category] || 0) + 1;
    if (category === "Skin Safe Fragrances") {
      catCounts["Fragrance Oils"] = (catCounts["Fragrance Oils"] || 0) + 1;
    }
    disciplines.forEach((d: string) => {
      discCounts[d] = (discCounts[d] || 0) + 1;
    });

    catalog.push({
      id: String(p.id),
      name: rawName,
      category,
      department,
      disciplines,
      price: priceVal,
      image: p.image || p.imageUrl || "/og-image.jpg",
      inStock: p.inStock !== false && !isQuoteOnly,
      bulkDiscountAvailable: isQuoteOnly ? false : (p.bulkDiscountAvailable ?? (Array.isArray(p.tiers) && p.tiers.length > 1)),
      maxDiscount: isQuoteOnly ? 0 : (p.maxDiscount ?? 0),
      description: p.description || "",
      tags: Array.isArray(p.tags) ? p.tags : [],
      tiers: isQuoteOnly ? [] : (Array.isArray(p.tiers) ? p.tiers : []),
      isQuoteOnly
    });
  }

  cachedCatalog = catalog;
  cachedFacets = { departments: deptCounts, categories: catCounts, disciplines: discCounts };

  return { catalog: cachedCatalog, facets: cachedFacets };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Pagination
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
  const rawLimit = searchParams.get("limit");
  let limit = 48;
  if (rawLimit === "all") {
    limit = 5000;
  } else if (rawLimit) {
    const parsed = parseInt(rawLimit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 5000);
    }
  }
  const skip = (page - 1) * limit;

  // Filter params
  const rawCategory   = searchParams.get("category");
  const normalizedCategory = rawCategory ? normalizeCategoryName(rawCategory) : null;
  const department    = searchParams.get("department");
  const discipline    = searchParams.get("discipline");
  const priceOption   = searchParams.get("priceOption");
  const minPrice      = searchParams.get("minPrice");
  const maxPrice      = searchParams.get("maxPrice");
  const inStockOnly   = searchParams.get("inStockOnly") === "true";
  const sortBy        = searchParams.get("sortBy") || "recommended";

  // Search tokens
  const rawQ          = searchParams.get("q");
  const normalizedQ   = sanitizeSearchQuery(rawQ);
  const searchTokens  = normalizedQ ? expandQueryTokens(normalizedQ) : [];
  const hasSearch     = normalizedQ !== null && normalizedQ.length > 0;

  // Get authoritative curated catalog
  const { catalog: baseCatalog, facets: baseFacets } = getSingletonCatalog();
  let allProducts: CatalogProduct[] = [...baseCatalog];

  // Merge any active 3rd-party marketplace seller products if available.
  // We cache this per warm serverless instance with a 60-second TTL to avoid
  // a live Supabase round-trip on every single page load.
  let sellerProductsFromDB: CatalogProduct[] = [];
  const now = Date.now();
  if (!cachedSellerProducts || (now - cachedSellerProductsAt) > 60_000) {
    try {
      const dbSellerProducts = await Promise.race([
        prisma.product.findMany({
          where: {
            sellerId: { not: null },
            status: ProductStatus.PUBLISHED,
            seller: { accountStatus: 'ACTIVE' }
          },
          include: { seller: true },
          take: 200
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB timeout")), 1500)
        )
      ]);

      if (Array.isArray(dbSellerProducts) && dbSellerProducts.length > 0) {
        sellerProductsFromDB = dbSellerProducts.map(p => {
          const effectivePriceINR = (p.customerPrice ?? p.price) / 100;
          const cat = normalizeCategoryName(p.category) || "General Silicone Moulds";
          const dept = getDepartmentForCategory(cat) || "Precision Studio Moulds";
          const isQuoteOnly = p.stock <= 0 || effectivePriceINR <= 0;
          return {
            id: p.id,
            name: p.title,
            category: cat,
            department: dept,
            disciplines: [],
            price: effectivePriceINR,
            image: p.imageUrl || "/og-image.jpg",
            inStock: p.stock > 0 && !isQuoteOnly,
            bulkDiscountAvailable: isQuoteOnly ? false : (Array.isArray(p.wholesaleTiers) && (p.wholesaleTiers as any[]).length > 0),
            maxDiscount: 0,
            description: p.description || "",
            tags: [],
            tiers: isQuoteOnly ? [] : ((p.wholesaleTiers as any[]) || []),
            isQuoteOnly
          };
        });
      }
      cachedSellerProducts = sellerProductsFromDB;
      cachedSellerProductsAt = now;
    } catch (_err) {
      // DB offline, slow, or timed out — serve from JSON catalog only
      if (cachedSellerProducts) {
        sellerProductsFromDB = cachedSellerProducts; // use stale if available
      }
    }
  } else {
    sellerProductsFromDB = cachedSellerProducts;
  }

  if (sellerProductsFromDB.length > 0) {
    allProducts = [...sellerProductsFromDB, ...baseCatalog];
  }

  // Filter catalog
  const filtered = allProducts.filter(p => {
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
    if (department && p.department.toLowerCase() !== department.toLowerCase()) {
      return false;
    }
    if (discipline && (!p.disciplines || !p.disciplines.includes(discipline))) {
      return false;
    }
    if (hasSearch && normalizedQ) {
      const name   = p.name.toLowerCase();
      const cat    = (p.category || '').toLowerCase();
      const desc   = (p.description || '').toLowerCase();
      const tagStr = (p.tags || []).map((t: string) => t.toLowerCase()).join(' ');
      const matches = searchTokens.some(token =>
        name.includes(token) || cat.includes(token) || tagStr.includes(token) || desc.includes(token)
      );
      if (!matches) return false;
    }
    if (inStockOnly && !p.inStock) return false;
    if (priceOption === "under_500"  && p.price >= 500) return false;
    if (priceOption === "500_1500"   && (p.price < 500  || p.price > 1500)) return false;
    if (priceOption === "1500_3000"  && (p.price < 1500 || p.price > 3000)) return false;
    if (priceOption === "over_3000"  && p.price <= 3000) return false;
    if (priceOption === "custom") {
      const minVal = parseFloat(minPrice || "");
      const maxVal = parseFloat(maxPrice || "");
      if (!isNaN(minVal) && minVal > 0 && p.price < minVal) return false;
      if (!isNaN(maxVal) && maxVal > 0 && p.price > maxVal) return false;
    }
    return true;
  });

  // Sorting
  if (hasSearch && normalizedQ && sortBy === "recommended") {
    const tokenGroups = expandQueryTokenGroups(normalizedQ);
    const scored = filtered.map(p => ({
      product: p,
      score: scoreProduct(p, normalizedQ, tokenGroups)
    }));
    scored.sort((a, b) => b.score - a.score);
    filtered.length = 0;
    scored.forEach(({ product }) => filtered.push(product));
  } else if (sortBy === "price_asc") {
    filtered.sort((a, b) => {
      // Prioritize items with positive prices, put quote-only (price <= 0) at the end
      if (a.price <= 0 && b.price > 0) return 1;
      if (b.price <= 0 && a.price > 0) return -1;
      return a.price - b.price;
    });
  } else if (sortBy === "price_desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === "newest") {
    filtered.sort((a, b) => {
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      if (!isNaN(idA) && !isNaN(idB)) return idB - idA;
      return b.id.localeCompare(a.id);
    });
  } else if (sortBy === "discount_desc") {
    filtered.sort((a, b) => (b.maxDiscount || 0) - (a.maxDiscount || 0));
  } else if (sortBy === "name_asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "name_desc") {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === "recommended") {
    filtered.sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      if (a.bulkDiscountAvailable && !b.bulkDiscountAvailable) return -1;
      if (!a.bulkDiscountAvailable && b.bulkDiscountAvailable) return 1;
      return 0;
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = filtered.slice(skip, skip + limit);
  const hasMore = skip + limit < total;

  return NextResponse.json({
    items: paginated,
    products: paginated,
    total,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
      hasNextPage: hasMore
    },
    facets: baseFacets,
    searchMeta: hasSearch ? {
      query: normalizedQ,
      tokens: searchTokens,
      expanded: searchTokens.length > (normalizedQ ? normalizedQ.split(' ').length : 0)
    } : null
  }, {
    headers: {
      "Cache-Control": hasSearch
        ? "public, s-maxage=60, stale-while-revalidate=300"
        : "public, s-maxage=300, stale-while-revalidate=86400",
    }
  });
}


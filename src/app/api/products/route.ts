import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus, Prisma } from "@prisma/client";
import { getDepartmentForCategory, DEPARTMENTS } from "@/lib/taxonomy";
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

// Module-Level In-Memory Singleton: parsed once across warm serverless invocations for fallback & facets
let cachedCatalog: CatalogProduct[] | null = null;
let cachedFacets: {
  departments: Record<string, number>;
  categories: Record<string, number>;
  disciplines: Record<string, number>;
} | null = null;

function normalizeProductCore(text: string): string {
  const base = (text || "").split(/[|—–]/)[0].toUpperCase();
  return base
    .replace(/\b(VEDINI|JINDEAL|LYBA|EKORA\s*BAZAAR|EKORA)\b/g, "")
    .replace(/\b(WITH\s+MARKINGS|WITH\s+JUG\s+BEAKER\s+MARKINGS|WITH\s+BEAKER\s+MARKINGS)\b/g, "")
    .replace(/\b(FOR\s+DIY\s+CANDLE\s+MAKING|FOR\s+CANDLE\s+MAKING|FOR\s+SOAP\s+MAKING|FOR\s+RESIN\s+ART)\b/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function getSingletonCatalog(): { catalog: CatalogProduct[]; facets: typeof cachedFacets } {
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
    const category = p.category || "General Silicone Moulds";
    const department = p.department || getDepartmentForCategory(category) || "Precision Studio Moulds";
    const disciplines = Array.isArray(p.disciplines) ? p.disciplines : [];

    deptCounts[department] = (deptCounts[department] || 0) + 1;
    catCounts[category] = (catCounts[category] || 0) + 1;
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
  const category   = searchParams.get("category");
  const department = searchParams.get("department");
  const discipline = searchParams.get("discipline");
  const priceOption  = searchParams.get("priceOption");
  const minPrice     = searchParams.get("minPrice");
  const maxPrice     = searchParams.get("maxPrice");
  const inStockOnly  = searchParams.get("inStockOnly") === "true";
  const sortBy       = searchParams.get("sortBy") || "recommended";

  // --- Search: validate, normalize, expand with synonyms ---
  const rawQ       = searchParams.get("q");
  const normalizedQ = sanitizeSearchQuery(rawQ);
  const searchTokens = normalizedQ ? expandQueryTokens(normalizedQ) : [];
  const hasSearch  = normalizedQ !== null && normalizedQ.length > 0;

  const { facets: baseFacets } = getSingletonCatalog();

  // 1. Try Direct Database-First Pagination (PostgreSQL)
  try {
    const dbWhere: any = {
      status: ProductStatus.PUBLISHED,
      OR: [
        { sellerId: null },
        { seller: { accountStatus: 'ACTIVE' } }
      ]
    };

    // Category / Department Filters
    if (category) {
      dbWhere.category = category;
    } else if (department) {
      const cats = DEPARTMENTS.find(d => d.name.toLowerCase() === department.toLowerCase())?.subcategories || [];
      if (cats.length > 0) {
        dbWhere.category = { in: cats };
      }
    }

    // Availability Filter
    if (inStockOnly) {
      dbWhere.stock = { gt: 0 };
    }

    // Price Filter (prices stored in paise)
    if (priceOption === "under_500") {
      dbWhere.price = { lt: 50000 };
    } else if (priceOption === "500_1500") {
      dbWhere.price = { gte: 50000, lte: 150000 };
    } else if (priceOption === "1500_3000") {
      dbWhere.price = { gte: 150000, lte: 300000 };
    } else if (priceOption === "over_3000") {
      dbWhere.price = { gt: 300000 };
    } else if (priceOption === "custom") {
      const minVal = parseFloat(minPrice || "");
      const maxVal = parseFloat(maxPrice || "");
      const priceFilter: any = {};
      if (!isNaN(minVal) && minVal > 0) priceFilter.gte = Math.round(minVal * 100);
      if (!isNaN(maxVal) && maxVal > 0) priceFilter.lte = Math.round(maxVal * 100);
      if (Object.keys(priceFilter).length > 0) dbWhere.price = priceFilter;
    }

    // Multi-token Search Filter
    if (hasSearch && normalizedQ) {
      const orClauses: any[] = [
        { title: { contains: normalizedQ, mode: 'insensitive' } },
        { category: { contains: normalizedQ, mode: 'insensitive' } },
        { description: { contains: normalizedQ, mode: 'insensitive' } }
      ];

      for (const token of searchTokens) {
        if (token.length >= 2) {
          orClauses.push({ title: { contains: token, mode: 'insensitive' } });
          orClauses.push({ category: { contains: token, mode: 'insensitive' } });
        }
      }

      dbWhere.AND = [{ OR: orClauses }];
    }

    // Ordering
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    // Direct Database Query with Take & Skip
    const [total, dbProducts] = await Promise.all([
      prisma.product.count({ where: dbWhere }),
      prisma.product.findMany({
        where: dbWhere,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          customerPrice: true,
          stock: true,
          imageUrl: true,
          wholesaleTiers: true,
          description: true,
        }
      })
    ]);

    // If database returned records and no specialized studio discipline is requested, map and return them
    if (!discipline && (total > 0 || (category || department || priceOption || hasSearch || inStockOnly))) {
      const items = dbProducts.map(p => {
        const effectivePriceINR = (p.customerPrice ?? p.price) / 100;
        const dept = getDepartmentForCategory(p.category) || "Precision Studio Moulds";
        const isQuoteOnly = p.stock <= 0 || effectivePriceINR <= 0;
        return {
          id: p.id,
          name: p.title,
          category: p.category || "General Silicone Moulds",
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

      const totalPages = Math.ceil(total / limit);
      const hasMore = skip + limit < total;

      return NextResponse.json({
        items,
        products: items,
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
  } catch (dbErr) {
    // Database unavailable or offline: gracefully continue to static catalog fallback below
    console.warn("DB query unavailable, falling back to static catalog:", (dbErr as any)?.message);
  }

  // 2. Fallback: Static Catalog Mode (products.json)
  const { catalog: baseCatalog } = getSingletonCatalog();
  const allProducts = [...baseCatalog];

  const filtered = allProducts.filter(p => {
    if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
    if (department && p.department.toLowerCase() !== department.toLowerCase()) return false;
    if (discipline && (!p.disciplines || !p.disciplines.includes(discipline))) return false;
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
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    filtered.sort((a, b) => b.price - a.price);
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

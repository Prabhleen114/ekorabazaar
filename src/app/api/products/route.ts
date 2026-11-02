import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { getDepartmentForCategory } from "@/lib/taxonomy";
import { normalizeCategoryName } from "@/lib/categories";
import catalogProducts from "@/lib/data/products.json";
import {
  filterAndSortCatalogProducts,
  normalizeSortKey,
  ProductFilterParams
} from "@/lib/product-filters";
import {
  sanitizeSearchQuery,
  expandQueryTokens
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

  const filterParams: ProductFilterParams = {
    q: searchParams.get("q"),
    category: searchParams.get("category"),
    department: searchParams.get("department"),
    discipline: searchParams.get("discipline"),
    priceOption: searchParams.get("priceOption"),
    minPrice: searchParams.get("minPrice"),
    maxPrice: searchParams.get("maxPrice"),
    inStockOnly: searchParams.get("inStockOnly"),
    sort: searchParams.get("sort") || searchParams.get("sortBy") || searchParams.get("order"),
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "48",
  };

  // Authoritative curated catalog
  const { catalog: baseCatalog, facets: baseFacets } = getSingletonCatalog();
  let allProducts: CatalogProduct[] = [...baseCatalog];

  // Merge any active 3rd-party marketplace seller products if available
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
      if (cachedSellerProducts) {
        sellerProductsFromDB = cachedSellerProducts;
      }
    }
  } else {
    sellerProductsFromDB = cachedSellerProducts;
  }

  if (sellerProductsFromDB.length > 0) {
    allProducts = [...sellerProductsFromDB, ...baseCatalog];
  }

  // Filter & sort using unified pure engine
  const result = filterAndSortCatalogProducts(allProducts, filterParams);
  const normalizedQ = sanitizeSearchQuery(filterParams.q);
  const searchTokens = normalizedQ ? expandQueryTokens(normalizedQ) : [];
  const hasSearch = Boolean(normalizedQ);
  const hasMore = result.page * result.limit < result.total;

  return NextResponse.json({
    items: result.items,
    products: result.items,
    total: result.total,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
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

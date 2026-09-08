import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
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
}

// Module-Level In-Memory Singleton: parsed once across warm serverless invocations
let cachedCatalog: CatalogProduct[] | null = null;
let cachedFacets: {
  departments: Record<string, number>;
  categories: Record<string, number>;
  disciplines: Record<string, number>;
} | null = null;

function getSingletonCatalog(): { catalog: CatalogProduct[]; facets: typeof cachedFacets } {
  if (cachedCatalog && cachedFacets) {
    return { catalog: cachedCatalog, facets: cachedFacets };
  }

  const deptCounts: Record<string, number> = {};
  const catCounts: Record<string, number> = {};
  const discCounts: Record<string, number> = {};

  const catalog: CatalogProduct[] = (catalogProducts as any[]).map(p => {
    let priceVal = typeof p.price === "number" ? p.price : parseFloat(p.price || "0");
    if (isNaN(priceVal) || priceVal < 0) priceVal = 299;
    
    const category = p.category || "General Silicone Moulds";
    const department = p.department || getDepartmentForCategory(category) || "Precision Studio Moulds";
    const disciplines = Array.isArray(p.disciplines) ? p.disciplines : [];

    deptCounts[department] = (deptCounts[department] || 0) + 1;
    catCounts[category] = (catCounts[category] || 0) + 1;
    disciplines.forEach((d: string) => {
      discCounts[d] = (discCounts[d] || 0) + 1;
    });

    return {
      id: String(p.id),
      name: p.name || p.title || "Untitled Product",
      category,
      department,
      disciplines,
      price: priceVal,
      image: p.image || p.imageUrl || "/og-image.jpg",
      inStock: p.inStock !== false,
      bulkDiscountAvailable: p.bulkDiscountAvailable ?? (Array.isArray(p.tiers) && p.tiers.length > 1),
      maxDiscount: p.maxDiscount ?? 0,
      description: p.description || "",
      tags: Array.isArray(p.tags) ? p.tags : [],
      tiers: Array.isArray(p.tiers) ? p.tiers : []
    };
  });

  cachedCatalog = catalog;
  cachedFacets = { departments: deptCounts, categories: catCounts, disciplines: discCounts };

  return { catalog: cachedCatalog, facets: cachedFacets };
}

export async function GET(req: NextRequest) {
  try {
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

    // 1. Get Singleton Catalog & Pre-computed Base Facets
    const { catalog: baseCatalog, facets: baseFacets } = getSingletonCatalog();
    let allProducts = [...baseCatalog];

    // 2. Merge published DB products (DB always wins over JSON catalog on ID collision)
    try {
      let dbProducts: any[] = [];

      if (hasSearch && normalizedQ) {
        // --- FUZZY SEARCH (pg_trgm) ---
        // Use raw SQL to leverage PostgreSQL similarity() for unknown typos
        let sql = `SELECT p.id, p.title, p.category, p.price, p."customerPrice", p.stock, p."imageUrl", p."wholesaleTiers", p.description 
                   FROM "Product" p 
                   INNER JOIN "Seller" s ON p."sellerId" = s.id 
                   WHERE p.status = 'PUBLISHED' AND s."accountStatus" = 'ACTIVE'`;
        
        if (category) {
          sql += ` AND p.category = '${category.replace(/'/g, "''")}'`;
        } else if (department) {
          const cats = DEPARTMENTS.find(d => d.name === department)?.subcategories || [];
          if (cats.length > 0) {
            const catList = cats.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
            sql += ` AND p.category IN (${catList})`;
          }
        }
        if (inStockOnly) sql += ` AND p.stock > 0`;

        const tokenGroups = expandQueryTokenGroups(normalizedQ);
        for (const group of tokenGroups) {
          const groupConds = [];
          for (const token of group) {
            const clean = token.replace(/'/g, "''");
            groupConds.push(`p.title ILIKE '%${clean}%'`);
            groupConds.push(`p.category ILIKE '%${clean}%'`);
            groupConds.push(`p.description ILIKE '%${clean}%'`);
            if (clean.length >= 4) {
              groupConds.push(`similarity(p.title, '${clean}') > 0.3`);
              groupConds.push(`similarity(p.category, '${clean}') > 0.3`);
            }
          }
          sql += ` AND (${groupConds.join(' OR ')})`;
        }

        // Limit the results to avoid fetching too many rows on a broad search
        sql += ` LIMIT 2500`;

        dbProducts = await prisma.$queryRawUnsafe(sql);
      } else {
        // --- EXACT FILTERING ---
        const dbWhere: any = {
          status: ProductStatus.PUBLISHED,
          seller: { accountStatus: 'ACTIVE' },
        };
        if (category) {
          dbWhere.category = category;
        } else if (department) {
          const cats = DEPARTMENTS.find(d => d.name === department)?.subcategories || [];
          dbWhere.category = { in: cats };
        }
        if (inStockOnly) dbWhere.stock = { gt: 0 };

        dbProducts = await prisma.product.findMany({
          where: dbWhere,
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
        });
      }

      for (const p of dbProducts) {
        const effectivePriceINR = (p.customerPrice ?? p.price) / 100;
        const dept = getDepartmentForCategory(p.category) || "Precision Studio Moulds";
        const mappedDbProduct = {
          id: p.id,
          name: p.title,
          category: p.category || "General Silicone Moulds",
          department: dept,
          disciplines: [],
          price: effectivePriceINR,
          image: p.imageUrl || "/og-image.jpg",
          inStock: p.stock > 0,
          bulkDiscountAvailable: Array.isArray(p.wholesaleTiers) && (p.wholesaleTiers as any[]).length > 0,
          maxDiscount: 0,
          description: p.description || "",
          tags: [],
          tiers: (p.wholesaleTiers as any[]) || []
        };
        
        const existingIndex = allProducts.findIndex(item => item.id === p.id);
        if (existingIndex !== -1) {
          allProducts[existingIndex] = mappedDbProduct;
        } else {
          allProducts.push(mappedDbProduct);
        }
      }
    } catch (dbErr) {
      // DB unavailable: catalog-only mode
    }

    // 3. Apply filters
    const filtered = allProducts.filter(p => {
      // Category filter (exact match)
      if (category && p.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }

      // Department filter (exact match)
      if (department && p.department.toLowerCase() !== department.toLowerCase()) {
        return false;
      }

      // Discipline filter
      if (discipline && (!p.disciplines || !p.disciplines.includes(discipline))) {
        return false;
      }

      // Search: multi-token match across name, category, department, tags, description
      // A product matches if ANY expanded token is found in ANY searchable field.
      // (Ranking by how many tokens match is handled below, not at filter stage.)
      if (hasSearch && normalizedQ) {
        const name        = p.name.toLowerCase();
        const cat         = (p.category || '').toLowerCase();
        const dept        = (p.department || '').toLowerCase();
        const desc        = (p.description || '').toLowerCase();
        const tagStr      = (p.tags || []).map((t: string) => t.toLowerCase()).join(' ');

        const matches = searchTokens.some(token =>
          name.includes(token) ||
          cat.includes(token) ||
          dept.includes(token) ||
          tagStr.includes(token) ||
          desc.includes(token)
        );

        if (!matches) return false;
      }

      // In-stock filter
      if (inStockOnly && !p.inStock) return false;

      // Price brackets
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

    // 4. Sort
    if (hasSearch && normalizedQ && sortBy === "recommended") {
      // Relevance sort: score each product, sort descending
      const scored = filtered.map(p => ({
        product: p,
        score: scoreProduct(p, normalizedQ, searchTokens)
      }));
      scored.sort((a, b) => b.score - a.score);
      filtered.length = 0;
      scored.forEach(({ product }) => filtered.push(product));
    } else if (sortBy === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      // For JSON catalog products (numeric IDs), higher = newer.
      // For DB products (UUID), we fall back to string comparison.
      filtered.sort((a, b) => {
        const aNum = parseInt(a.id, 10);
        const bNum = parseInt(b.id, 10);
        if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
        return b.id > a.id ? 1 : -1;
      });
    } else if (sortBy === "discount_desc") {
      filtered.sort((a, b) => b.maxDiscount - a.maxDiscount);
    }
    // sortBy === "recommended" without search: preserve catalog order

    // 5. Paginate
    const total       = filtered.length;
    const totalPages  = Math.ceil(total / limit);
    const paginated   = filtered.slice(skip, skip + limit);
    const hasMore     = skip + limit < total;

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
      // Echo back parsed search metadata for debugging/UI
      searchMeta: hasSearch ? {
        query: normalizedQ,
        tokens: searchTokens,
        expanded: searchTokens.length > (normalizedQ ? normalizedQ.split(' ').length : 0)
      } : null
    }, {
      headers: {
        // Shorter cache for search queries; longer for catalog browsing
        "Cache-Control": hasSearch
          ? "public, s-maxage=60, stale-while-revalidate=300"
          : "public, s-maxage=300, stale-while-revalidate=86400",
      }
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

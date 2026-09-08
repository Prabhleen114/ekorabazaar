import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { getDepartmentForCategory } from "@/lib/taxonomy";
import catalogProducts from "@/lib/data/products.json";

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

    // Tally facets
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
    
    // Pagination: Enterprise default chunk size = 48
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const rawLimit = searchParams.get("limit");
    
    let limit = 48; // Default chunk size
    if (rawLimit === "all") {
      limit = 5000;
    } else if (rawLimit) {
      const parsed = parseInt(rawLimit, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 5000);
      }
    }
    const skip = (page - 1) * limit;

    // Filter Query Params
    const category = searchParams.get("category");
    const department = searchParams.get("department");
    const discipline = searchParams.get("discipline");
    const q = searchParams.get("q")?.toLowerCase();
    const priceOption = searchParams.get("priceOption");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStockOnly = searchParams.get("inStockOnly") === "true";
    const sortBy = searchParams.get("sortBy") || "recommended";

    // 1. Get Singleton Catalog & Pre-computed Base Facets
    const { catalog: baseCatalog, facets: baseFacets } = getSingletonCatalog();
    let allProducts = [...baseCatalog];

    // 2. Merge published DB products if available
    try {
      const dbProducts = await prisma.product.findMany({
        where: {
          status: ProductStatus.PUBLISHED,
          seller: { accountStatus: 'ACTIVE' },
        },
        include: {
          seller: { select: { brandName: true, accountStatus: true } }
        }
      });

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
          // DB takes absolute precedence over JSON catalog
          allProducts[existingIndex] = mappedDbProduct;
        } else {
          allProducts.push(mappedDbProduct);
        }
      }
    } catch (dbErr) {
      // Prisma DB query fallback - catalog operates cleanly
    }

    // 3. Apply Multi-Axis Filters
    const filtered = allProducts.filter(p => {
      // Category filter
      if (category && p.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }

      // Department filter
      if (department && p.department.toLowerCase() !== department.toLowerCase()) {
        return false;
      }

      // Discipline filter
      if (discipline && (!p.disciplines || !p.disciplines.includes(discipline))) {
        return false;
      }

      // Search query across name, category, department, tags
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category && p.category.toLowerCase().includes(q);
        const matchDept = p.department && p.department.toLowerCase().includes(q);
        const matchTag = p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q));
        if (!matchName && !matchCat && !matchDept && !matchTag) return false;
      }

      // In stock
      if (inStockOnly && !p.inStock) {
        return false;
      }

      // Price brackets
      if (priceOption === "under_500" && p.price >= 500) return false;
      if (priceOption === "500_1500" && (p.price < 500 || p.price > 1500)) return false;
      if (priceOption === "1500_3000" && (p.price < 1500 || p.price > 3000)) return false;
      if (priceOption === "over_3000" && p.price <= 3000) return false;
      if (priceOption === "custom") {
        const minVal = parseFloat(minPrice || "");
        const maxVal = parseFloat(maxPrice || "");
        if (!isNaN(minVal) && minVal > 0 && p.price < minVal) return false;
        if (!isNaN(maxVal) && maxVal > 0 && p.price > maxVal) return false;
      }

      return true;
    });

    // 4. Sort
    if (sortBy === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => parseInt(b.id || "0") - parseInt(a.id || "0"));
    } else if (sortBy === "discount_desc") {
      filtered.sort((a, b) => b.maxDiscount - a.maxDiscount);
    }

    // 5. Chunk Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedProducts = filtered.slice(skip, skip + limit);
    const hasMore = skip + limit < total;

    return NextResponse.json({
      items: paginatedProducts,
      products: paginatedProducts, // dual-field for seamless compatibility
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
        hasNextPage: hasMore
      },
      facets: baseFacets
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      }
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

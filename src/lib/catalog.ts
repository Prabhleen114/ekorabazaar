import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { getDepartmentForCategory } from "@/lib/taxonomy";
import { normalizeCategoryName } from "@/lib/categories";
import catalogProducts from "@/lib/data/products.json";
import { NormalizedProduct } from "@/lib/product-filters";
import { normalizeTierPriceToRupees } from "@/lib/pricing";

export interface CatalogFacets {
  departments: Record<string, number>;
  categories: Record<string, number>;
  disciplines: Record<string, number>;
}

// Module-Level In-Memory Singleton: parsed once across warm serverless invocations
let cachedCatalog: NormalizedProduct[] | null = null;
let cachedFacets: CatalogFacets | null = null;

// Seller product cache: refreshed every 60s to avoid per-request DB round-trips
let cachedSellerProducts: NormalizedProduct[] | null = null;
let cachedSellerProductsAt = 0;

export function normalizeProductCore(text: string): string {
  const base = (text || "").split(/[|—–]/)[0].toUpperCase();
  return base
    .replace(/\b(VEDINI|JINDEAL|LYBA|EKORA\s*BAZAAR|EKORA)\b/g, "")
    .replace(/\b(WITH\s+MARKINGS|WITH\s+JUG\s+BEAKER\s+MARKINGS|WITH\s+BEAKER\s+MARKINGS)\b/g, "")
    .replace(/\b(FOR\s+DIY\s+CANDLE\s+MAKING|FOR\s+CANDLE\s+MAKING|FOR\s+SOAP\s+MAKING|FOR\s+RESIN\s+ART)\b/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export function getSingletonCatalog(): { catalog: NormalizedProduct[]; facets: CatalogFacets } {
  if (cachedCatalog && cachedFacets) {
    return { catalog: cachedCatalog, facets: cachedFacets };
  }

  const deptCounts: Record<string, number> = {};
  const catCounts: Record<string, number> = {};
  const discCounts: Record<string, number> = {};
  const seenCores = new Set<string>();

  const catalog: NormalizedProduct[] = [];

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

    const tagsArr = Array.isArray(p.tags) ? p.tags : [];
    const desc = p.description || "";
    const searchText = `${rawName} ${category} ${department} ${tagsArr.join(' ')} ${desc} ${p.id}`.toLowerCase();

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
      description: desc,
      tags: tagsArr,
      tiers: isQuoteOnly ? [] : (Array.isArray(p.tiers) ? p.tiers : []),
      variants: Array.isArray(p.variants) ? p.variants : [],
      isQuoteOnly,
      _isNormalized: true,
      _searchText: searchText
    } as any);
  }

  cachedCatalog = catalog;
  cachedFacets = { departments: deptCounts, categories: catCounts, disciplines: discCounts };

  return { catalog: cachedCatalog, facets: cachedFacets };
}

export async function getUnifiedCatalog(): Promise<{ catalog: NormalizedProduct[]; facets: CatalogFacets }> {
  const { catalog: baseCatalog, facets: baseFacets } = getSingletonCatalog();
  let allProducts: NormalizedProduct[] = [...baseCatalog];

  let sellerProductsFromDB: NormalizedProduct[] = [];
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
          const desc = p.description || "";
          const searchText = `${p.title || ''} ${cat} ${dept} ${desc} ${p.id}`.toLowerCase();
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
            description: desc,
            tags: [],
            tiers: isQuoteOnly ? [] : ((p.wholesaleTiers as any[]) || [])
              .filter((t: any) => t && Number(t.price) > 0)
              .map((t: any) => ({
                ...t,
                price: normalizeTierPriceToRupees(Number(t.price), p.customerPrice ?? p.price),
                minQty: Number(t.minQty) || 1
              })),
            isQuoteOnly,
            _isNormalized: true,
            _searchText: searchText
          } as any;
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
    const baseIds = new Set(baseCatalog.map(p => String(p.id)));
    const uniqueSellerProducts = sellerProductsFromDB.filter(p => !baseIds.has(String(p.id)));
    allProducts = [...uniqueSellerProducts, ...baseCatalog];
  }

  return { catalog: allProducts, facets: baseFacets };
}

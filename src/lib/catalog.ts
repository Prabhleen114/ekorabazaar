import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { getDepartmentForCategory } from "@/lib/taxonomy";
import { normalizeCategoryName } from "@/lib/categories";
import catalogProducts from "@/lib/data/products.json";
import { NormalizedProduct } from "@/lib/product-filters";
import { normalizeTierPriceToRupees, normalizeProductBasePriceToINR, normalizeTierPriceToINR, normalizeProductMrpToINR } from "@/lib/pricing";

export interface CatalogFacets {
  departments: Record<string, number>;
  categories: Record<string, number>;
  disciplines: Record<string, number>;
}

// Module-Level In-Memory Singleton: parsed once across warm serverless invocations
let cachedCatalog: NormalizedProduct[] | null = null;
let cachedFacets: CatalogFacets | null = null;

// DB overlay cache: refreshed every 60s or immediately on admin product edit
let cachedDbRows: any[] | null = null;
let cachedDbRowsAt = 0;

export function invalidateCatalogCache() {
  cachedDbRows = null;
  cachedDbRowsAt = 0;
}

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
  const now = Date.now();
  let dbRows: any[] = [];

  if (!cachedDbRows || now - cachedDbRowsAt > 60_000) {
    try {
      const fetched = await Promise.race([
        prisma.product.findMany({
          where: {
            OR: [
              { adminManaged: true },
              { source: "ADMIN" },
              { source: "CATALOG" },
              { source: "EKORA_OFFICIAL" },
              {
                AND: [
                  { status: ProductStatus.PUBLISHED },
                  { isActive: true },
                  { sellerId: { not: null } },
                  { seller: { accountStatus: "ACTIVE" } },
                ],
              },
            ],
          },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            customerPrice: true,
            mrp: true,
            imageUrl: true,
            images: true,
            category: true,
            stock: true,
            status: true,
            isActive: true,
            source: true,
            adminManaged: true,
            wholesaleTiers: true,
            sellerId: true,
            categoryRef: { select: { name: true } },
            seller: { select: { accountStatus: true } },
          },
          orderBy: { updatedAt: "desc" },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB timeout")), 1800)
        ),
      ]);

      if (Array.isArray(fetched)) {
        dbRows = fetched;
        cachedDbRows = dbRows;
        cachedDbRowsAt = now;
      }
    } catch (_err) {
      if (cachedDbRows) {
        dbRows = cachedDbRows;
      }
    }
  } else {
    dbRows = cachedDbRows;
  }

  if (dbRows.length === 0) {
    return { catalog: [...baseCatalog], facets: baseFacets };
  }

  const dbMap = new Map<string, any>();
  for (const row of dbRows) {
    dbMap.set(String(row.id), row);
  }

  const baseIds = new Set<string>();
  const mergedBaseCatalog: NormalizedProduct[] = [];

  for (const baseProd of baseCatalog) {
    const idStr = String(baseProd.id);
    baseIds.add(idStr);
    const dbRow = dbMap.get(idStr);

    if (!dbRow) {
      mergedBaseCatalog.push(baseProd);
      continue;
    }

    const isPublishedAndActive =
      dbRow.status === ProductStatus.PUBLISHED &&
      dbRow.isActive !== false &&
      (!dbRow.sellerId || dbRow.seller?.accountStatus === "ACTIVE");

    if (!isPublishedAndActive) {
      // Excluded from storefront when unpublished or deactivated by admin
      continue;
    }

    // Admin-managed or DB-overridden product: prefer DB fields over static JSON
    const effectivePriceINR = normalizeProductBasePriceToINR(dbRow);
    const mrpINR = normalizeProductMrpToINR(dbRow);
    const cat = dbRow.categoryRef?.name || normalizeCategoryName(dbRow.category) || baseProd.category;
    const dept = getDepartmentForCategory(cat) || baseProd.department || "Precision Studio Moulds";
    const isQuoteOnly = dbRow.stock <= 0 || effectivePriceINR <= 0;
    const desc = dbRow.description || baseProd.description || "";
    const title = dbRow.title || baseProd.name;
    const dbImages = Array.isArray(dbRow.images) ? dbRow.images.filter(Boolean) : [];
    const image = dbRow.imageUrl || dbImages[0] || baseProd.image;

    const dbTiers = Array.isArray(dbRow.wholesaleTiers)
      ? (dbRow.wholesaleTiers as any[])
          .filter((t: any) => t && Number(t.price) > 0)
          .map((t: any) => ({
            ...t,
            price: normalizeTierPriceToINR(Number(t.price), effectivePriceINR),
            minQty: Number(t.minQty) || 1,
          }))
      : [];

    const tiers = isQuoteOnly
      ? []
      : dbTiers.length > 0
      ? dbTiers
      : baseProd.tiers || [];

    const tagsArr = Array.isArray(baseProd.tags) ? baseProd.tags : [];
    const searchText = `${title} ${cat} ${dept} ${tagsArr.join(" ")} ${desc} ${idStr}`.toLowerCase();

    mergedBaseCatalog.push({
      ...baseProd,
      name: title,
      category: cat,
      department: dept,
      price: effectivePriceINR,
      mrp: mrpINR,
      image,
      inStock: dbRow.stock > 0 && !isQuoteOnly,
      bulkDiscountAvailable: isQuoteOnly ? false : tiers.length > 1,
      description: desc,
      tiers,
      isQuoteOnly,
      _isNormalized: true,
      _searchText: searchText,
    } as any);
  }

  const extraDbProducts: NormalizedProduct[] = [];
  for (const p of dbRows) {
    const idStr = String(p.id);
    if (baseIds.has(idStr)) continue;
    const isPublishedAndActive =
      p.status === ProductStatus.PUBLISHED &&
      p.isActive !== false &&
      (!p.sellerId || p.seller?.accountStatus === "ACTIVE");
    if (!isPublishedAndActive) continue;

    // Only append seller/admin/adminManaged rows not already represented in baseCatalog
    if (!p.sellerId && p.source !== "ADMIN" && !p.adminManaged) continue;

    const effectivePriceINR = normalizeProductBasePriceToINR(p);
    const mrpINR = normalizeProductMrpToINR(p);
    const cat = p.categoryRef?.name || normalizeCategoryName(p.category) || "General Silicone Moulds";
    const dept = getDepartmentForCategory(cat) || "Precision Studio Moulds";
    const isQuoteOnly = p.stock <= 0 || effectivePriceINR <= 0;
    const desc = p.description || "";
    const searchText = `${p.title || ""} ${cat} ${dept} ${desc} ${idStr}`.toLowerCase();
    const dbImages = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    const image = p.imageUrl || dbImages[0] || "/og-image.jpg";

    extraDbProducts.push({
      id: idStr,
      name: p.title,
      category: cat,
      department: dept,
      disciplines: [],
      price: effectivePriceINR,
      mrp: mrpINR,
      image,
      inStock: p.stock > 0 && !isQuoteOnly,
      bulkDiscountAvailable: isQuoteOnly
        ? false
        : Array.isArray(p.wholesaleTiers) && (p.wholesaleTiers as any[]).length > 0,
      maxDiscount: 0,
      description: desc,
      tags: [],
      tiers: isQuoteOnly
        ? []
        : ((p.wholesaleTiers as any[]) || [])
            .filter((t: any) => t && Number(t.price) > 0)
            .map((t: any) => ({
              ...t,
              price: normalizeTierPriceToINR(Number(t.price), effectivePriceINR),
              minQty: Number(t.minQty) || 1,
            })),
      isQuoteOnly,
      _isNormalized: true,
      _searchText: searchText,
    } as any);
  }

  return {
    catalog: [...extraDbProducts, ...mergedBaseCatalog],
    facets: baseFacets,
  };
}

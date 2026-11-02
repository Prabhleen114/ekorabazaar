import { Metadata } from "next";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ShopClient from "./ShopClient";
import prisma from "@/lib/db";
import { Suspense, cache } from "react";
import serialize from "serialize-javascript";
import { generateBreadcrumbSchema } from "@/lib/seo";
import catalogProducts from "@/lib/data/products.json";
import {
  buildPrismaProductQuery,
  filterAndSortCatalogProducts,
  normalizeProduct,
  NormalizedProduct,
  ProductFilterParams
} from "@/lib/product-filters";

interface ResolvedShopData {
  products: NormalizedProduct[];
  total: number;
  totalPages: number;
  page: number;
  source: "db" | "catalog";
}

const getProductsData = cache(async (params: any): Promise<ResolvedShopData> => {
  const filterParams: ProductFilterParams = {
    q: params.q ? String(params.q) : undefined,
    category: params.category ? String(params.category) : undefined,
    department: params.department ? String(params.department) : undefined,
    discipline: params.discipline ? String(params.discipline) : undefined,
    priceOption: params.priceOption ? String(params.priceOption) : undefined,
    minPrice: params.minPrice ? String(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? String(params.maxPrice) : undefined,
    inStockOnly: params.inStockOnly ?? params.inStock,
    sort: params.sort ? String(params.sort) : undefined,
    sortBy: params.sortBy ? String(params.sortBy) : undefined,
    order: params.order ? String(params.order) : undefined,
    page: params.page ? String(params.page) : "1",
    limit: params.limit ? String(params.limit) : "48",
  };

  // Attempt Prisma path first (with strict timeout to handle remote/local DB lag)
  try {
    const { where, orderBy, take, skip, page } = buildPrismaProductQuery(filterParams);
    const queryPromise = Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take,
        skip,
        include: { seller: true }
      }),
      prisma.product.count({ where })
    ]);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 2000)
    );

    const [dbProducts, total] = await Promise.race([queryPromise, timeoutPromise]);

    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      const items = dbProducts.map(p => {
        const effectiveRupees = (p.customerPrice ?? p.price) / 100;
        return normalizeProduct({
          id: p.id,
          name: p.title,
          category: p.category,
          price: effectiveRupees,
          image: p.imageUrl || "/og-image.jpg",
          stock: p.stock,
          wholesaleTiers: p.wholesaleTiers,
          description: p.description,
          inStock: p.stock > 0
        });
      });

      return {
        products: items,
        total,
        totalPages: Math.ceil(total / take) || 1,
        page,
        source: "db"
      };
    }
  } catch (_err) {
    // Database offline, connection refused, or timed out — fallback to catalogProducts
  }

  // Fallback path: In-memory pure filter and sort engine over authoritative products.json
  const result = filterAndSortCatalogProducts(catalogProducts as any[], filterParams);
  return {
    products: result.items,
    total: result.total,
    totalPages: result.totalPages,
    page: result.page,
    source: "catalog"
  };
});

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const data = await getProductsData(params);

  const filterKeys = ["q", "category", "department", "discipline", "priceOption", "minPrice", "maxPrice", "inStockOnly", "inStock", "sort", "sortBy", "order"];
  const hasFilterOrSort = filterKeys.some(k => params[k] !== undefined && params[k] !== "");

  if (data.total === 0) {
    return {
      title: "No Results Found | Ekora Wholesale",
      robots: { index: false, follow: true },
      alternates: { canonical: "https://www.ekorabazaar.in/shop" }
    };
  }

  if (hasFilterOrSort) {
    return {
      title: "Shop Wholesale Products | Ekora Wholesale",
      description: "Browse filtered and sorted wholesale candle waxes, aroma chemicals, and craft raw materials.",
      robots: { index: false, follow: true },
      alternates: { canonical: "https://www.ekorabazaar.in/shop" }
    };
  }

  return {
    title: "Shop Premium Raw Materials & Craft Supplies | Ekora Wholesale",
    description: "Browse our extensive catalog of batch-tested candle waxes, epoxy resins, fragrance oils, and silicone molds at wholesale prices.",
    alternates: { canonical: "https://www.ekorabazaar.in/shop" },
    openGraph: {
      title: "Shop Premium Raw Materials | Ekora Wholesale",
      description: "Browse our extensive catalog of batch-tested candle waxes, epoxy resins, fragrance oils, and silicone molds.",
      url: "https://www.ekorabazaar.in/shop",
      type: "website",
    }
  };
}

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const data = await getProductsData(params);

  // Serialize stable query string for client component keying
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      qs.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
  }
  const stableKey = qs.toString() || "default";

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Wholesale Raw Materials Catalog",
    url: "https://www.ekorabazaar.in/shop",
    description: "Browse our extensive catalog of batch-tested candle waxes, epoxy resins, fragrance oils, and silicone molds at wholesale prices.",
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.ekorabazaar.in" },
    { name: "Shop", url: "https://www.ekorabazaar.in/shop" }
  ]);

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <h1 className="sr-only">Wholesale Craft Supplies and Raw Materials Shop</h1>
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(collectionSchema, { isJSON: true }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(breadcrumbSchema, { isJSON: true }) }}
      />

      <BuyerNavbar />
      
      <Suspense fallback={<div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto w-full min-h-screen animate-pulse bg-brand-linen/10" />}>
        <ShopClient
          key={stableKey}
          initialProducts={data.products}
          initialTotal={data.total}
          initialPage={data.page}
          initialTotalPages={data.totalPages}
        />
      </Suspense>

      <BuyerFooter />
    </main>
  );
}

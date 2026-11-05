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
  filterAndSortCatalogProducts,
  NormalizedProduct,
  ProductFilterParams
} from "@/lib/product-filters";
import { getUnifiedCatalog } from "@/lib/catalog";

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

  // Unified Catalog Engine: Searches the complete authoritative catalog (2,072 products)
  // merged with active 3rd-party marketplace seller products
  const { catalog: allProducts } = await getUnifiedCatalog();
  const result = filterAndSortCatalogProducts(allProducts, filterParams);

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

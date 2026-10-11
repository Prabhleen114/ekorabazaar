import { Metadata } from "next";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ShopClient from "./ShopClient";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { Suspense, cache } from "react";
import serialize from "serialize-javascript";
import { generateItemListSchema, generateBreadcrumbSchema } from "@/lib/seo";

const getProducts = cache(async (params: any) => {
  return prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      OR: [
        { sellerId: null },
        { seller: { accountStatus: 'ACTIVE' } }
      ],
      ...(params.q ? { title: { contains: String(params.q), mode: 'insensitive' as any } } : {}),
      ...(params.category ? { category: String(params.category) } : {}),
      ...(params.department ? { category: { contains: String(params.department), mode: 'insensitive' as any } } : {}),
      ...(params.minPrice ? { price: { gte: Number(params.minPrice) * 100 } } : {}),
      ...(params.maxPrice ? { price: { lte: Number(params.maxPrice) * 100 } } : {}),
      ...(params.inStock === 'true' ? { stock: { gt: 0 } } : {})
    },
    take: 40,
    orderBy: { createdAt: 'desc' }
  });
});

const getProductCount = cache(async (params: any) => {
  // Only query if valid filter parameters are present
  const allowedParams = ['q', 'category', 'department', 'discipline', 'minPrice', 'maxPrice', 'inStock'];
  const hasValidFilters = allowedParams.some(key => params[key] !== undefined);
  
  if (!hasValidFilters) return null; // No filtering applied

  return prisma.product.count({
    where: {
      status: ProductStatus.PUBLISHED,
      OR: [
        { sellerId: null },
        { seller: { accountStatus: 'ACTIVE' } }
      ],
      ...(params.q ? { title: { contains: String(params.q), mode: 'insensitive' as any } } : {}),
      ...(params.category ? { category: String(params.category) } : {}),
      ...(params.department ? { category: { contains: String(params.department), mode: 'insensitive' as any } } : {}),
      ...(params.minPrice ? { price: { gte: Number(params.minPrice) * 100 } } : {}),
      ...(params.maxPrice ? { price: { lte: Number(params.maxPrice) * 100 } } : {}),
      ...(params.inStock === 'true' ? { stock: { gt: 0 } } : {})
    }
  });
});

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const params = await searchParams;
  
  const count = await getProductCount(params);
  if (count === 0) {
    return {
      title: "No Results Found | Ekora Wholesale",
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

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const initialProducts = await getProducts(params);
  await getProductCount(params); // Trigger cache for metadata

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Wholesale Raw Materials Catalog",
    "url": "https://www.ekorabazaar.in/shop",
    "description": "Browse our extensive catalog of batch-tested candle waxes, epoxy resins, fragrance oils, and silicone molds at wholesale prices.",
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
        <ShopClient initialProducts={initialProducts} />
      </Suspense>

      <BuyerFooter />
    </main>
  );
}

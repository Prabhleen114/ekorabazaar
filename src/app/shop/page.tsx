import { Metadata } from "next";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ShopClient from "./ShopClient";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { Suspense } from "react";
import serialize from "serialize-javascript";

export const metadata: Metadata = {
  title: "Shop Premium Raw Materials & Craft Supplies | Ekora Wholesale",
  description: "Browse our extensive catalog of batch-tested candle waxes, epoxy resins, fragrance oils, and silicone molds at wholesale prices.",
  alternates: {
    canonical: "https://www.ekorabazaar.in/shop",
  },
  openGraph: {
    title: "Shop Premium Raw Materials | Ekora Wholesale",
    description: "Browse our extensive catalog of batch-tested candle waxes, epoxy resins, fragrance oils, and silicone molds.",
    url: "https://www.ekorabazaar.in/shop",
    type: "website",
  }
};

export default async function ShopPage() {
  const dbProducts = await prisma.product.findMany({
    where: { 
      status: ProductStatus.PUBLISHED,
      seller: { accountStatus: 'ACTIVE' }
    },
    take: 20
  });

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Wholesale Raw Materials Catalog",
    "url": "https://www.ekorabazaar.in/shop",
    "description": "Premium craft supplies and raw materials for creators.",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": dbProducts.map((product, index) => {
        const effectivePrice = (product.customerPrice ?? product.price) / 100;
        return {
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": product.title,
            "image": product.imageUrl || "https://www.ekorabazaar.in/og-image.jpg",
            "url": `https://www.ekorabazaar.in/products/${product.id}`,
            "offers": {
              "@type": "Offer",
              "price": effectivePrice,
              "priceCurrency": "INR"
            }
          }
        };
      })
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.ekorabazaar.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shop",
        "item": "https://www.ekorabazaar.in/shop"
      }
    ]
  };

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
      
      <Suspense fallback={<div className="pt-24 pb-12 px-6 max-w-7xl mx-auto w-full min-h-screen animate-pulse bg-brand-linen/10" />}>
        <ShopClient />
      </Suspense>

      <BuyerFooter />
    </main>
  );
}

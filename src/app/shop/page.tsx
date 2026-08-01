import { Metadata } from "next";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ShopClient from "./ShopClient";
import { mockProducts } from "@/lib/products";
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

export default function ShopPage() {
  // CollectionPage Schema
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Wholesale Raw Materials Catalog",
    "url": "https://www.ekorabazaar.in/shop",
    "description": "Premium craft supplies and raw materials for creators.",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": mockProducts.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "image": product.image,
          "url": `https://www.ekorabazaar.in/products/${product.id}`,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "INR"
          }
        }
      }))
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
      {/* Hide H1 visually but keep it for SEO (Content SEO / AI SEO) */}
      <h1 className="sr-only">Wholesale Craft Supplies and Raw Materials Shop</h1>
      
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(collectionSchema, { isJSON: true }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(breadcrumbSchema, { isJSON: true }) }}
      />

      <BuyerNavbar />
      
      {/* Client Component for Interaction & Filtering */}
      <Suspense fallback={<div className="pt-24 pb-12 px-6 max-w-7xl mx-auto w-full min-h-screen animate-pulse bg-brand-linen/10" />}>
        <ShopClient initialProducts={mockProducts} />
      </Suspense>

      <BuyerFooter />
    </main>
  );
}

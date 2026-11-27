import HomepageClient from "@/components/HomepageClient";
import catalogProducts from "@/lib/data/products.json";
import { HOMEPAGE_FAQS } from "@/lib/faqs";
import type { Metadata } from "next";
import { generateFaqSchema } from "@/lib/seo";
import serialize from "serialize-javascript";

export const metadata: Metadata = {
  title: "Ekora Bazaar | Fragrance Oils, Essential Oils & Craft Raw Materials India",
  description:
    "Buy perfume fragrance oils, candle fragrance oils, essential oils, soy wax, soap bases, and silicone moulds online in India. Trial sizes to wholesale packs with GST invoicing.",
  alternates: {
    canonical: "https://ekorabazaar.in",
  },
};

export default function BuyerHomePage() {
  const faqSchema = generateFaqSchema(HOMEPAGE_FAQS);
  const trendingProductIds = ["790", "904", "907", "905"];
  const trendingProducts = trendingProductIds
    .map((id) => (catalogProducts as any[]).find((p) => String(p.id) === id))
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.title || p.name,
      category: p.category,
      image: p.imageUrl || p.image || "/og-image.jpg",
      price: p.price,
      isQuoteOnly: p.isQuoteOnly,
      inStock: p.inStock,
      variants: p.variants,
      tiers: p.wholesaleTiers,
    }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(faqSchema, { isJSON: true }) }}
      />
      <HomepageClient trendingProducts={trendingProducts} />
    </>
  );
}

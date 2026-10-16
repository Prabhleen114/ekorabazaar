import { Metadata } from "next";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import FragranceCalculatorClient from "./FragranceCalculatorClient";
import serialize from "serialize-javascript";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ekorabazaar.in";

export const metadata: Metadata = {
  title: "Candle Fragrance Load Calculator",
  description:
    "Free candle fragrance load calculator. Calculate exact grams of fragrance oil and wax for soy, paraffin, and coconut candles with batch cost in INR.",
  alternates: {
    canonical: `${BASE_URL}/tools/fragrance-load-calculator`,
  },
  openGraph: {
    title: "Candle Fragrance Load Calculator",
    description:
      "Calculate fragrance oil and wax weight in grams for candle making. Accurate batch formulas for Indian makers.",
    url: `${BASE_URL}/tools/fragrance-load-calculator`,
    type: "website",
  },
};

export default function FragranceLoadCalculatorPage() {
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Candle Fragrance Load Calculator",
    applicationCategory: "UtilityApplication",
    operatingSystem: "All",
    url: `${BASE_URL}/tools/fragrance-load-calculator`,
    description:
      "Calculates precise fragrance oil and wax weights for candle making based on wax type and desired percentage.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Maker Tools", item: `${BASE_URL}/tools/fragrance-load-calculator` },
      { "@type": "ListItem", position: 3, name: "Fragrance Calculator", item: `${BASE_URL}/tools/fragrance-load-calculator` },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize([toolSchema, breadcrumbSchema], { isJSON: true }) }}
      />
      <div className="pt-24 pb-16 px-4 md:px-6 max-w-5xl mx-auto w-full flex-1">
        <FragranceCalculatorClient />
      </div>
      <BuyerFooter />
    </main>
  );
}

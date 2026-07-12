import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { CheckCircle2, FlaskConical, FileText, ArrowRight, Package } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ekora | Premium Raw Materials & Wholesale Craft Supplies",
  description:
    "India's premier wholesale marketplace for creators. Buy batch-tested raw materials for candles, resins, soaps, and craft supplies directly at wholesale prices.",
  keywords: [
    "raw materials India",
    "wholesale craft supplies",
    "candle making supplies",
    "soap base wholesale",
    "resin art materials",
    "Ekora Bazaar",
    "Ekora",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ekora | Premium Raw Materials & Wholesale Craft Supplies",
    description:
      "Batch-tested, reliable craft supplies for candles, resins, and soaps at wholesale prices.",
    url: "https://www.ekorabazaar.in",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ekora | Premium Raw Materials & Wholesale Craft Supplies",
    description:
      "Batch-tested, reliable craft supplies for candles, resins, and soaps at wholesale prices.",
  },
};

export default function BuyerHomePage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.ekorabazaar.in",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <BuyerNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-28 pb-20 px-6 max-w-6xl mx-auto w-full flex-1">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold font-serif text-brand-charcoal leading-tight mb-6 tracking-tight">
            Premium Raw Materials for<br className="hidden md:block"/> Serious Creators
          </h1>
          <p className="text-lg md:text-xl text-brand-charcoal/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop guessing with your supplies. We offer batch-tested, verified raw materials with wholesale pricing tiers for growing businesses.
          </p>
        </div>

        {/* Dual-entry Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          <Link href="/shop?view=art-type" className="group block bg-white rounded-3xl p-8 border border-brand-linen hover:border-brand-orange/50 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FlaskConical className="w-6 h-6 text-brand-orange" />
            </div>
            <h3 className="text-2xl font-bold font-serif text-brand-charcoal mb-3">Browse by Art Type</h3>
            <p className="text-brand-charcoal/60 mb-6">Find complete supply lists for Candle Making, Resin Geode Art, Perfumery, and Cold Process Soaps.</p>
            <span className="inline-flex items-center gap-2 text-brand-orange font-semibold text-sm group-hover:gap-3 transition-all">
              Explore Arts <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link href="/shop?view=category" className="group block bg-brand-charcoal rounded-3xl p-8 border border-transparent hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold font-serif text-white mb-3">Browse by Material</h3>
            <p className="text-white/70 mb-6">Directly access our catalog of Waxes, Premium Fragrance Oils, Epoxy Resins, and Silicone Molds.</p>
            <span className="inline-flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
              Shop Categories <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="border-y border-brand-linen bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-brand-charcoal mb-1">Batch-Tested Consistency</h4>
              <p className="text-sm text-brand-charcoal/60 leading-relaxed">Every batch is tested to ensure identical performance, so your end products never vary.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <FlaskConical className="w-8 h-8 text-brand-orange shrink-0" />
            <div>
              <h4 className="font-bold text-brand-charcoal mb-1">Verified Raw Materials</h4>
              <p className="text-sm text-brand-charcoal/60 leading-relaxed">We source directly from top manufacturers. No adulteration, no middlemen.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <FileText className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-bold text-brand-charcoal mb-1">Downloadable COAs</h4>
              <p className="text-sm text-brand-charcoal/60 leading-relaxed">Certificate of Analysis available for all our chemical supplies and fragrance oils.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Kit CTA */}
      <section className="py-16 md:py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-brand-linen/30 rounded-[3rem] p-12 border border-brand-linen">
          <h2 className="text-3xl font-bold font-serif text-brand-charcoal mb-4">Unsure? Try a Sample Kit.</h2>
          <p className="text-brand-charcoal/70 mb-8 max-w-lg mx-auto">
            Get a low-risk trial pack of our top-selling waxes, resins, and fragrances to test our batch consistency for yourself before placing wholesale orders.
          </p>
          <Link href="/shop/sample-kits" className="inline-flex items-center justify-center bg-brand-charcoal hover:bg-brand-charcoal/90 text-white rounded-xl px-8 py-4 font-semibold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
            Order a Sample Kit
          </Link>
        </div>
      </section>

      <BuyerFooter />
    </main>
  );
}

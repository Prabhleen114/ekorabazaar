import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles, Factory, ArrowRight, PackageSearch } from "lucide-react";

import type { Metadata } from "next";

const OG_IMAGE = "https://www.ekorabazaar.in/og-image.jpg";

export const metadata: Metadata = {
  title: "Ekora Bazaar | Premium Raw Materials & Wholesale Craft Supplies",
  description:
    "India's premier wholesale marketplace for creators. Buy batch-tested candle wax, resin, molds, soap base and craft supplies at wholesale prices.",
};

export default function BuyerHomePage() {
  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
      {/* COMPACT HERO SECTION */}
      <section className="pt-24 pb-12 px-6 max-w-6xl mx-auto w-full text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-brand-charcoal leading-tight mb-4 tracking-tight">
          Premium Raw Materials for<br className="hidden md:block"/> Serious Creators
        </h1>
        <p className="text-base md:text-lg text-brand-charcoal/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop guessing with your supplies. We offer batch-tested, verified raw materials with wholesale pricing tiers for growing businesses.
        </p>

        {/* BUYER PATHS (Above the fold action) */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {/* Path 1: Quality Buyer */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-brand-linen hover:border-emerald-500/30 hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold font-serif text-brand-charcoal mb-3">Quality Buyer</h3>
            <ul className="space-y-2 mb-6 text-sm text-brand-charcoal/60 flex-1">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> COA credentials on raw batches</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Batch certification docs</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Order mini trial samples first</li>
            </ul>
            <Link href="/classes" className="inline-flex items-center justify-between w-full bg-brand-bg group-hover:bg-emerald-50 text-brand-charcoal font-semibold rounded-xl px-4 py-3 transition-colors text-sm">
              Order Trial Samples <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Path 2: Craft Brand */}
          <div className="bg-brand-charcoal rounded-2xl p-6 md:p-8 border border-transparent hover:shadow-xl hover:shadow-brand-orange/10 transition-all duration-300 group flex flex-col h-full">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-brand-orange" />
            </div>
            <h3 className="text-xl font-bold font-serif text-white mb-3">Craft Brand</h3>
            <ul className="space-y-2 mb-6 text-sm text-white/70 flex-1">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5"/> Aesthetic Sourcing & Discovery</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5"/> Custom cataloging</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5"/> Direct maker chat logs</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5"/> Low volume test runs</li>
            </ul>
            <Link href="/shop" className="inline-flex items-center justify-between w-full bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl px-4 py-3 transition-colors text-sm">
              Discover Catalog <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Path 3: Supplier Hub */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-brand-linen hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Factory className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold font-serif text-brand-charcoal mb-3">Supplier Hub</h3>
            <ul className="space-y-2 mb-6 text-sm text-brand-charcoal/60 flex-1">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/> B2B volume scaling</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/> Dynamic volume price breaks</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/> Automated freight estimation</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/> Direct secure escrow</li>
            </ul>
            <Link href="/sell" className="inline-flex items-center justify-between w-full bg-brand-bg group-hover:bg-blue-50 text-brand-charcoal font-semibold rounded-xl px-4 py-3 transition-colors text-sm">
              Join Supplier Hub <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* COMPACT TRUST BANNER */}
      <section className="border-y border-brand-linen bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm font-semibold text-brand-charcoal/80">
          <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600"/> 100% Verified Quality</span>
          <span className="flex items-center gap-2"><Factory className="w-5 h-5 text-blue-600"/> Direct Manufacturer Sourcing</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand-orange"/> Batch-Tested Consistency</span>
        </div>
      </section>

      {/* SHOP NOW / CATEGORIES SECTION */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal">Shop Now</h2>
          <Link href="/shop" className="hidden sm:inline-flex items-center gap-2 text-brand-orange font-semibold hover:gap-3 transition-all">
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { name: "Fragrance Oils", href: "/shop?category=fragrances", count: "140+ Items" },
            { name: "Candle Waxes", href: "/shop?category=waxes", count: "Top Grade" },
            { name: "Silicone Molds", href: "/shop?category=molds", count: "300+ Designs" },
            { name: "Epoxy Resins", href: "/shop?category=resins", count: "Crystal Clear" }
          ].map((cat, i) => (
            <Link key={i} href={cat.href} className="group bg-white rounded-2xl p-6 border border-brand-linen hover:border-brand-orange/40 hover:shadow-lg transition-all flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center mb-4 text-brand-charcoal/40 group-hover:text-brand-orange group-hover:scale-110 transition-all">
                <PackageSearch className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-brand-charcoal mb-1">{cat.name}</h3>
              <p className="text-xs font-semibold text-brand-orange uppercase tracking-wider">{cat.count}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link href="/shop" className="inline-flex items-center justify-center bg-brand-charcoal text-white rounded-xl px-6 py-3 font-semibold w-full">
            View All Products
          </Link>
        </div>
      </section>

      <BuyerFooter />
    </main>
  );
}

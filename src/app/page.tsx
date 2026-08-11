import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { 
  ShieldCheck, 
  Sparkles, 
  Factory, 
  ArrowRight, 
  Droplets, 
  Flame, 
  Box, 
  Gem, 
  Package, 
  FlaskConical, 
  Leaf, 
  Layers, 
  Store,
  Lock,
  CheckCircle2
} from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ekora Bazaar | Premium Raw Materials & Wholesale Craft Supplies",
  description:
    "India's premier wholesale marketplace for creators. Buy batch-tested candle wax, resin, molds, soap base and craft supplies at wholesale prices.",
};

export default function BuyerHomePage() {
  const craftCategories = [
    { name: "Fragrance Oils", href: "/shop?category=Fragrance%20Oils", count: "309 Blends", icon: Droplets, color: "bg-rose-50 text-rose-600 border-rose-100" },
    { name: "Candle Moulds", href: "/shop?category=Candle%20%26%20Pillar%20Moulds", count: "259 Designs", icon: Flame, color: "bg-amber-50 text-amber-600 border-amber-100" },
    { name: "Fondant Moulds", href: "/shop?category=Culinary%20%26%20Fondant%20Moulds", count: "365 Designs", icon: Box, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { name: "Resin & Stone", href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds", count: "385 Designs", icon: Gem, color: "bg-purple-50 text-purple-600 border-purple-100" },
    { name: "Bases & Waxes", href: "/shop?category=Premium%20Bases%20%26%20Waxes", count: "Soap & Candle", icon: Sparkles, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { name: "Containers & Tins", href: "/shop?category=Containers%20%26%20Packaging", count: "337 Items", icon: Package, color: "bg-orange-50 text-orange-600 border-orange-100" },
  ];

  const trustBadges = [
    { icon: FlaskConical, title: "Lab-Tested & COA Certified", desc: "Batch test reports available on all raw materials" },
    { icon: Leaf, title: "IFRA Compliant Formulation", desc: "Certified safe for candles, soaps & cosmetic use" },
    { icon: Factory, title: "Direct Manufacturer Sourcing", desc: "No middleman markups — direct factory pricing" },
    { icon: Layers, title: "Wholesale Tier Pricing", desc: "Automatic volume discounts at 12+ & 52+ units" },
  ];

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
      {/* 1. HERO SECTION (Above the Fold) */}
      <section className="relative pt-16 md:pt-24 pb-12 md:pb-20 px-5 md:px-6 max-w-6xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 border border-brand-linen bg-white rounded-full px-4 py-1.5 text-xs font-semibold text-brand-charcoal/70 mb-6 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Batch-Tested Wholesale Raw Materials
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif text-brand-charcoal leading-tight mb-4 md:mb-6 tracking-tight">
          Premium Raw Materials for<br className="hidden md:block"/> Serious Creators
        </h1>
        
        <p className="text-base md:text-xl text-brand-charcoal/70 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
          Stop guessing with your supplies. Verified, laboratory-certified raw materials with wholesale tier pricing for growing craft businesses.
        </p>

        {/* Unified Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 md:mb-12 w-full max-w-md mx-auto">
          <Link
            href="/shop"
            className="w-full sm:w-auto bg-brand-orange hover:bg-brand-terracotta text-white px-8 py-4 rounded-2xl text-base font-bold transition-all text-center shadow-lg shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Explore the Collection</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/sell"
            className="w-full sm:w-auto bg-white border border-brand-linen hover:border-brand-charcoal text-brand-charcoal px-8 py-4 rounded-2xl text-base font-bold transition-all text-center shadow-sm flex items-center justify-center gap-2"
          >
            <Store className="w-4 h-4 text-brand-orange" />
            <span>Sell with Us</span>
          </Link>
        </div>

        {/* Mobile: Persistent Search Bar */}
        <div className="md:hidden w-full max-w-md mx-auto mb-6">
          <form action="/shop" method="GET" className="relative w-full">
            <input
              type="text"
              name="q"
              placeholder="Search fragrance oils, waxes, molds…"
              className="w-full bg-white border border-brand-linen rounded-2xl pl-11 pr-14 py-3.5 text-sm font-medium focus:outline-none focus:border-brand-orange shadow-sm"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-charcoal/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-orange text-white rounded-xl px-3.5 py-1.5 text-xs font-bold">
              Go
            </button>
          </form>
        </div>
      </section>

      {/* 2. CRAFT PRODUCTS / CATEGORIES SECTION */}
      <section className="py-12 md:py-16 px-5 md:px-6 max-w-6xl mx-auto w-full border-t border-brand-linen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange block mb-1">Catalog Overview</span>
            <h2 className="text-2xl md:text-4xl font-bold font-serif text-brand-charcoal">Craft Supplies &amp; Materials</h2>
          </div>
          <Link href="/shop" className="hidden sm:inline-flex items-center gap-2 text-brand-orange font-semibold hover:gap-3 transition-all text-sm">
            View All Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {craftCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link 
                key={i} 
                href={cat.href} 
                className="group bg-white rounded-2xl p-5 border border-brand-linen hover:border-brand-orange/40 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className={`w-12 h-12 rounded-xl ${cat.color} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-brand-charcoal mb-1 text-sm md:text-base">{cat.name}</h3>
                <p className="text-xs font-semibold text-brand-orange uppercase tracking-wider">{cat.count}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/shop" className="inline-flex items-center justify-center bg-brand-charcoal text-white rounded-xl px-6 py-3.5 font-semibold w-full text-sm">
            View All Products
          </Link>
        </div>
      </section>

      {/* 3. BUILD TRUST SECTION */}
      <section className="bg-white border-y border-brand-linen py-12 md:py-16 px-5 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block mb-2">Quality Assurance</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal mb-3">Why Serious Creators Trust Ekora</h2>
            <p className="text-sm md:text-base text-brand-charcoal/60">Every raw ingredient in our catalog undergoes rigorous batch verification before listing.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="bg-brand-bg rounded-2xl p-6 border border-brand-linen/60 flex flex-col items-start text-left">
                  <div className="w-10 h-10 rounded-xl bg-white border border-brand-linen flex items-center justify-center text-brand-charcoal mb-4 shadow-sm">
                    <Icon className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="font-bold text-brand-charcoal text-base mb-1">{badge.title}</h3>
                  <p className="text-xs text-brand-charcoal/60 leading-relaxed">{badge.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SELLER & SUPPLIER CTA SECTION (Frontpage Seller Flow) */}
      <section className="py-14 md:py-20 px-5 md:px-6 max-w-6xl mx-auto w-full">
        <div className="bg-brand-charcoal text-white rounded-3xl p-8 md:p-14 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4 text-left">
              <span className="inline-flex items-center gap-2 border border-white/20 bg-white/10 rounded-full px-3.5 py-1 text-xs font-semibold text-brand-orange uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Founding Supplier Circle
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight">
                Are You a Raw Material Supplier or Manufacturer?
              </h2>
              <p className="text-sm md:text-lg text-white/70 max-w-xl leading-relaxed">
                Join India&apos;s premier B2B creator sourcing marketplace. List your catalog, manage wholesale volume tiers, and connect directly with thousands of independent makers.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-white/80">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Lifetime Zero Commission</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Direct Creator Orders</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Batch COA Indexing</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                href="/sell/start-selling"
                className="w-full bg-brand-orange hover:bg-brand-terracotta text-white py-4 px-6 rounded-2xl font-bold text-base transition-all text-center shadow-lg shadow-brand-orange/30 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Apply for Storefront</span>
              </Link>
              <Link
                href="/sell"
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all text-center border border-white/10"
              >
                Learn How It Works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BuyerFooter />
    </main>
  );
}

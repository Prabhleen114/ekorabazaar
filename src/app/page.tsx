import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import Image from "next/image";
import { 
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
    { 
      name: "Fragrance Oils", 
      href: "/shop?category=Fragrance%20Oils", 
      count: "308 Blends", 
      icon: Droplets, 
      color: "bg-rose-50 text-rose-600 border-rose-100",
      bgImage: "/images/fragrance_oils_bg.jpg"
    },
    { 
      name: "Candle Moulds", 
      href: "/shop?category=Candle%20%26%20Pillar%20Moulds", 
      count: "214 Designs", 
      icon: Flame, 
      color: "bg-amber-50 text-amber-600 border-amber-100",
      bgImage: "/images/candle_moulds_bg.jpg"
    },
    { 
      name: "Fondant Moulds", 
      href: "/shop?category=Culinary%20%26%20Fondant%20Moulds", 
      count: "332 Designs", 
      icon: Box, 
      color: "bg-blue-50 text-blue-600 border-blue-100",
      bgImage: "/images/fondant_moulds_bg.jpg"
    },
    { 
      name: "Resin & Stone", 
      href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds", 
      count: "499 Designs", 
      icon: Gem, 
      color: "bg-purple-50 text-purple-600 border-purple-100",
      bgImage: "/images/resin_stone_bg.jpg"
    },
    { 
      name: "Bases & Waxes", 
      href: "/shop?category=Premium%20Bases%20%26%20Waxes", 
      count: "Soap & Candle", 
      icon: Sparkles, 
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      bgImage: "/images/bases_waxes_bg.jpg"
    },
    { 
      name: "Containers & Tins", 
      href: "/shop?category=Containers%20%26%20Packaging", 
      count: "182 Items", 
      icon: Package, 
      color: "bg-orange-50 text-orange-600 border-orange-100",
      bgImage: "/images/containers_tins_bg.jpg"
    },
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
      
      {/* 1. HERO SECTION: ARTISAN FORMULATIONS IN ACTION (Pops Up First!) */}
      <section className="pt-6 md:pt-10 pb-8 md:pb-12 px-5 md:px-6 max-w-6xl mx-auto w-full">
        
        {/* Top Header Badge & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange block mb-1">Craftsmanship &amp; Sourcing</span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-brand-charcoal">
              Artisan Formulations in Action
            </h1>
            <p className="text-xs md:text-base text-brand-charcoal/70 mt-1">
              From raw ingredients to finished luxury products — engineered for candle &amp; soap crafters.
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="w-full md:w-80">
            <form action="/shop" method="GET" className="relative w-full">
              <input
                type="text"
                name="q"
                placeholder="Search fragrance oils, waxes, molds…"
                className="w-full bg-white border border-brand-linen rounded-2xl pl-10 pr-12 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-brand-orange shadow-sm"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-orange text-white rounded-xl px-3 py-1 text-xs font-bold hover:bg-brand-terracotta transition-colors">
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Hero Cards Grid (Candle Making & Soap Making Cards) */}
        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          
          {/* Candle Making Process Card */}
          <div className="relative rounded-3xl overflow-hidden border border-brand-linen p-6 md:p-10 flex flex-col justify-end min-h-[320px] md:min-h-[380px] group shadow-md hover:shadow-2xl transition-all duration-300">
            <Image 
              src="/images/candle_making_process.jpg" 
              alt="Artisan Candle Making Process" 
              fill 
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 pointer-events-none" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/95 via-brand-charcoal/60 to-transparent z-10" />
            
            <div className="relative z-20 text-white space-y-2.5">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/30 border border-amber-400/50 text-amber-300 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Flame className="w-3.5 h-3.5" /> Candle Making Supplies
              </div>
              <h2 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight">
                Artisan Candle Pouring &amp; Mold Casting
              </h2>
              <p className="text-xs md:text-sm text-white/85 max-w-md leading-relaxed">
                100% natural soy wax, heat-resistant silicone pillar molds, and IFRA-tested fragrance oils optimized for clean hot scent throw.
              </p>
              <div className="pt-2">
                <Link 
                  href="/shop?category=Candle%20%26%20Pillar%20Moulds" 
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-brand-orange hover:bg-brand-terracotta px-5 py-3 rounded-xl border border-white/20 transition-all shadow-md shadow-brand-orange/30 active:scale-[0.98]"
                >
                  <span>Explore Candle Supplies</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Soap Making Process Card */}
          <div className="relative rounded-3xl overflow-hidden border border-brand-linen p-6 md:p-10 flex flex-col justify-end min-h-[320px] md:min-h-[380px] group shadow-md hover:shadow-2xl transition-all duration-300">
            <Image 
              src="/images/soap_making_process.jpg" 
              alt="Cold Process Organic Soap Making" 
              fill 
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 pointer-events-none" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/95 via-brand-charcoal/60 to-transparent z-10" />
            
            <div className="relative z-20 text-white space-y-2.5">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" /> Soap Crafting Essentials
              </div>
              <h2 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight">
                Cold Process Soap Swirling &amp; Loaf Casting
              </h2>
              <p className="text-xs md:text-sm text-white/85 max-w-md leading-relaxed">
                Clear &amp; opaque Melt &amp; Pour soap bases, silicone bar molds, essential oils, and skin-safe colorants for luxury batch production.
              </p>
              <div className="pt-2">
                <Link 
                  href="/shop?category=Soap%20%26%20Bar%20Moulds" 
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-brand-orange hover:bg-brand-terracotta px-5 py-3 rounded-xl border border-white/20 transition-all shadow-md shadow-brand-orange/30 active:scale-[0.98]"
                >
                  <span>Explore Soap Supplies</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. CRAFT PRODUCTS / CATEGORIES OVERVIEW SECTION */}
      <section className="py-8 md:py-12 px-5 md:px-6 max-w-6xl mx-auto w-full border-t border-brand-linen">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange block mb-1">Catalog Overview</span>
            <h2 className="text-2xl md:text-4xl font-bold font-serif text-brand-charcoal">Craft Supplies &amp; Materials</h2>
          </div>
          <Link href="/shop" className="hidden sm:inline-flex items-center gap-2 text-brand-orange font-semibold hover:gap-3 transition-all text-sm">
            View All Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
          {craftCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link 
                key={i} 
                href={cat.href} 
                className="group relative bg-white rounded-2xl p-4 md:p-5 border border-brand-linen hover:border-brand-orange/50 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center overflow-hidden min-h-[170px] justify-center"
              >
                {/* Semi-Transparent Background Product Photo */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <Image 
                    src={cat.bgImage} 
                    alt={cat.name} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 16vw"
                    className="object-cover opacity-25 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 pointer-events-none" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/60 group-hover:from-white/90 group-hover:via-white/70 transition-colors" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-xl ${cat.color} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm backdrop-blur-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-brand-charcoal mb-1 text-sm md:text-base leading-tight drop-shadow-xs">{cat.name}</h3>
                  <p className="text-[11px] font-bold text-brand-orange uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-md border border-brand-linen/60 shadow-2xs">
                    {cat.count}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/shop" className="inline-flex items-center justify-center bg-brand-charcoal text-white rounded-xl px-6 py-3 font-semibold w-full text-sm">
            View All Products
          </Link>
        </div>
      </section>

      {/* 3. BUILD TRUST SECTION */}
      <section className="bg-white border-y border-brand-linen py-8 md:py-12 px-5 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block mb-1">Quality Assurance</span>
            <h2 className="text-2xl md:text-4xl font-serif font-bold text-brand-charcoal mb-2">Why Serious Creators Trust Ekora</h2>
            <p className="text-xs md:text-sm text-brand-charcoal/60">Every raw ingredient in our catalog undergoes rigorous batch verification before listing.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="bg-brand-bg rounded-2xl p-5 md:p-6 border border-brand-linen/60 flex flex-col items-start text-left">
                  <div className="w-10 h-10 rounded-xl bg-white border border-brand-linen flex items-center justify-center text-brand-charcoal mb-3 shadow-sm">
                    <Icon className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="font-bold text-brand-charcoal text-sm md:text-base mb-1">{badge.title}</h3>
                  <p className="text-xs text-brand-charcoal/60 leading-relaxed">{badge.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SELLER & SUPPLIER CTA SECTION (Frontpage Seller Flow) */}
      <section className="py-10 md:py-14 px-5 md:px-6 max-w-6xl mx-auto w-full">
        <div className="bg-brand-charcoal text-white rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-3 text-left">
              <span className="inline-flex items-center gap-2 border border-white/20 bg-white/10 rounded-full px-3.5 py-1 text-xs font-semibold text-brand-orange uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Founding Supplier Circle
              </span>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
                Are You a Raw Material Supplier or Manufacturer?
              </h2>
              <p className="text-xs md:text-base text-white/70 max-w-xl leading-relaxed">
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
                className="w-full bg-brand-orange hover:bg-brand-terracotta text-white py-3.5 px-6 rounded-2xl font-bold text-sm md:text-base transition-all text-center shadow-lg shadow-brand-orange/30 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Apply for Storefront</span>
              </Link>
              <Link
                href="/sell"
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-2xl font-semibold text-xs md:text-sm transition-all text-center border border-white/10"
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

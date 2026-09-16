import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Check, ChevronRight } from "lucide-react";
import catalogProducts from "@/lib/data/products.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ekora Bazaar | B2B Raw Materials & Precision Moulds Atelier",
  description:
    "Direct manufacturer raw materials for modern makers. 100% soy wax, IFRA certified fragrance oils, cosmetic bases, and silicone moulds.",
};

const CORE_DISCIPLINES = [
  { name: "Candle Studio", href: "/shop?discipline=candle-studio" },
  { name: "Soap Atelier", href: "/shop?discipline=soap-atelier" },
  { name: "Fragrance & Botanicals", href: "/shop?category=Fragrance%20Oils" },
  { name: "Moulds & Casting", href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds" },
  { name: "Vessels & Packaging", href: "/shop?department=Vessels%20%26%20Packaging%20Studio" },
  { name: "Discovery Kits", href: "/classes" },
];

export default function BuyerHomePage() {
  // Select top 4 curated formulation essentials for the trending shelf
  const trendingProductIds = ["790", "904", "907", "905"];
  const trendingProducts = trendingProductIds
    .map((id) => (catalogProducts as any[]).find((p) => String(p.id) === id))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#181715] flex flex-col font-sans selection:bg-[#E8E5DF] selection:text-[#181715]">
      <BuyerNavbar />

      {/* 1. DISCIPLINE DIRECTORY BAR (Instant Taxonomy Access) */}
      <div className="w-full border-b border-stone-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between overflow-x-auto hide-scrollbar gap-6 md:gap-8">
          <div className="flex items-center gap-6 md:gap-8 min-w-max mx-auto">
            {CORE_DISCIPLINES.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-600 hover:text-stone-900 transition-colors py-1 relative group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-stone-900 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 2. ABOVE-THE-FOLD HERO SPLIT SECTION */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-6 md:pt-10 pb-10 md:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left: Editorial Hero Visual (55% on desktop) */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] w-full bg-stone-100/70 border border-stone-200/70 overflow-hidden shadow-[0_4px_24px_-8px_rgba(24,23,21,0.06)]">
              <Image
                src="/images/hero_studio_collection.webp"
                alt="Ekora Bazaar Artisanal Studio Collection on Limestone Riser"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              <div className="absolute top-4 left-4 border border-stone-300/80 text-[10px] uppercase tracking-[0.2em] px-3 py-1 text-stone-700 bg-white/90 backdrop-blur-xs font-mono">
                Studio Edition 2026
              </div>
            </div>
          </div>

          {/* Right: Conversion Anchor (45% on desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left space-y-5 lg:pl-4">
            
            <div className="space-y-2">
              <span className="font-serif italic text-lg md:text-xl text-[#8C734B] block">
                Formulation Essentials
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#181715] tracking-tight font-normal leading-[1.12]">
                STUDIO FAVOURITES FROM ₹249
              </h1>
            </div>

            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500 leading-relaxed font-mono">
              BATCH-TESTED RAW MATERIALS FOR SERIOUS MAKERS. NO COMMISSIONS. NO MARGIN MARKS.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-3 bg-[#181715] text-stone-100 hover:bg-stone-800 text-xs uppercase tracking-[0.2em] px-8 py-4 transition-colors text-center"
              >
                <span>EXPLORE BESTSELLERS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center justify-center border border-stone-300 text-stone-800 hover:border-stone-900 hover:text-stone-950 text-xs uppercase tracking-[0.18em] px-6 py-4 transition-colors text-center"
              >
                <span>DISCOVERY KITS</span>
              </Link>
            </div>

            {/* Micro value badges */}
            <div className="pt-3 border-t border-stone-200/60 flex items-center gap-6 text-[10px] uppercase tracking-[0.15em] text-stone-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#8C734B] rounded-full" /> IFRA Certified
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#8C734B] rounded-full" /> 24-Hour Dispatch
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#8C734B] rounded-full" /> Direct Factory
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 3. TRENDING IN THE STUDIO (Horizontal Shelf Immediately Below Hero) */}
      <section className="w-full bg-white border-y border-stone-200/80 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-stone-200">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-mono block mb-1">
                Real-Time Maker Demand
              </span>
              <h2 className="font-serif text-2xl md:text-3xl text-stone-900 font-normal tracking-tight">
                TRENDING IN THE STUDIO
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs uppercase tracking-[0.18em] text-stone-600 hover:text-stone-900 underline underline-offset-4 transition-colors"
            >
              View All 2,229 SKUs &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trendingProducts.map((p: any) => {
              const price = typeof p.price === "number" ? p.price : parseFloat(p.price || "0");
              const hasTiers = Array.isArray(p.tiers) && p.tiers.length > 1;
              const bulkPrice = hasTiers ? p.tiers[1]?.price : null;

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group flex flex-col bg-white border border-stone-200/70 hover:border-stone-400 transition-colors"
                >
                  {/* Aspect Ratio Image Container */}
                  <div className="aspect-[4/5] bg-stone-50/70 relative flex items-center justify-center p-4 overflow-hidden border-b border-stone-200/40">
                    <Image
                      src={p.image || "/og-image.jpg"}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {hasTiers && (
                      <div className="absolute top-2.5 left-2.5 border border-stone-300 text-[9px] uppercase tracking-widest px-2 py-0.5 text-stone-600 bg-white/90 backdrop-blur-xs font-mono">
                        Tier Available
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono block mb-1">
                        {p.category}
                      </span>
                      <h3 className="font-serif text-sm md:text-base text-stone-900 line-clamp-1 font-normal tracking-tight group-hover:text-[#8C734B] transition-colors">
                        {p.name}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-stone-900">
                          ₹{price}
                        </span>
                        {bulkPrice && (
                          <span className="text-[11px] text-stone-500 font-mono block">
                            From ₹{bulkPrice} (12+)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors font-mono">
                        VIEW &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. BOTANICAL & MATERIAL PROVENANCE (Trust Architecture) */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-8 py-14 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#8C734B] font-mono block">
            Purity &bull; Traceability &bull; Testing
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-stone-900 font-normal tracking-tight">
            The Atelier Standard
          </h2>
          <p className="text-xs md:text-sm text-stone-600 font-light max-w-md mx-auto">
            Every raw ingredient in our catalog undergoes rigorous batch verification before listing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "COA & Gas Chromatography",
              desc: "Batch-specific analysis reports available for direct download on technical raw materials.",
              label: "01 // VERIFICATION"
            },
            {
              title: "IFRA 51st Amendment Safe",
              desc: "Perfumer and cosmetician formulation safe limits certified for candles, soaps, and skin application.",
              label: "02 // SAFETY"
            },
            {
              title: "Zero-Middleman Sourcing",
              desc: "Direct distillery and refinery pipeline eliminates secondary markups and tampering.",
              label: "03 // DIRECT"
            },
            {
              title: "Automated Volume Tiers",
              desc: "Transparent tier discounts configured at 12+ and 52+ units with no gatekept quotes.",
              label: "04 // SCALE"
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-stone-200/80 p-6 flex flex-col justify-between space-y-4"
            >
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#8C734B]">
                {item.label}
              </span>
              <div>
                <h3 className="font-serif text-base text-stone-900 font-normal mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SUPPLIER & DISTILLER INTAKE (Architectural Atelier Style) */}
      <section className="w-full bg-[#181715] text-stone-100 py-14 md:py-20 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4 text-left">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#8C734B] font-mono block">
                Founding Manufacturer Circle
              </span>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
                Supply Verified Creators &amp; Artisans Across India.
              </h2>
              <p className="text-xs md:text-sm text-stone-400 font-light max-w-xl leading-relaxed">
                Connect your distillery, laboratory, or precision mould foundry directly to thousands of verified makers. Manage volume tiers and technical documentation with zero commissions.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center lg:items-end">
              <Link
                href="/sell"
                className="inline-flex items-center justify-center border border-stone-400 text-stone-100 hover:bg-stone-100 hover:text-stone-900 text-xs uppercase tracking-[0.2em] px-8 py-4 transition-colors text-center"
              >
                <span>APPLY AS SUPPLIER &rarr;</span>
              </Link>
              <span className="text-[10px] text-stone-500 font-mono tracking-widest text-center lg:text-right">
                GST VERIFICATION REQUIRED
              </span>
            </div>

          </div>
        </div>
      </section>

      <BuyerFooter />
    </main>
  );
}

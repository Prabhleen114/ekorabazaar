import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-2.5 flex items-center justify-between overflow-x-auto hide-scrollbar">
          <div className="flex items-center space-x-8 min-w-max mx-auto">
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

      {/* 2. HERO BANNER: VIEWPORT-CALIBRATED SPLIT (< 580px Height On Desktop) */}
      <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 mt-4">
        <div className="relative w-full h-[480px] md:h-[540px] lg:h-[580px] bg-[#FAF8F5] border border-stone-200/80 overflow-hidden flex flex-col md:flex-row items-center">
          
          {/* Visual Column (Left, 55% Width on Desktop) */}
          <div className="w-full md:w-[55%] h-[260px] md:h-full relative flex items-center justify-center p-6 md:p-12">
            <Image
              src="/images/hero_studio_collection.webp"
              alt="Ekora Bazaar Artisanal Studio Collection on Limestone Riser"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain max-h-[85%] max-w-[85%] drop-shadow-md"
            />
            <div className="absolute top-4 left-4 border border-stone-300 text-[10px] uppercase tracking-[0.2em] px-3 py-1 text-stone-700 bg-white/90 backdrop-blur-xs font-mono">
              Studio Edition 2026
            </div>
          </div>

          {/* Typography & Conversion Column (Right, 45% Width on Desktop) */}
          <div className="w-full md:w-[45%] h-full flex flex-col justify-center px-6 md:px-12 lg:px-16 py-8">
            <span className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-2 font-mono">
              FORMULATION ESSENTIALS
            </span>
            <span className="font-serif italic text-2xl md:text-3xl text-stone-600 -mb-1">
              Direct Manufacturer Sourcing
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-stone-900 leading-[1.1] tracking-tight mb-3">
              STUDIO FAVOURITES FROM ₹249
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-600 mb-6 font-medium font-mono">
              BATCH-TESTED RAW MATERIALS FOR SERIOUS MAKERS. NO COMMISSIONS. NO MARGIN MARKS.
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/shop"
                className="w-fit bg-stone-900 text-white px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] hover:bg-stone-800 transition-colors inline-flex items-center gap-2"
              >
                <span>EXPLORE BESTSELLERS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/classes"
                className="w-fit border border-stone-300 text-stone-800 hover:border-stone-900 px-6 py-3.5 text-[11px] uppercase tracking-[0.18em] transition-colors"
              >
                <span>DISCOVERY KITS</span>
              </Link>
            </div>

            {/* Subtle verification footer in conversion column */}
            <div className="mt-8 pt-4 border-t border-stone-200/70 flex items-center gap-6 text-[10px] uppercase tracking-[0.18em] text-stone-500 font-mono">
              <span>IFRA Certified</span>
              <span>&bull;</span>
              <span>24H Dispatch</span>
              <span>&bull;</span>
              <span>Direct Factory</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. TRENDING IN THE STUDIO (Horizontal Shelf Immediately Below Hero) */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-10 md:py-14">
        <div className="flex items-end justify-between mb-6 pb-3 border-b border-stone-200">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-mono block mb-1">
              Real-Time Demand
            </span>
            <h2 className="font-serif text-2xl md:text-3xl text-stone-900 font-normal tracking-tight">
              TRENDING IN THE STUDIO
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.18em] text-stone-600 hover:text-stone-900 underline underline-offset-4 transition-colors font-mono"
          >
            View All 2,229 SKUs &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-10">
          {trendingProducts.map((p: any) => {
            const price = typeof p.price === "number" ? p.price : parseFloat(p.price || "0");
            const hasTiers = Array.isArray(p.tiers) && p.tiers.length > 1;
            const bulkPrice = hasTiers ? p.tiers[1]?.price : null;

            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group flex flex-col transition-all duration-300"
              >
                <div className="aspect-[4/5] w-full bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center p-4 sm:p-5 mb-3 border border-stone-200/60">
                  <Image
                    src={p.image || "/og-image.jpg"}
                    alt={p.name}
                    fill
                    quality={85}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {hasTiers && (
                    <div className="absolute top-2.5 left-2.5 border border-stone-300 text-[9px] uppercase tracking-widest px-2 py-0.5 text-stone-600 bg-white/90 backdrop-blur-xs font-mono">
                      Tier Available
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono mb-1 truncate">
                    {p.category}
                  </span>
                  <h3 className="font-serif text-sm md:text-base text-stone-900 font-normal leading-snug line-clamp-1 mb-1.5 group-hover:text-[#8C734B] transition-colors">
                    {p.name}
                  </h3>
                  <div className="text-xs font-light text-stone-700 flex items-center justify-between font-mono">
                    <div>
                      <span>₹{price}</span>
                      {bulkPrice && (
                        <span className="text-[10px] text-stone-400 ml-2">From ₹{bulkPrice} (12+)</span>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors">
                      View &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. BOTANICAL & MATERIAL PROVENANCE (Trust Architecture) */}
      <section className="max-w-[1400px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-10 md:py-14 border-t border-stone-200/80">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
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

      {/* 5. SUPPLIER & DISTILLER INTAKE */}
      <section className="w-full bg-[#181715] text-stone-100 py-10 md:py-14 border-t border-stone-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
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

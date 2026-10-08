import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, Building2 } from "lucide-react";
import catalogProducts from "@/lib/data/products.json";
import QuickAddButton from "@/components/QuickAddButton";
import HomepageFaqAccordion from "@/components/HomepageFaqAccordion";
import type { Metadata } from "next";
import { generateOrganizationSchema } from "@/lib/seo";
import serialize from "serialize-javascript";

export const metadata: Metadata = {
  title: "Ekora Bazaar | B2B Raw Materials & Precision Moulds Wholesale",
  description:
    "Direct manufacturer raw materials for modern makers. 100% soy wax, IFRA certified fragrance oils, cosmetic bases, and silicone moulds.",
};

const CORE_DISCIPLINES = [
  { name: "Candle Studio", href: "/shop?discipline=candle-studio" },
  { name: "Soap Supplies", href: "/shop?discipline=soap-atelier" },
  { name: "Fragrance & Botanicals", href: "/shop?category=Fragrance%20Oils" },
  { name: "Moulds & Casting", href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds" },
  { name: "Vessels & Packaging", href: "/shop?department=Vessels%20%26%20Packaging%20Studio" },
  { name: "Discovery Kits", href: "/classes" },
];

export default function BuyerHomePage() {
  const orgSchema = generateOrganizationSchema();
  // Select top 4 curated formulation essentials for the trending shelf
  const trendingProductIds = ["790", "904", "907", "905"];
  const trendingProducts = trendingProductIds
    .map((id) => (catalogProducts as any[]).find((p) => String(p.id) === id))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#181715] flex flex-col font-sans selection:bg-[#E8E5DF] selection:text-[#181715]">
      <BuyerNavbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(orgSchema, { isJSON: true }) }} />

      {/* 1. DISCIPLINE DIRECTORY BAR (Instant Taxonomy Access) */}
      <div className="w-full border-b border-stone-200/80 bg-white relative">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 py-3 flex items-center overflow-x-auto">
          <div className="flex items-center space-x-6 md:space-x-8 min-w-max pr-8 md:pr-0 md:mx-auto">
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
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
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
              Verified B2B Supplies
            </div>
          </div>

          {/* Typography & Conversion Column (Right, 45% Width on Desktop) */}
          <div className="w-full md:w-[45%] h-full flex flex-col justify-center px-4 md:px-6 md:px-12 lg:px-16 py-8">
            <span className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-2 font-mono">
              DIRECT MANUFACTURER SOURCING
            </span>
            <span className="font-serif italic text-2xl md:text-3xl text-stone-600 -mb-1">
              Zero commissions. No markup.
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-stone-900 leading-[1.1] tracking-tight mb-3 mt-2">
              The B2B Marketplace For Indian Craft Makers.
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-600 mb-4 font-medium font-mono">
              BATCH-TESTED FRAGRANCES, WAXES & MOULDS FROM ₹249.
            </p>

            {/* Micro social proof stack (H-5) */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex -space-x-2">
                {["RM", "SK", "AS", "PK", "KA"].map((initials, i) => (
                  <div 
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[8px] font-bold text-stone-700 shadow-xs"
                    style={{ zIndex: 5 - i }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-medium text-stone-600 font-mono">
                <span className="text-brand-orange font-bold">1,200+ artisan makers</span> sourcing direct
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Link
                href="/shop"
                className="w-full sm:w-fit bg-brand-orange text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] hover:bg-brand-terracotta transition-colors inline-flex items-center justify-center gap-2 text-center"
              >
                <span>SHOP WHOLESALE CATALOG</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/classes"
                className="w-full sm:w-fit border border-stone-300 text-stone-800 hover:border-stone-900 px-4 md:px-6 py-3.5 text-[11px] uppercase tracking-[0.18em] transition-colors text-center"
              >
                <span>DISCOVERY KITS</span>
              </Link>
            </div>

            {/* Subtle verification footer with contextual icons */}
            <div className="mt-8 pt-4 border-t border-stone-200/70 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.15em] text-stone-600 font-mono">
              <span className="inline-flex items-center gap-1.5 font-medium"><ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> IFRA Certified</span>
              <span className="text-stone-300">&bull;</span>
              <span className="inline-flex items-center gap-1.5 font-medium"><Truck className="w-3.5 h-3.5 text-amber-700" /> 24H Dispatch</span>
              <span className="text-stone-300">&bull;</span>
              <span className="inline-flex items-center gap-1.5 font-medium"><Building2 className="w-3.5 h-3.5 text-stone-700" /> Direct Factory</span>
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
                <div className="aspect-[4/5] w-full bg-white relative overflow-hidden flex items-center justify-center p-2.5 sm:p-3 mb-3 border border-stone-200/60">
                  <Image
                    src={p.image || "/og-image.jpg"}
                    alt={p.name}
                    fill
                    unoptimized={Boolean(p.image && p.image.startsWith("http"))}
                    quality={85}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                <div className="flex flex-col flex-1">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono mb-1 line-clamp-1">
                    {p.category}
                  </span>
                  <h3 className="font-serif text-sm md:text-base text-stone-900 font-normal leading-snug line-clamp-2 min-h-[2.5rem] md:min-h-[2.75rem] mb-2 group-hover:text-[#8C734B] transition-colors">
                    {p.name}
                  </h3>
                  <div className="text-xs font-mono text-stone-800 flex items-baseline justify-between mb-2">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-stone-950">₹{price}</span>
                      {bulkPrice && (
                        <span className="text-[10px] text-stone-500">(From ₹{bulkPrice})</span>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors">
                      View &rarr;
                    </span>
                  </div>
                  <div className="mt-auto pt-1">
                    <object><QuickAddButton productId={String(p.id)} productName={p.name} basePrice={price} category={p.category} /></object>
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
            The Wholesale Standard
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
              label: "01 // VERIFICATION",
              href: "/formulations",
              linkText: "View Documentation"
            },
            {
              title: "IFRA 51st Amendment Safe",
              desc: "Perfumer and cosmetician formulation safe limits certified for candles, soaps, and skin application.",
              label: "02 // SAFETY",
              href: "/formulations",
              linkText: "Review Safe Limits"
            },
            {
              title: "Zero-Middleman Sourcing",
              desc: "Direct distillery and refinery pipeline eliminates secondary markups and tampering.",
              label: "03 // DIRECT",
              href: "/about",
              linkText: "Our Sourcing Pipeline"
            },
            {
              title: "Automated Volume Tiers",
              desc: "Transparent tier discounts configured at 12+ and 52+ units with no gatekept quotes.",
              label: "04 // SCALE",
              href: "/shop",
              linkText: "Browse Wholesale Slabs"
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-stone-200/80 p-6 flex flex-col justify-between space-y-4 hover:border-stone-400 transition-colors"
            >
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-[#8C734B] block mb-2">
                  {item.label}
                </span>
                <h3 className="font-serif text-base text-stone-900 font-normal mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-light mb-4">
                  {item.desc}
                </p>
              </div>
              <Link 
                href={item.href}
                className="text-[11px] font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors inline-flex items-center gap-1.5 pt-2 border-t border-stone-100"
              >
                <span>{item.linkText}</span>
                <ArrowRight className="w-3 h-3 text-[#8C734B]" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* AEO (Answer Engine Optimization) FAQ & Entity Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20" aria-labelledby="aeo-faq-heading">
        <h2 id="aeo-faq-heading" className="sr-only">About Ekora Bazaar Wholesale & Raw Materials</h2>
        <HomepageFaqAccordion />
      </section>

      <BuyerFooter />
    </main>
  );
}

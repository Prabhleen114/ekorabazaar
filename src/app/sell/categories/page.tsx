import serialize from "serialize-javascript";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { 
  Flame, 
  Box, 
  Droplets, 
  Gem, 
  Sparkles, 
  Package, 
  Leaf, 
  ArrowRight,
  FlaskConical,
  Grid,
  Palette,
  Wrench
} from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale Material Categories | Ekora Bazaar",
  description:
    "Explore verified wholesale raw material categories on Ekora Bazaar — candle molds, silicone molds, fragrance oils, essential oils, soy wax, resin, soap bases, and packaging containers.",
  keywords: [
    "silicone molds wholesale India",
    "candle making supplies India",
    "fragrance oil wholesale",
    "resin art molds India",
    "soap base wholesale",
    "Ekora raw material categories",
  ],
  alternates: {
    canonical: "https://www.ekorabazaar.in/sell/categories",
  },
  openGraph: {
    title: "Wholesale Material Categories | Ekora Bazaar",
    description:
      "Explore verified wholesale raw material categories on Ekora Bazaar — candle molds, silicone molds, fragrance oils, essential oils, soy wax, resin, soap bases, and packaging containers.",
    url: "https://www.ekorabazaar.in/sell/categories",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://www.ekorabazaar.in/og-image.jpg",
        secureUrl: "https://www.ekorabazaar.in/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ekora Bazaar — India's Premier Wholesale Raw Materials Marketplace",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wholesale Material Categories | Ekora Bazaar",
    description:
      "Explore verified wholesale raw material categories on Ekora Bazaar — candle molds, silicone molds, fragrance oils, essential oils, soy wax, resin, soap bases, and packaging containers.",
    images: ["https://www.ekorabazaar.in/og-image.jpg"],
  },
};

export default function CategoriesPage() {
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
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: "https://www.ekorabazaar.in/sell/categories",
      },
    ],
  };

  const rawMaterialCategories = [
    {
      name: "Eco-Resin & Stone Moulds",
      categoryParam: "Eco-Resin & Stone Moulds",
      count: "359 Items",
      desc: "Tray, coaster, vessel, and planter moulds for jesmonite, concrete, and eco-resin.",
      icon: Gem,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      name: "Culinary & Fondant Moulds",
      categoryParam: "Culinary & Fondant Moulds",
      count: "332 Items",
      desc: "Food-grade silicone molds for cake decorating, chocolate, and sugarcraft.",
      icon: Box,
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
    {
      name: "Fragrance Oils",
      categoryParam: "Fragrance Oils",
      count: "307 Blends",
      desc: "Concentrated aroma oils for soy candles, CP soaps, diffusers, and fine cosmetics.",
      icon: Droplets,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      name: "General Silicone Moulds",
      categoryParam: "General Silicone Moulds",
      count: "236 Items",
      desc: "Flexible high-durability silicone molds for general casting, plaster, and clay.",
      icon: Grid,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      name: "Candle & Pillar Moulds",
      categoryParam: "Candle & Pillar Moulds",
      count: "205 Items",
      desc: "3D pillar, flower, body torso, geometric, and decorative silicone candle molds.",
      icon: Flame,
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      name: "Containers & Packaging",
      categoryParam: "Containers & Packaging",
      count: "172 Items",
      desc: "Amber glass dropper bottles, clear-lid metal tin boxes, candle jars, and caps.",
      icon: Package,
      color: "bg-orange-50 text-orange-600 border-orange-100",
    },
    {
      name: "Pure Essential Oils",
      categoryParam: "Essential Oils",
      count: "107 Pure Oils",
      desc: "Steam-distilled therapeutic grade plant extracts and natural aromatics.",
      icon: Leaf,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      name: "Soap & Bar Moulds",
      categoryParam: "Soap & Bar Moulds",
      count: "65 Items",
      desc: "Bar molds, loaf molds, bath bomb presses, and decorative soap making silicone.",
      icon: Sparkles,
      color: "bg-teal-50 text-teal-600 border-teal-100",
    },
    {
      name: "Premium Bases & Waxes",
      categoryParam: "Premium Bases & Waxes",
      count: "67 Products",
      desc: "Natural soy wax flakes, melt & pour soap bases, paraffin, and cosmetic bases.",
      icon: FlaskConical,
      color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    },
    {
      name: "Pigments & Colors",
      categoryParam: "Pigments & Colors",
      count: "25 Products",
      desc: "Mica powders, liquid resin pigments, candle dyes, and cosmetic safe colorants.",
      icon: Palette,
      color: "bg-pink-50 text-pink-600 border-pink-100",
    },
    {
      name: "Hydrosols",
      categoryParam: "Hydrosols",
      count: "19 Botanicals",
      desc: "Steam-distilled floral and herbal waters — lavender, rose, sandalwood & more.",
      icon: Droplets,
      color: "bg-sky-50 text-sky-600 border-sky-100",
    },
    {
      name: "Candle Making Accessories",
      categoryParam: "Candle Making Accessories",
      count: "9 Products",
      desc: "Cotton wicks, wooden wicks, sustainers, wick stickers, and testing tools.",
      icon: Wrench,
      color: "bg-stone-50 text-stone-600 border-stone-100",
    },
  ];

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serialize(breadcrumbSchema, { isJSON: true }),
        }}
      />
      <BuyerNavbar />
      
      {/* Hero Section */}
      <section className="pt-20 md:pt-28 pb-12 px-6 text-center max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 border border-brand-linen bg-white rounded-full px-4 py-1 text-xs font-semibold text-brand-charcoal/70 mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
          1,988 Verified Wholesale Products
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight text-brand-charcoal mb-4">
          Wholesale Material Categories
        </h1>
        <p className="text-base md:text-lg text-brand-charcoal/70 max-w-2xl mx-auto leading-relaxed">
          Source batch-tested silicone moulds, fragrance oils, waxes, resin materials, and packaging directly from verified manufacturers at tiered factory prices.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="py-12 bg-white border-y border-brand-linen">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rawMaterialCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  href={`/shop?category=${encodeURIComponent(category.categoryParam)}`}
                  className="group bg-brand-bg rounded-2xl p-6 border border-brand-linen/70 hover:border-brand-orange/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${category.color} border flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-brand-linen text-brand-orange shadow-sm">
                        {category.count}
                      </span>
                    </div>
                    <h3 className="font-bold text-brand-charcoal text-xl mb-2 group-hover:text-brand-orange transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs md:text-sm text-brand-charcoal/60 leading-relaxed mb-6">
                      {category.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors pt-4 border-t border-brand-linen/40">
                    <span>Browse {category.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Supplier & Sourcing CTA */}
      <section className="py-16 bg-brand-bg border-b border-brand-linen text-center px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal mb-4">
            Do You Manufacture Craft Supplies?
          </h2>
          <p className="text-base text-brand-charcoal/70 mb-8 max-w-xl mx-auto">
            List your raw materials, silicone moulds, or packaging supplies on Ekora Bazaar and connect directly with thousands of independent makers across India.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sell/start-selling"
              className="w-full sm:w-auto bg-brand-orange hover:bg-brand-terracotta text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-orange/20"
            >
              Apply as a Supplier
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto bg-white border border-brand-linen hover:border-brand-charcoal text-brand-charcoal px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              Explore Full Wholesale Catalog
            </Link>
          </div>
        </div>
      </section>

      <BuyerFooter />
    </main>
  );
}

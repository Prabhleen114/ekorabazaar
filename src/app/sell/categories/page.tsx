import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Gift } from "lucide-react";

export const metadata = {
  title: "Categories — Ekora",
  description: "Explore the wide range of categories available on Ekora's creator marketplace.",
};

export default function CategoriesPage() {
  const categories = [
    { name: "Resin Art", image: "/images/resin_art.png", desc: "Custom resin trays, coasters, and preserved items." },
    { name: "Home Decor", image: "/images/home_decor.png", desc: "Wall art, macrame, and decorative interior pieces." },
    { name: "Candles", image: "/images/candles.png", desc: "Hand-poured soy, beeswax, and decorative candles." },
    { name: "Pottery", image: "/images/pottery.png", desc: "Hand-thrown ceramics, mugs, and clay creations." },
    { name: "Jewelry", image: "/images/jewelry.png", desc: "Handmade necklaces, earrings, and custom pieces." },
    { name: "Crochet", image: "/images/crochet.png", desc: "Hand-knit amigurumi, clothing, and accessories." },
    { name: "Paintings", image: "/images/paintings.png", desc: "Original canvas, watercolor, and digital art prints." },
    { name: "Custom Gifts", icon: Gift, desc: "Personalized hampers and made-to-order gifts." },
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold font-serif tracking-tight text-zinc-900 mb-6">
            Explore Categories
          </h1>
          <p className="text-xl text-zinc-500 leading-relaxed">
            From hand-poured candles to custom jewelry, discover the incredible variety of products made by India&apos;s independent creators.
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 bg-white border-t border-zinc-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <div
                key={category.name}
                className="group flex flex-col cursor-default"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 mb-4 shadow-sm flex items-center justify-center">
                  <div className="absolute top-4 right-4 z-10 text-xs font-semibold text-zinc-600 bg-white/90 backdrop-blur-md rounded-full px-2.5 py-1 shadow-sm">
                    Coming Soon
                  </div>
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : category.icon ? (
                    <category.icon className="w-12 h-12 text-zinc-400 group-hover:scale-110 transition-transform duration-500" />
                  ) : null}
                </div>
                <h3 className="font-bold text-zinc-900 text-lg mb-1">{category.name}</h3>
                <p className="text-sm text-zinc-500 line-clamp-2">{category.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-zinc-50 border-t border-zinc-200 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-8">
            Want to sell in these categories?
          </h2>
          <Link
            href="/start-selling"
            className="inline-flex items-center justify-center bg-zinc-900 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-zinc-800 transition-colors"
          >
            Apply for Early Access
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

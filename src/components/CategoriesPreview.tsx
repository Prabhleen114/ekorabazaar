import Link from "next/link";
import Image from "next/image";

export default function CategoriesPreview() {
  const categories = [
    { name: "Resin Art", image: "/images/resin_art.png" },
    { name: "Home Decor", image: "/images/home_decor.png" },
    { name: "Candles", image: "/images/candles.png" },
    { name: "Pottery", image: "/images/pottery.png" },
    { name: "Jewelry", image: "/images/jewelry.png" },
    { name: "Crochet", image: "/images/crochet.png" },
  ];

  return (
    <section className="bg-white border-t border-brand-linen py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4 block">
            Explore
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-serif tracking-tight text-zinc-900 mb-4">
            Discover What Creators Make.
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            From hand-poured candles to custom jewelry, Ekora is home to India&apos;s most talented independent creators.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-16">
          {categories.map((category) => (
            <div
              key={category.name}
              className="group flex flex-col gap-4 cursor-default"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              <h3 className="font-semibold text-zinc-900 text-lg text-center">{category.name}</h3>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/sell/categories"
            className="inline-flex items-center justify-center bg-brand-linen hover:bg-brand-charcoal/10 text-brand-charcoal px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Explore All Categories →
          </Link>
        </div>
      </div>
    </section>
  );
}

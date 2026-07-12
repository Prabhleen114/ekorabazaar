import BuyerNavbar from "@/components/BuyerNavbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";


type Formulation = {
  title: string;
  url: string;
  imageUrl: string;
  excerpt: string;
  content: string;
};

export const metadata = {
  title: "Free Formulations | Ekora Bazaar",
  description: "Explore our collection of free cosmetic, skincare, and candle making formulations. High-quality recipes crafted by experts.",
};

import dataRaw from "@/lib/data/formulations.json";

export default function FormulationsPage() {
  const data: Formulation[] = dataRaw as Formulation[];
  
  // Create slugs for internal routing
  const formulations = data.map((item) => {
    const slug = item.url.split("/").pop() || "";
    return { ...item, slug };
  });

  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal selection:bg-brand-orange/20">
      <BuyerNavbar />

      <section className="pt-24 md:pt-28 pb-16 md:pt-28 md:pt-32 md:pb-16 md:pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h4 className="text-brand-orange font-bold uppercase tracking-[0.2em] mb-4 text-sm">
            Expert Recipes
          </h4>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-charcoal mb-6">
            Free Formulations
          </h1>
          <p className="text-brand-charcoal/70 text-lg leading-relaxed">
            Discover a library of professional formulations for skincare, haircare, and beyond. Designed for makers looking to elevate their craft.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {formulations.map((formulation, idx) => (
            <Link 
              key={idx} 
              href={`/formulations/${formulation.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-brand-linen hover:border-brand-orange/50 hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[4/3] bg-brand-charcoal/5 relative overflow-hidden">
                {formulation.imageUrl ? (
                  <Image 
                    src={formulation.imageUrl} 
                    alt={formulation.title} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-serif italic text-brand-charcoal/30">Ekora</span>
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-serif font-bold text-xl text-brand-charcoal mb-3 line-clamp-2 group-hover:text-brand-orange transition-colors">
                  {formulation.title}
                </h3>
                <p className="text-brand-charcoal/70 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                  {formulation.excerpt}
                </p>
                <div className="mt-auto flex items-center text-brand-orange font-bold text-sm tracking-wide uppercase">
                  Read Recipe <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

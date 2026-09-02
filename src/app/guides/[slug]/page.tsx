import { ALL_CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

// Convert slug back to Category Name for matching
function slugToCategoryLabel(slug: string) {
  return ALL_CATEGORIES.find(c => c.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) || 
         ALL_CATEGORIES.find(c => c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categoryObj = slugToCategoryLabel(slug);
  
  if (!categoryObj) {
    return { title: "Guide Not Found" };
  }

  const title = `The Ultimate B2B Buying Guide for ${categoryObj.label} in India`;
  const description = `Learn how to source and buy wholesale ${categoryObj.label} efficiently in India. Essential tips for B2B buyers on Ekora Bazaar.`;
  const url = `https://www.ekorabazaar.in/guides/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    }
  };
}

export async function generateStaticParams() {
  return ALL_CATEGORIES.map((cat) => ({
    slug: cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const categoryObj = slugToCategoryLabel(slug);

  if (!categoryObj) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
      <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto w-full flex-1">
        
        <article className="bg-white p-8 md:p-12 rounded-3xl border border-brand-linen shadow-sm prose prose-stone max-w-none">
          <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-charcoal mb-6">
            B2B Buying Guide: Wholesale {categoryObj.label}
          </h1>
          
          <p className="text-lg text-brand-charcoal/80 leading-relaxed mb-8">
            Whether you are a small creator, an emerging brand, or a large retail enterprise, sourcing high-quality <strong>{categoryObj.label}</strong> is critical to your business success. 
            This guide covers everything you need to know about purchasing these raw materials in bulk in India.
          </p>

          <h2 className="text-2xl font-bold text-brand-charcoal mt-8 mb-4">1. Understanding Quality Standards</h2>
          <p className="text-brand-charcoal/70 mb-6">
            When buying {categoryObj.label} wholesale, always look for suppliers who provide COA (Certificate of Analysis) and MSDS (Material Safety Data Sheets) where applicable. Batch consistency is crucial for manufacturing.
          </p>

          <h2 className="text-2xl font-bold text-brand-charcoal mt-8 mb-4">2. Minimum Order Quantities (MOQ)</h2>
          <p className="text-brand-charcoal/70 mb-6">
            B2B suppliers on Ekora Bazaar offer tiered pricing. While the MOQ ensures you get wholesale rates, larger volumes will unlock deeper discounts. Always forecast your inventory needs to hit the optimal pricing tier.
          </p>

          <h2 className="text-2xl font-bold text-brand-charcoal mt-8 mb-4">3. Sourcing Locally in India</h2>
          <p className="text-brand-charcoal/70 mb-6">
            Importing raw materials can cause supply chain delays. By connecting directly with verified Indian manufacturers of {categoryObj.label} on Ekora Bazaar, you minimize shipping times, reduce import duties, and support the local economy.
          </p>

          <div className="mt-12 p-8 bg-stone-50 rounded-2xl border border-brand-linen text-center">
            <h3 className="text-xl font-bold text-brand-charcoal mb-4">Ready to start sourcing?</h3>
            <p className="text-brand-charcoal/70 mb-6">Explore our curated list of verified manufacturers and suppliers for {categoryObj.label}.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/wholesale/${slug}`} className="bg-brand-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-terracotta transition-colors shadow-md inline-block">
                View Wholesale Suppliers
              </Link>
              <Link href={`/shop?category=${encodeURIComponent(categoryObj.label)}`} className="bg-white text-brand-charcoal border border-brand-linen px-6 py-3 rounded-xl font-semibold hover:bg-stone-50 transition-colors inline-block">
                Browse Marketplace
              </Link>
            </div>
          </div>
        </article>
      </div>

      <BuyerFooter />
    </main>
  );
}

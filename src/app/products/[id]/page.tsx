import { getProductById } from "@/lib/products";
import { notFound } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import PricingWidget from "@/components/PricingWidget";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

// Generate SEO Metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  
  if (!product) {
    return { title: "Product Not Found | Ekora" };
  }

  return {
    title: `${product.name} | Ekora Wholesale`,
    description: product.description,
    openGraph: {
      title: `${product.name} - Buy Wholesale on Ekora`,
      description: product.description,
      type: "article",
    },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  // Pre-populated JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "offers": {
      "@type": "AggregateOffer",
      "offerCount": product.tiers.length,
      "lowPrice": product.tiers[product.tiers.length - 1].price,
      "highPrice": product.tiers[0].price,
      "priceCurrency": "INR"
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
      {/* Inject JSON-LD Schema for SEO Engine */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-12">
        {/* Product Image Gallery (Mock) */}
        <div className="w-full md:w-1/2">
          <div className="aspect-square bg-white rounded-3xl border border-brand-linen flex items-center justify-center p-8 sticky top-32 shadow-sm">
             <div className="text-center opacity-30">
               <span className="text-4xl font-bold font-serif mb-4 block">Ekora</span>
               <p>[Product Image Placeholder]</p>
             </div>
          </div>
        </div>

        {/* Product Info & Pricing */}
        <div className="w-full md:w-1/2">
          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{product.category}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal mb-4">
            {product.name}
          </h1>
          <p className="text-brand-charcoal/70 leading-relaxed mb-6">
            {product.description}
          </p>

          <div className="flex items-center gap-4 mb-8 text-sm">
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> In Stock
            </div>
            <div className="text-brand-charcoal/50">
              Ships in 24 hours
            </div>
          </div>

          <PricingWidget basePrice={product.price} tiers={product.tiers} />
          
          {/* Trust factors */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-brand-linen pt-8">
            <div className="bg-white p-4 rounded-xl border border-brand-linen">
              <h4 className="font-bold text-sm text-brand-charcoal mb-1">COA Available</h4>
              <p className="text-xs text-brand-charcoal/50">Download test results after purchase.</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-brand-linen">
              <h4 className="font-bold text-sm text-brand-charcoal mb-1">Batch Matched</h4>
              <p className="text-xs text-brand-charcoal/50">Consistent quality across all orders.</p>
            </div>
          </div>
        </div>
      </div>

      <BuyerFooter />
    </main>
  );
}

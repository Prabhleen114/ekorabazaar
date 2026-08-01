import { getProductById } from "@/lib/products";
import { notFound } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import PricingWidget from "@/components/PricingWidget";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import serialize from "serialize-javascript";
import { ChevronRight } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

// Generate SEO Metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  
  if (!product) {
    return { title: "Product Not Found | Ekora Bazaar" };
  }

  return {
    title: `${product.name} | Ekora Wholesale`,
    description: product.description,
    keywords: product.tags || [product.name, product.category, "wholesale raw materials", "Ekora"],
    alternates: {
      canonical: `https://www.ekorabazaar.in/products/${id}`,
    },
    openGraph: {
      title: `${product.name} - Buy Wholesale on Ekora`,
      description: product.description,
      url: `https://www.ekorabazaar.in/products/${id}`,
      type: "article",
      images: [
        {
          url: product.image || "https://www.ekorabazaar.in/og-image.jpg",
          secureUrl: product.image || "https://www.ekorabazaar.in/og-image.jpg",
          width: 800,
          height: 800,
          alt: product.name,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} - Buy Wholesale on Ekora`,
      description: product.description,
      images: [product.image || "https://www.ekorabazaar.in/og-image.jpg"],
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
    "keywords": product.tags ? product.tags.join(', ') : "",
    "offers": {
      "@type": "AggregateOffer",
      "offerCount": product.tiers.length,
      "lowPrice": product.tiers[product.tiers.length - 1].price,
      "highPrice": product.tiers[0].price,
      "priceCurrency": "INR"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.ekorabazaar.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shop",
        "item": "https://www.ekorabazaar.in/shop"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://www.ekorabazaar.in/products/${product.id}`
      }
    ]
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
      {/* Inject JSON-LD Schema for SEO Engine */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(jsonLd, { isJSON: true }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(breadcrumbSchema, { isJSON: true }) }}
      />
      {/* Visually hidden SEO tags */}
      {product.tags && (
        <div className="sr-only" aria-hidden="true">
          {product.tags.join(', ')}
        </div>
      )}

      <div className="pt-24 md:pt-28 pb-20 px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-12">
        {/* Product Image Gallery (Optimized) */}
        <div className="w-full md:w-1/2">
          <div className="aspect-square bg-white rounded-3xl border border-brand-linen flex items-center justify-center p-8 sticky top-32 shadow-sm overflow-hidden relative">
            <Image 
              src={product.image || "/og-image.jpg"} 
              alt={product.name} 
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-8" 
            />
          </div>
        </div>

        {/* Product Info & Pricing */}
        <div className="w-full md:w-1/2">
          {/* Visual Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center text-xs font-semibold text-brand-charcoal/50 mb-4">
            <Link href="/" className="hover:text-brand-orange transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 mx-1" />
            <Link href="/shop" className="hover:text-brand-orange transition-colors">Shop</Link>
            <ChevronRight className="w-3 h-3 mx-1" />
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-brand-orange transition-colors">{product.category}</Link>
          </nav>
          
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
          
          {/* Fragrance Notes Pyramid */}
          {product.fragranceNotes && (
            <div className="mt-10 border-t border-brand-linen pt-8">
              <h3 className="font-bold font-serif text-xl text-brand-charcoal mb-6 text-center bg-rose-50 text-rose-900 py-2.5 rounded-xl border border-rose-100 shadow-sm">Fragrance Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-brand-linen text-center shadow-sm hover:border-rose-200 transition-colors">
                  <h4 className="text-[10px] font-bold tracking-widest text-brand-charcoal/50 uppercase mb-3">Top Notes</h4>
                  <p className="font-medium text-brand-charcoal text-sm leading-relaxed">{product.fragranceNotes.top?.join(", ")}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-brand-linen text-center shadow-sm hover:border-rose-200 transition-colors">
                  <h4 className="text-[10px] font-bold tracking-widest text-brand-charcoal/50 uppercase mb-3">Heart Notes</h4>
                  <p className="font-medium text-brand-charcoal text-sm leading-relaxed">{product.fragranceNotes.heart?.join(", ")}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-brand-linen text-center shadow-sm hover:border-rose-200 transition-colors">
                  <h4 className="text-[10px] font-bold tracking-widest text-brand-charcoal/50 uppercase mb-3">Base Notes</h4>
                  <p className="font-medium text-brand-charcoal text-sm leading-relaxed">{product.fragranceNotes.base?.join(", ")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Usage Table */}
          {product.usageLevels && (
            <div className="mt-10 border-t border-brand-linen pt-8">
              <h3 className="font-bold font-serif text-xl text-brand-charcoal mb-6 text-center bg-brand-linen/30 py-2.5 rounded-xl">Recommended Usage Levels</h3>
              <div className="overflow-hidden rounded-2xl border border-brand-linen shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-brand-linen/40 text-brand-charcoal/60 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Application</th>
                      <th className="px-6 py-4 text-right">Recommended Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-linen bg-white">
                    {Object.entries(product.usageLevels).map(([app, usage]) => (
                      <tr key={app} className="hover:bg-brand-bg/50 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-brand-charcoal">{app}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-brand-orange">{usage as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trust factors */}
          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-brand-linen pt-8">
            <div className="bg-white p-5 rounded-2xl border border-brand-linen shadow-sm">
              <h4 className="font-bold text-sm text-brand-charcoal mb-1">COA Available</h4>
              <p className="text-xs text-brand-charcoal/50 leading-relaxed">Download test results after purchase.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-brand-linen shadow-sm">
              <h4 className="font-bold text-sm text-brand-charcoal mb-1">Batch Matched</h4>
              <p className="text-xs text-brand-charcoal/50 leading-relaxed">Consistent quality across all orders.</p>
            </div>
          </div>
        </div>
      </div>

      <BuyerFooter />
    </main>
  );
}

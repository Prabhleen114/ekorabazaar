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

      <div className="pt-16 md:pt-28 pb-32 md:pb-20 px-0 md:px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-0 md:gap-12">
        {/* Product Image Gallery (Optimized) */}
        <div className="w-full md:w-1/2">
          {/* Edge-to-edge on mobile, rounded on desktop */}
          <div className="aspect-square bg-white md:rounded-3xl md:border border-brand-linen flex items-center justify-center p-0 md:p-8 md:sticky md:top-32 shadow-none md:shadow-sm overflow-hidden relative">
            <Image 
              src={product.image || "/og-image.jpg"} 
              alt={product.name} 
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover md:object-contain" 
            />
          </div>
        </div>

        {/* Product Info & Pricing */}
        <div className="w-full md:w-1/2 px-5 md:px-0 pt-6 md:pt-0">
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
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal mb-3 md:mb-4">
            {product.name}
          </h1>
          
          <div className="hidden md:block">
            <p className="text-brand-charcoal/70 leading-relaxed mb-6">
              {product.description}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-8 text-sm">
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> In Stock
            </div>
            <div className="text-brand-charcoal/50">
              Ships in 24 hours
            </div>
          </div>

          <PricingWidget basePrice={product.price} tiers={product.tiers} />
          
          {/* Details / Specifications (Collapsible on Mobile) */}
          <div className="mt-8 space-y-4">
            {/* Description (Mobile Only) */}
            <details className="md:hidden group bg-white border border-brand-linen rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="font-bold text-base text-brand-charcoal p-4 cursor-pointer flex justify-between items-center bg-stone-50 group-open:bg-white transition-colors">
                Product Description
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 pt-0 text-brand-charcoal/70 leading-relaxed text-sm border-t border-brand-linen">
                {product.description}
              </div>
            </details>

            {/* Fragrance Notes */}
            {product.fragranceNotes && (
              <details className="group bg-white border border-brand-linen rounded-2xl overflow-hidden md:border-none md:bg-transparent [&_summary::-webkit-details-marker]:hidden" open>
                <summary className="font-bold text-base md:font-serif md:text-xl text-brand-charcoal p-4 md:p-0 md:mb-6 cursor-pointer flex justify-between items-center bg-stone-50 md:bg-transparent group-open:bg-white md:pointer-events-none transition-colors">
                  <span className="md:bg-rose-50 md:text-rose-900 md:py-2.5 md:px-6 md:rounded-xl md:border md:border-rose-100 md:shadow-sm md:w-full md:text-center md:block">Fragrance Notes</span>
                  <span className="transition group-open:rotate-180 md:hidden">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-4 pt-0 md:p-0 border-t border-brand-linen md:border-none text-brand-charcoal/70 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-2 md:mt-0">
                    <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-brand-linen text-center shadow-sm hover:border-rose-200 transition-colors">
                      <h4 className="text-[10px] font-bold tracking-widest text-brand-charcoal/50 uppercase mb-2 md:mb-3">Top Notes</h4>
                      <p className="font-medium text-brand-charcoal text-sm leading-relaxed">
                        {Array.isArray(product.fragranceNotes.top) ? product.fragranceNotes.top.join(", ") : product.fragranceNotes.top}
                      </p>
                    </div>
                    <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-brand-linen text-center shadow-sm hover:border-rose-200 transition-colors">
                      <h4 className="text-[10px] font-bold tracking-widest text-brand-charcoal/50 uppercase mb-2 md:mb-3">Heart Notes</h4>
                      <p className="font-medium text-brand-charcoal text-sm leading-relaxed">
                        {Array.isArray(product.fragranceNotes.heart) ? product.fragranceNotes.heart.join(", ") : product.fragranceNotes.heart}
                      </p>
                    </div>
                    <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-brand-linen text-center shadow-sm hover:border-rose-200 transition-colors">
                      <h4 className="text-[10px] font-bold tracking-widest text-brand-charcoal/50 uppercase mb-2 md:mb-3">Base Notes</h4>
                      <p className="font-medium text-brand-charcoal text-sm leading-relaxed">
                        {Array.isArray(product.fragranceNotes.base) ? product.fragranceNotes.base.join(", ") : product.fragranceNotes.base}
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            )}

            {/* Recommended Usage */}
            {product.usageLevels && (
              <details className="group bg-white border border-brand-linen rounded-2xl overflow-hidden md:border-none md:bg-transparent [&_summary::-webkit-details-marker]:hidden" open>
                <summary className="font-bold text-base md:font-serif md:text-xl text-brand-charcoal p-4 md:p-0 md:mb-6 cursor-pointer flex justify-between items-center bg-stone-50 md:bg-transparent group-open:bg-white md:pointer-events-none transition-colors">
                  <span className="md:bg-brand-linen/30 md:py-2.5 md:px-6 md:rounded-xl md:w-full md:text-center md:block">Recommended Usage</span>
                  <span className="transition group-open:rotate-180 md:hidden">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-4 pt-0 md:p-0 border-t border-brand-linen md:border-none">
                  <div className="overflow-hidden rounded-xl md:rounded-2xl border border-brand-linen shadow-sm mt-2 md:mt-0">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-brand-linen/40 text-brand-charcoal/60 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-4 md:px-6 py-3 md:py-4">Application</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 text-right">Recommended Usage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-linen bg-white">
                        {Object.entries(product.usageLevels).map(([app, usage]) => (
                          <tr key={app} className="hover:bg-brand-bg/50 transition-colors">
                            <td className="px-4 md:px-6 py-3 font-medium text-brand-charcoal text-xs md:text-sm">{app}</td>
                            <td className="px-4 md:px-6 py-3 text-right font-bold text-brand-orange text-xs md:text-sm">{usage as string}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            )}
          </div>

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

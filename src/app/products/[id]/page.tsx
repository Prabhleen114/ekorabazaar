import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import PricingWidget from "@/components/PricingWidget";
import { Metadata } from "next";
import ProductImageClient from "@/components/ProductImageClient";
import Link from "next/link";
import serialize from "serialize-javascript";
import { ChevronRight } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

// Generate SEO Metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { seller: true }
  });
  
  if (!product || product.status !== ProductStatus.PUBLISHED || product.seller?.accountStatus !== 'ACTIVE') {
    return { title: "Product Not Found | Ekora Bazaar" };
  }

  const imageUrl = product.imageUrl || "https://www.ekorabazaar.in/og-image.jpg";

  return {
    title: `${product.title} | Ekora Wholesale`,
    description: product.description || "Premium wholesale material",
    keywords: [product.title, "wholesale raw materials", "Ekora"],
    alternates: {
      canonical: `https://www.ekorabazaar.in/products/${id}`,
    },
    openGraph: {
      title: `${product.title} - Buy Wholesale on Ekora`,
      description: product.description || "Premium wholesale material",
      url: `https://www.ekorabazaar.in/products/${id}`,
      type: "article",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 800,
          height: 800,
          alt: product.title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} - Buy Wholesale on Ekora`,
      description: product.description || "Premium wholesale material",
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { seller: true }
  });

  if (!product || product.status !== ProductStatus.PUBLISHED || product.seller?.accountStatus !== 'ACTIVE') {
    notFound();
  }

  const effectivePrice = (product.customerPrice ?? product.price) / 100;
  const imageUrl = product.imageUrl || "/og-image.jpg";
  const category = "General"; // Map from DB or default

  const displayProduct = {
    ...product,
    name: product.title,
    image: imageUrl,
    category: category,
    tags: [],
    price: effectivePrice,
    tiers: Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0
      ? (product.wholesaleTiers as any[]).map(t => ({
          ...t,
          price: t.price ? t.price : effectivePrice,
          minQty: t.minQty || product.moq
        }))
      : [{ price: effectivePrice, minQty: product.moq, maxQty: null, discountPct: 0 }],
    fragranceNotes: null as any,
    usageLevels: null as any
  };

  // Pre-populated JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": displayProduct.name,
    "image": displayProduct.image,
    "description": displayProduct.description || "",
    "offers": {
      "@type": "Offer",
      "price": displayProduct.price,
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
        "name": displayProduct.name,
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
      {displayProduct.tags && displayProduct.tags.length > 0 && (
        <div className="sr-only" aria-hidden="true">
          {displayProduct.tags.join(', ')}
        </div>
      )}

      <div className="pt-16 md:pt-28 pb-32 md:pb-20 px-0 md:px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-0 md:gap-12">
        {/* Product Image Gallery (Optimized) */}
        <div className="w-full md:w-1/2">
          {/* Edge-to-edge on mobile, rounded on desktop */}
          <div className="aspect-square bg-white md:rounded-3xl md:border border-brand-linen flex items-center justify-center p-0 md:p-8 md:sticky md:top-32 shadow-none md:shadow-sm overflow-hidden relative">
            <ProductImageClient 
              src={displayProduct.image} 
              alt={displayProduct.name} 
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
            <Link href={`/shop?category=${encodeURIComponent(displayProduct.category)}`} className="hover:text-brand-orange transition-colors">{displayProduct.category}</Link>
          </nav>
          
          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{displayProduct.category}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal mb-3 md:mb-4">
            {displayProduct.name}
          </h1>
          
          <div className="hidden md:block">
            <p className="text-brand-charcoal/70 leading-relaxed mb-6">
              {displayProduct.description}
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

          <PricingWidget tiers={displayProduct.tiers} moq={product.moq} />
          
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
                {displayProduct.description}
              </div>
            </details>

            {/* Fragrance Notes */}
            {displayProduct.fragranceNotes && (
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
                        {Array.isArray(displayProduct.fragranceNotes.top) ? displayProduct.fragranceNotes.top.join(", ") : displayProduct.fragranceNotes.top}
                      </p>
                    </div>
                    <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-brand-linen text-center shadow-sm hover:border-rose-200 transition-colors">
                      <h4 className="text-[10px] font-bold tracking-widest text-brand-charcoal/50 uppercase mb-2 md:mb-3">Heart Notes</h4>
                      <p className="font-medium text-brand-charcoal text-sm leading-relaxed">
                        {Array.isArray(displayProduct.fragranceNotes.heart) ? displayProduct.fragranceNotes.heart.join(", ") : displayProduct.fragranceNotes.heart}
                      </p>
                    </div>
                    <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-brand-linen text-center shadow-sm hover:border-rose-200 transition-colors">
                      <h4 className="text-[10px] font-bold tracking-widest text-brand-charcoal/50 uppercase mb-2 md:mb-3">Base Notes</h4>
                      <p className="font-medium text-brand-charcoal text-sm leading-relaxed">
                        {Array.isArray(displayProduct.fragranceNotes.base) ? displayProduct.fragranceNotes.base.join(", ") : displayProduct.fragranceNotes.base}
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            )}

            {/* Recommended Usage */}
            {displayProduct.usageLevels && (
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
                        {Object.entries(displayProduct.usageLevels).map(([app, usage]) => (
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
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-brand-linen pt-8">
            <div className="bg-white p-5 rounded-2xl border border-brand-linen shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 2v2a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3V2M9 14h6M9 18h6M14 2h.01"/><path d="M8.5 2h7l4.5 18a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2z"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-xs text-brand-charcoal mb-0.5">Lab Tested</h4>
                <p className="text-[11px] text-brand-charcoal/60 leading-relaxed">COA &amp; MSDS batch certified.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-brand-linen shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-xs text-brand-charcoal mb-0.5">Batch Matched</h4>
                <p className="text-[11px] text-brand-charcoal/60 leading-relaxed">100% consistent formulation.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-brand-linen shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-xs text-brand-charcoal mb-0.5">Instant Docs</h4>
                <p className="text-[11px] text-brand-charcoal/60 leading-relaxed">COA PDF included with order.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BuyerFooter />
    </main>
  );
}

import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { notFound, permanentRedirect } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import PricingWidget from "@/components/PricingWidget";
import { Metadata } from "next";
import ProductImageClient from "@/components/ProductImageClient";
import ContactSupplierButton from "@/components/ContactSupplierButton";
import Link from "next/link";
import serialize from "serialize-javascript";
import { ChevronRight, MessageCircle } from "lucide-react";
import { TrackViewItem } from "@/components/GA4Tracker";
import { generateProductMetadata, generateProductSchema, generateBreadcrumbSchema, generateFaqSchema } from "@/lib/seo";
import { getDepartmentForCategory } from "@/lib/taxonomy";
import TechnicalDocsSection from "@/components/TechnicalDocsSection";
import ProductFaqSection, { getCategoryFaqs } from "@/components/ProductFaqSection";

import catalogProducts from "@/lib/data/products.json";

export const revalidate = 3600;

export interface ProductDetailView {
  rawProduct: any;
  id: string;
  name: string;
  image: string;
  category: string;
  department: string;
  tags: string[];
  price: number;
  moq: number;
  tiers: any[];
  description: string;
  supplierName: string;
  sellerId: string | null;
  inStock: boolean;
  isQuoteOnly?: boolean;
  fragranceNotes: any;
  usageLevels: any;
}

type Props = {
  params: Promise<{ id: string }>;
};

async function getProductData(id: string): Promise<ProductDetailView | null> {
  // 1. Try DB first
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (product && product.status === ProductStatus.PUBLISHED && product.seller?.accountStatus === 'ACTIVE') {
      const effectivePrice = (product.customerPrice ?? product.price) / 100;
      const imageUrl = product.imageUrl || "/og-image.jpg";
      const category = product.category || "General Silicone Moulds";
      const department = getDepartmentForCategory(category) || "Precision Studio Moulds";

      const tiers = Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0
        ? (product.wholesaleTiers as any[]).map(t => ({
            ...t,
            price: t.price ? Math.round(t.price / 100) : effectivePrice,
            minQty: t.minQty || product.moq
          }))
        : [{ price: effectivePrice, minQty: product.moq, maxQty: null, discountPct: 0 }];

      return {
        rawProduct: product,
        id: product.id,
        name: product.title,
        image: imageUrl,
        category,
        department,
        tags: [] as string[],
        price: effectivePrice,
        moq: product.moq || 1,
        tiers,
        description: product.description || "",
        supplierName: product.seller?.brandName || "Verified Ekora Supplier",
        sellerId: product.sellerId,
        inStock: product.stock > 0,
        isQuoteOnly: false,
        fragranceNotes: null as any,
        usageLevels: null as any
      };
    }
  } catch (err) {
    // Database query fallback
  }

  // 2. Fallback to active catalog (2,374 SKUs in products.json)
  const item = (catalogProducts as any[]).find(p => String(p.id) === String(id));
  if (item) {
    const priceVal = typeof item.price === "number" ? item.price : parseFloat(item.price || "0");
    const isQuoteOnly = item.isQuoteOnly === true || priceVal === 0 || item.inStock === false;
    const category = item.category || "General Silicone Moulds";
    const department = item.department || getDepartmentForCategory(category) || "Precision Studio Moulds";
    const tiers = isQuoteOnly
      ? []
      : (Array.isArray(item.tiers) && item.tiers.length > 0
          ? item.tiers
          : [{ price: priceVal, minQty: 1, maxQty: null, discountPct: 0 }]);

    const fakePrismaProduct: any = {
      id: String(item.id),
      title: item.name || "Untitled Product",
      category,
      price: Math.round(priceVal * 100),
      customerPrice: Math.round(priceVal * 100),
      imageUrl: item.image || "/og-image.jpg",
      description: item.description || "",
      stock: isQuoteOnly ? 0 : 500,
      status: ProductStatus.PUBLISHED,
      moq: item.moq || 1,
      wholesaleTiers: tiers,
      seller: { brandName: "Ekora Official Supplier", accountStatus: "ACTIVE" }
    };

    return {
      rawProduct: fakePrismaProduct,
      id: String(item.id),
      name: item.name || "Untitled Product",
      image: item.image || "/og-image.jpg",
      category,
      department,
      tags: Array.isArray(item.tags) ? item.tags : [],
      price: priceVal,
      moq: item.moq || 1,
      tiers,
      description: item.description || "",
      supplierName: "Ekora Official Supplier",
      sellerId: "EKO-OFFICIAL-01",
      inStock: item.inStock !== false && !isQuoteOnly,
      isQuoteOnly,
      fragranceNotes: null as any,
      usageLevels: null as any
    };
  }

  return null;
}

// Generate SEO Metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const productData = await getProductData(id);

  if (!productData) {
    return { title: "Product Not Found | Ekora Bazaar" };
  }

  return generateProductMetadata(productData.rawProduct);
}

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params;
  const productData = await getProductData(id);

  if (!productData) {
    notFound();
  }

  const displayProduct = {
    id: productData.id,
    name: productData.name,
    image: productData.image,
    category: productData.category,
    department: productData.department,
    tags: productData.tags,
    price: productData.price,
    tiers: productData.tiers,
    description: productData.description,
    fragranceNotes: productData.fragranceNotes,
    usageLevels: productData.usageLevels,
    isQuoteOnly: productData.isQuoteOnly,
    inStock: productData.inStock
  };

  // Pre-populated JSON-LD Schema
  const jsonLd = generateProductSchema(productData.rawProduct, productData.supplierName);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.ekorabazaar.in" },
    { name: "Shop", url: "https://www.ekorabazaar.in/shop" },
    { name: displayProduct.name, url: `https://www.ekorabazaar.in/products/${productData.id}` }
  ]);

  const productFaqs = getCategoryFaqs(displayProduct.name, displayProduct.category);
  const faqSchema = generateFaqSchema(productFaqs);

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <TrackViewItem item={displayProduct} />
      
      {/* Inject JSON-LD Schema for SEO Engine */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(jsonLd, { isJSON: true }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(breadcrumbSchema, { isJSON: true }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(faqSchema, { isJSON: true }) }}
      />
      {/* Visually hidden SEO tags */}
      {displayProduct.tags && displayProduct.tags.length > 0 && (
        <div className="sr-only" aria-hidden="true">
          {displayProduct.tags.join(', ')}
        </div>
      )}

      {/* Optimized PDP Layout: Reduced top padding and streamlined layout */}
      <div className="pt-4 md:pt-6 pb-20 md:pb-16 px-4 md:px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 md:gap-12">
        {/* Product Image Gallery (Optimized viewport-fit) */}
        <div className="w-full md:w-1/2">
          {/* Edge-to-edge on mobile, rounded on desktop, sticky top-20 right under navbar */}
          <div className="aspect-square max-h-[75vh] md:max-h-[500px] w-full bg-white md:rounded-3xl md:border border-brand-linen flex items-center justify-center p-2 md:p-6 md:sticky md:top-20 shadow-none md:shadow-sm overflow-hidden relative">
            <ProductImageClient 
              src={displayProduct.image} 
              alt={displayProduct.name} 
              priority={true}
            />
          </div>
        </div>

        {/* Product Info & Pricing */}
        <div className="w-full md:w-1/2 px-1 md:px-0 pt-2 md:pt-0">
          {/* Visual Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center text-xs font-semibold text-brand-charcoal/50 mb-4 flex-wrap gap-1">
            <Link href="/" className="hover:text-brand-orange transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 mx-0.5" />
            <Link href="/shop" className="hover:text-brand-orange transition-colors">Shop</Link>
            {displayProduct.department && (
              <>
                <ChevronRight className="w-3 h-3 mx-0.5" />
                <Link href={`/shop?department=${encodeURIComponent(displayProduct.department)}`} className="hover:text-brand-orange transition-colors">{displayProduct.department}</Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 mx-0.5" />
            <Link href={`/shop?category=${encodeURIComponent(displayProduct.category)}`} className="hover:text-brand-orange transition-colors">{displayProduct.category}</Link>
          </nav>
          
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {displayProduct.department && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 bg-brand-bg px-2 py-0.5 rounded border border-brand-linen">
                {displayProduct.department}
              </span>
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{displayProduct.category}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal mb-1">
            {displayProduct.name} <span className="text-brand-orange text-2xl md:text-3xl font-sans font-semibold">Wholesale India</span>
          </h1>
          <p className="text-xs font-semibold text-brand-charcoal/60 mb-3 md:mb-4">
            Bulk {displayProduct.category} for Small Businesses | Lab-Tested &amp; COA Certified Supplier
          </p>
          
          <div className="hidden md:block">
            <p className="text-brand-charcoal/70 leading-relaxed mb-6">
              {displayProduct.description}
            </p>
          </div>

          {displayProduct.isQuoteOnly || !displayProduct.inStock ? (
            <div className="flex items-center gap-4 mb-8 text-sm">
              <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-lg font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Custom Wholesale Quote on Request
              </div>
              <div className="text-brand-charcoal/50 text-xs">
                Direct Sourcing Inquiry
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-8 text-sm">
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> In Stock
              </div>
              <div className="text-brand-charcoal/50">
                Ships in 24 hours
              </div>
            </div>
          )}

          {/* Add to Cart / Quote Widget */}
          <PricingWidget 
            productId={displayProduct.id} 
            productName={displayProduct.name}
            sellerId={productData.sellerId}
            basePrice={displayProduct.price}
            tiers={displayProduct.tiers} 
            moq={productData.moq} 
            category={displayProduct.category} 
            isQuoteOnly={displayProduct.isQuoteOnly}
            inStock={displayProduct.inStock}
          />

          {/* Trust factors — placed near purchase CTA above fold */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-xl border border-brand-linen shadow-sm flex flex-col items-center text-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 2v2a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3V2M9 14h6M9 18h6M14 2h.01"/><path d="M8.5 2h7l4.5 18a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2z"/></svg>
              </div>
              <h4 className="font-bold text-[11px] text-brand-charcoal leading-tight">Lab Tested</h4>
              <p className="text-[9px] text-brand-charcoal/50 leading-tight">COA &amp; MSDS</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-brand-linen shadow-sm flex flex-col items-center text-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h4 className="font-bold text-[11px] text-brand-charcoal leading-tight">Batch Matched</h4>
              <p className="text-[9px] text-brand-charcoal/50 leading-tight">100% Consistent</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-brand-linen shadow-sm flex flex-col items-center text-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
              </div>
              <h4 className="font-bold text-[11px] text-brand-charcoal leading-tight">Instant Docs</h4>
              <p className="text-[9px] text-brand-charcoal/50 leading-tight">COA PDF Included</p>
            </div>
          </div>

          <div className="mt-4 bg-white p-6 rounded-2xl border border-brand-linen shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-brand-charcoal">Supplier: {productData.supplierName}</h4>
              <p className="text-xs text-brand-charcoal/60">100% Secure B2B Transactions</p>
            </div>
            <ContactSupplierButton 
              productName={displayProduct.name} 
              productId={productData.id} 
              sellerId={productData.sellerId} 
            />
          </div>
          
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
        </div>
      </div>

      {/* Lab-Tested & COA Certified Technical Documentation */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 w-full pb-10">
        <TechnicalDocsSection
          productId={displayProduct.id}
          productName={displayProduct.name}
          category={displayProduct.category}
        />
      </div>

      {/* Pre-Purchase Technical Q&As (Contextual Long-Tail Creator Questions) */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 w-full pb-16">
        <ProductFaqSection
          productName={displayProduct.name}
          category={displayProduct.category}
          department={displayProduct.department}
          price={displayProduct.price}
        />
      </div>

      <BuyerFooter />
    </main>
  );
}

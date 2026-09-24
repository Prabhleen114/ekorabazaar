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
import ProductFaqSection from "@/components/ProductFaqSection";
import { getCategoryFaqs } from "@/lib/faqs";

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
  variants?: any[];
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

    if (product && product.status === ProductStatus.PUBLISHED && (product.sellerId === null || product.seller?.accountStatus === 'ACTIVE')) {
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
      variants: Array.isArray((item as any).variants) ? (item as any).variants : [],
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
    variants: productData.variants,
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

      {/* Optimized PDP Layout: Reduced top padding and streamlined editorial atelier layout */}
      <div className="pt-4 md:pt-6 pb-20 md:pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8 lg:gap-14">
        {/* Product Image Gallery (Architectural Framing) */}
        <div className="w-full md:w-1/2">
          <div className="aspect-square md:aspect-[4/5] w-full bg-stone-50/50 border border-stone-200/80 flex items-center justify-center p-4 md:p-8 md:sticky md:top-24 overflow-hidden relative">
            <ProductImageClient 
              src={displayProduct.image} 
              alt={displayProduct.name} 
              priority={true}
            />
          </div>
        </div>

        {/* Product Info & Formulation Panel */}
        <div className="w-full md:w-1/2 px-1 md:px-0 pt-2 md:pt-0">
          {/* Visual Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center text-[10px] uppercase tracking-[0.18em] text-stone-400 font-mono mb-4 flex-wrap gap-1.5">
            <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-stone-900 transition-colors">Shop</Link>
            {displayProduct.department && (
              <>
                <span>/</span>
                <Link href={`/shop?department=${encodeURIComponent(displayProduct.department)}`} className="hover:text-stone-900 transition-colors">{displayProduct.department}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-stone-700">{displayProduct.category}</span>
          </nav>
          
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-mono block mb-1">
              {displayProduct.category} &bull; Formulation Grade
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-900 tracking-tight font-normal leading-tight mb-2">
              {displayProduct.name}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500 font-mono mb-4">
              Direct Manufacturer Batch Tested &bull; COA Verified
            </p>
          </div>
          
          <div className="text-stone-600 font-light text-xs md:text-sm leading-relaxed mb-6 border-y border-stone-200/70 py-4">
            <p>{displayProduct.description}</p>
          </div>

          {displayProduct.isQuoteOnly || !displayProduct.inStock ? (
            <div className="flex items-center gap-3 mb-4 text-xs font-mono">
              <span className="border border-stone-300 px-2.5 py-1 text-stone-700 bg-stone-50">
                Custom Wholesale Quote on Request
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-4 text-[11px] font-mono text-stone-600">
              <span className="flex items-center gap-1.5 text-stone-800">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C734B]"></span> In Stock at Atelier
              </span>
              <span>&bull;</span>
              <span>Ships in 24 Hours</span>
            </div>
          )}

          {/* Add to Cart / Quote Widget */}
          <PricingWidget 
            productId={displayProduct.id} 
            productName={displayProduct.name}
            sellerId={productData.sellerId}
            basePrice={displayProduct.price}
            tiers={displayProduct.tiers}
            variants={displayProduct.variants}
            moq={productData.moq} 
            category={displayProduct.category} 
            isQuoteOnly={displayProduct.isQuoteOnly}
            inStock={displayProduct.inStock}
          />

          {/* Trust factors — Quiet hairline divider matrix */}
          <div className="mt-6 border border-stone-200 divide-x divide-stone-200 grid grid-cols-3 bg-white text-center py-3.5">
            <div className="px-2">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-stone-900">Lab Tested</h4>
              <p className="text-[9px] text-stone-400 font-mono">COA &amp; MSDS</p>
            </div>
            <div className="px-2">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-stone-900">Batch Matched</h4>
              <p className="text-[9px] text-stone-400 font-mono">100% Consistent</p>
            </div>
            <div className="px-2">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-stone-900">Instant Docs</h4>
              <p className="text-[9px] text-stone-400 font-mono">PDF Included</p>
            </div>
          </div>

          <div className="mt-4 border border-stone-200 p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-mono block">Supplier</span>
              <h4 className="font-serif text-sm text-stone-900">{productData.supplierName}</h4>
            </div>
            <ContactSupplierButton 
              productName={displayProduct.name} 
              productId={productData.id} 
              sellerId={productData.sellerId} 
            />
          </div>
          
          {/* Olfactory Notes Pyramid (Diptyque 3-Part Minimalist Grid) */}
          {displayProduct.fragranceNotes && (
            <div className="mt-8">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-mono block mb-2">
                Olfactory Composition
              </span>
              <div className="border border-stone-200 divide-x divide-stone-200 grid grid-cols-3 bg-white text-center py-4">
                <div className="px-3">
                  <h4 className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-1">Top Notes</h4>
                  <p className="font-serif text-xs md:text-sm text-stone-900 font-normal">
                    {Array.isArray(displayProduct.fragranceNotes.top) ? displayProduct.fragranceNotes.top.join(", ") : displayProduct.fragranceNotes.top}
                  </p>
                </div>
                <div className="px-3">
                  <h4 className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-1">Heart Notes</h4>
                  <p className="font-serif text-xs md:text-sm text-stone-900 font-normal">
                    {Array.isArray(displayProduct.fragranceNotes.heart) ? displayProduct.fragranceNotes.heart.join(", ") : displayProduct.fragranceNotes.heart}
                  </p>
                </div>
                <div className="px-3">
                  <h4 className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-1">Base Notes</h4>
                  <p className="font-serif text-xs md:text-sm text-stone-900 font-normal">
                    {Array.isArray(displayProduct.fragranceNotes.base) ? displayProduct.fragranceNotes.base.join(", ") : displayProduct.fragranceNotes.base}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Technical Dossier Collapsible Drawers */}
          <div className="mt-8 border-t border-stone-200 divide-y divide-stone-200">
            {displayProduct.usageLevels && (
              <details className="group py-4">
                <summary className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-900 cursor-pointer flex justify-between items-center select-none">
                  <span>+ Recommended Usage Limits (IFRA Standards)</span>
                  <span className="text-stone-400 group-open:rotate-45 transition-transform text-sm font-mono">+</span>
                </summary>
                <div className="pt-4">
                  <div className="border border-stone-200 overflow-hidden">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-stone-50 text-stone-500 uppercase text-[9px] tracking-wider border-b border-stone-200">
                        <tr>
                          <th className="px-4 py-2.5">Application</th>
                          <th className="px-4 py-2.5 text-right">Max Safe Usage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-white">
                        {Object.entries(displayProduct.usageLevels).map(([app, usage]) => (
                          <tr key={app} className="hover:bg-stone-50/50">
                            <td className="px-4 py-2.5 text-stone-800">{app}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-[#8C734B]">{usage as string}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            )}

            <details className="group py-4">
              <summary className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-900 cursor-pointer flex justify-between items-center select-none">
                <span>+ Batch Compliance &amp; Technical Data Sheet (TDS)</span>
                <span className="text-stone-400 group-open:rotate-45 transition-transform text-sm font-mono">+</span>
              </summary>
              <div className="pt-3 text-xs text-stone-600 font-light leading-relaxed space-y-2 font-mono">
                <p>&bull; Gas Chromatography &bull; Mass Spectrometry (GC-MS) batch matched.</p>
                <p>&bull; Phthalate-Free &bull; Cruelty-Free &bull; 100% Uncut Pure Formulation Grade.</p>
                <p>&bull; Certificate of Analysis (COA) generated per production lot.</p>
              </div>
            </details>

            <details className="group py-4">
              <summary className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-900 cursor-pointer flex justify-between items-center select-none">
                <span>+ Studio Storage &amp; Shelf Life</span>
                <span className="text-stone-400 group-open:rotate-45 transition-transform text-sm font-mono">+</span>
              </summary>
              <div className="pt-3 text-xs text-stone-600 font-light leading-relaxed font-mono">
                Store in original amber glass or food-grade HDPE container at 15&deg;C&ndash;25&deg;C away from direct UV exposure. Optimal shelf life is 24 months from batch distillation date.
              </div>
            </details>

            <details className="group py-4">
              <summary className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-900 cursor-pointer flex justify-between items-center select-none">
                <span>+ Returns &amp; Exchanges (B2B Policy)</span>
                <span className="text-stone-400 group-open:rotate-45 transition-transform text-sm font-mono">+</span>
              </summary>
              <div className="pt-3 text-xs text-stone-600 font-light leading-relaxed font-mono">
                Returns/exchanges are not available for standard wholesale and raw-material orders. Please verify product specifications, quantity, and requirements before placing the order.
              </div>
            </details>
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

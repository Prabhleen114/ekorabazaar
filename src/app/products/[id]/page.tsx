import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { notFound, permanentRedirect } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import PricingWidget from "@/components/PricingWidget";
import { Metadata } from "next";
import ProductGallery from "@/components/ProductGallery";
import Link from "next/link";
import serialize from "serialize-javascript";
import { MessageCircle, FileText, ChevronDown } from "lucide-react";
import { TrackViewItem } from "@/components/GA4Tracker";
import { generateProductMetadata, generateProductSchema, generateBreadcrumbSchema, generateFaqSchema } from "@/lib/seo";
import { getCategoryFaqs } from "@/lib/faqs";
import { getDepartmentForCategory } from "@/lib/taxonomy";
import ProductKeySpecs from "@/components/ProductKeySpecs";
import ProductFaqSection from "@/components/ProductFaqSection";
import catalogProducts from "@/lib/data/products.json";
import { getPostsByCategory } from "@/lib/blog";
import { isDeprecatedProductId, getCanonicalProductId } from "@/lib/product-redirects";

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
  colors?: any[];
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
      const catalogItem = (catalogProducts as any[]).find(p => String(p.id) === String(id));
      const imageUrl = (catalogItem?.image && catalogItem.image.startsWith('/images/products/'))
        ? catalogItem.image
        : (product.imageUrl || "/og-image.jpg");
      const category = product.category || catalogItem?.category || "General Silicone Moulds";
      const department = getDepartmentForCategory(category) || catalogItem?.department || "Precision Studio Moulds";

      const tiers = Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0
        ? (product.wholesaleTiers as any[]).map(t => ({
            ...t,
            price: t.price ? Math.round(t.price / 100) : effectivePrice,
            minQty: t.minQty || product.moq
          }))
        : (Array.isArray(catalogItem?.tiers) && catalogItem.tiers.length > 0
            ? catalogItem.tiers
            : [{ price: effectivePrice, minQty: product.moq || 1, maxQty: null, discountPct: 0 }]);

      const variants = Array.isArray(catalogItem?.variants) && catalogItem.variants.length > 0
        ? catalogItem.variants
        : (Array.isArray((product.wholesaleTiers as any)?.variants) ? (product.wholesaleTiers as any).variants : []);

      const colors = Array.isArray(catalogItem?.colors) && catalogItem.colors.length > 0
        ? catalogItem.colors
        : [];

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
        variants,
        colors,
        description: product.description || catalogItem?.description || "",
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

  // 2. Fallback to active catalog
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
      colors: Array.isArray((item as any).colors) ? (item as any).colors : [],
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
  const canonicalId = getCanonicalProductId(id);
  const productData = await getProductData(canonicalId);

  if (!productData) {
    return { title: "Product Not Found | Ekora Bazaar" };
  }

  return generateProductMetadata(productData.rawProduct);
}

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params;
  if (isDeprecatedProductId(id)) {
    permanentRedirect(`/products/${getCanonicalProductId(id)}`);
  }
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
    colors: productData.colors,
    description: productData.description,
    fragranceNotes: productData.fragranceNotes,
    usageLevels: productData.usageLevels,
    isQuoteOnly: productData.isQuoteOnly,
    inStock: productData.inStock
  };

  // Pre-populated JSON-LD Schema
  const jsonLd = generateProductSchema(productData.rawProduct, productData.supplierName);

  const categorySlug = displayProduct.category ? displayProduct.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;
  const breadcrumbItems = [
    { name: "Home", url: "https://www.ekorabazaar.in" },
    { name: "Shop", url: "https://www.ekorabazaar.in/shop" },
  ];
  if (displayProduct.category && categorySlug) {
    breadcrumbItems.push({
      name: displayProduct.category,
      url: `https://www.ekorabazaar.in/wholesale/${categorySlug}`
    });
  }
  breadcrumbItems.push({
    name: displayProduct.name,
    url: `https://www.ekorabazaar.in/products/${productData.id}`
  });
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  const productFaqs = getCategoryFaqs(displayProduct.name, displayProduct.category);
  const faqSchema = generateFaqSchema(productFaqs);

  const relatedGuides = getPostsByCategory(displayProduct.category).slice(0, 3);

  const bulkWhatsappUrl = `https://wa.me/919041500605?text=${encodeURIComponent(
    `Hi Ekora! I need 100+ units of ${displayProduct.name} (ID: ${displayProduct.id}) for studio production. Please share volume tier quote and dispatch lead time.`
  )}`;

  const isFragranceOrOil =
    displayProduct.category.toLowerCase().includes("fragrance") ||
    displayProduct.category.toLowerCase().includes("essential") ||
    displayProduct.category.toLowerCase().includes("oil");

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <TrackViewItem item={displayProduct} />

      {/* Inject JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize([jsonLd, breadcrumbSchema, faqSchema], { isJSON: true }) }}
      />

      {/* Visually hidden SEO tags */}
      {displayProduct.tags && displayProduct.tags.length > 0 && (
        <div className="sr-only" aria-hidden="true">
          {displayProduct.tags.join(', ')}
        </div>
      )}

      {/* Main PDP Layout:
          Mobile: Single-column conversion flow where the entire buy box sits directly beneath the gallery & title.
          Laptop (md:): Two-column atelier layout preserved with sticky gallery on left and formulation details on right.
      */}
      <div className="pt-3 sm:pt-4 md:pt-6 pb-20 md:pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-14">

        {/* LEFT COLUMN: Product Image Gallery (Swipeable 4:5 on mobile, Sticky architectural framing on laptop) */}
        <div className="w-full md:w-1/2">
          <ProductGallery
            mainImage={displayProduct.image}
            productName={displayProduct.name}
            category={displayProduct.category}
          />
        </div>

        {/* RIGHT COLUMN: Conversion Buy Flow, Key Specs & Technical Accordions */}
        <div className="w-full md:w-1/2 px-0 md:px-0 flex flex-col">

          {/* Breadcrumbs (Subtle on desktop, minimal on mobile) */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center text-[10px] uppercase tracking-[0.18em] text-stone-400 font-sans mb-3 flex-wrap gap-1.5">
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
            {categorySlug ? (
              <Link href={`/wholesale/${categorySlug}`} className="text-stone-700 hover:text-stone-900 transition-colors">
                {displayProduct.category}
              </Link>
            ) : (
              <span className="text-stone-700">{displayProduct.category}</span>
            )}
          </nav>

          {/* 3. Title Block: Name & One-line craft application subtext */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-sans font-semibold">
                {displayProduct.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-xs">
                ★ Formulation Tested
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 tracking-tight font-normal leading-tight mb-1.5">
              {displayProduct.name}
            </h1>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              For candles, artisan soaps, reed diffusers &amp; studio craft formulations
            </p>
          </div>

          {/* 4, 5, 6, 7 & 8: THE BUY BOX (Size chips with price, stepper, live discount, pincode check & CTAs) */}
          <PricingWidget
            productId={displayProduct.id}
            productName={displayProduct.name}
            sellerId={productData.sellerId}
            basePrice={displayProduct.price}
            tiers={displayProduct.tiers}
            variants={displayProduct.variants}
            colors={displayProduct.colors}
            moq={productData.moq}
            category={displayProduct.category}
            isQuoteOnly={displayProduct.isQuoteOnly}
            inStock={displayProduct.inStock}
          />

          {/* 9. Key Specs Table (Replaces long poetic description; 5 structured rows) */}
          <div className="mt-6">
            <ProductKeySpecs product={displayProduct} />
          </div>

          {/* 10. Technical Accordions (Description, Documents, FAQs, and Returns) */}
          <div className="mt-6 border-t border-stone-200 divide-y divide-stone-200">
            {/* Description Accordion */}
            <details className="group py-4">
              <summary className="font-sans text-xs uppercase tracking-[0.18em] text-stone-900 font-semibold cursor-pointer flex justify-between items-center select-none">
                <span>Product Description &amp; Formulation Overview</span>
                <ChevronDown className="w-4 h-4 text-stone-500 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="pt-3 text-xs text-stone-600 font-light leading-relaxed space-y-2.5 font-sans">
                {displayProduct.description.split('\n').filter(Boolean).map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </details>

            {/* Technical Documents Accordion (Labeled 'View COA (PDF)' rather than raw filenames) */}
            <details className="group py-4">
              <summary className="font-sans text-xs uppercase tracking-[0.18em] text-stone-900 font-semibold cursor-pointer flex justify-between items-center select-none">
                <span>Batch Documents (COA, TDS, MSDS, IFRA)</span>
                <ChevronDown className="w-4 h-4 text-stone-500 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="pt-3 space-y-2">
                <p className="text-xs text-stone-500 font-sans mb-3">
                  Download certified manufacturer lab dossiers for batch verification and compliance:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                  <a
                    href={`/api/docs/${displayProduct.id}/coa`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-stone-200 bg-stone-50/70 hover:bg-stone-100 flex items-center justify-between text-stone-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-700" />
                      <strong>View COA (PDF)</strong>
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">Batch Assay &rarr;</span>
                  </a>

                  <a
                    href={`/api/docs/${displayProduct.id}/tds`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-stone-200 bg-stone-50/70 hover:bg-stone-100 flex items-center justify-between text-stone-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-700" />
                      <strong>View TDS (PDF)</strong>
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">Technical Data &rarr;</span>
                  </a>

                  <a
                    href={`/api/docs/${displayProduct.id}/msds`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-stone-200 bg-stone-50/70 hover:bg-stone-100 flex items-center justify-between text-stone-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-stone-700" />
                      <strong>View MSDS (PDF)</strong>
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">Safety Sheet &rarr;</span>
                  </a>

                  {isFragranceOrOil && (
                    <a
                      href={`/api/docs/${displayProduct.id}/ifra`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 border border-stone-200 bg-stone-50/70 hover:bg-stone-100 flex items-center justify-between text-stone-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        <strong>View IFRA Certificate (PDF)</strong>
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">Compliance &rarr;</span>
                    </a>
                  )}
                </div>
              </div>
            </details>

            {/* Returns & Replacement Policy Accordion (Explicit: Damage replacement only with uncut video) */}
            <details id="returns-policy" className="group py-4">
              <summary className="font-sans text-xs uppercase tracking-[0.18em] text-stone-900 font-semibold cursor-pointer flex justify-between items-center select-none">
                <span>Returns, Cancellations &amp; Damage Guarantee</span>
                <ChevronDown className="w-4 h-4 text-stone-500 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="pt-3 text-xs text-stone-700 font-sans leading-relaxed space-y-2.5">
                <p>
                  To maintain strict chemical purity, lot integrity, and safety standards, <strong>we do not accept standard returns, exchanges, or order cancellations</strong> on wholesale raw materials, cosmetic bases, or formulation supplies.
                </p>
                <div className="bg-amber-50/80 border border-amber-200/90 p-3 text-amber-950 space-y-1">
                  <strong className="block text-amber-900">Transit Damage &amp; Leakage Claims:</strong>
                  <p className="text-[11px] leading-relaxed">
                    If your shipment arrives damaged, broken, or leaking, a <strong>full continuous unboxing video with no cuts</strong> is strictly mandatory. The video must clearly show the unopened courier box, shipping label, and the condition of the inner seal upon opening.
                  </p>
                  <p className="text-[11px] text-amber-800 pt-0.5">
                    Report damage within 24 hours of delivery via WhatsApp (+91 9041500605) or email (ekorabazaar@gmail.com) for prompt replacement dispatch.
                  </p>
                </div>
                <p className="text-[11px] text-stone-500">
                  Payment: 100% Pre-paid wholesale dispatch via Razorpay (UPI, NetBanking, Debit/Credit Cards). Cash on Delivery (COD) is not offered.
                </p>
              </div>
            </details>
          </div>

          {/* 11. ONE SINGLE BULK CARD (Replaces duplicate quote buttons and supplier banner) */}
          <div className="mt-8 p-5 bg-[#FAF8F5] border border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-sans font-bold block mb-1">
                Volume Manufacturing
              </span>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Need 100+ units? Get a quote on WhatsApp
              </h3>
              <p className="text-xs text-stone-600 font-sans mt-0.5">
                Direct factory sourcing, custom batch fills, and commercial tier pricing.
              </p>
            </div>
            <a
              href={bulkWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto shrink-0 bg-stone-900 hover:bg-black text-white px-5 py-3 text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Get WhatsApp Quote</span>
            </a>
          </div>

        </div>
      </div>

      {/* Pre-Purchase Technical Q&As */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 w-full pb-14">
        <ProductFaqSection
          productName={displayProduct.name}
          category={displayProduct.category}
          department={displayProduct.department}
          price={displayProduct.price}
        />
      </div>

      {/* 12. Related Guides & Maker Tutorials */}
      {relatedGuides.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 w-full pb-16">
          <div className="bg-white p-6 md:p-10 rounded-2xl border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-brand-charcoal">
                  Related Guides &amp; Maker Tutorials
                </h2>
                <p className="text-xs md:text-sm text-brand-charcoal/60 mt-1">
                  Learn formulation guidelines, testing techniques, and usage tips for {displayProduct.category}.
                </p>
              </div>
              <Link href="/blog" className="text-brand-orange text-xs md:text-sm font-semibold hover:underline">
                View All Guides &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/blog/${guide.slug}`}
                  className="group block p-4 md:p-5 rounded-xl bg-stone-50 border border-stone-200 hover:border-brand-orange/40 hover:bg-white transition-all shadow-2xs"
                >
                  <p className="text-[10px] font-sans text-brand-orange uppercase tracking-wider mb-1.5">
                    {guide.frontmatter.tags[0] || displayProduct.category}
                  </p>
                  <h3 className="font-bold text-sm md:text-base text-brand-charcoal group-hover:text-brand-orange transition-colors line-clamp-2 mb-1.5">
                    {guide.frontmatter.title}
                  </h3>
                  <p className="text-xs text-brand-charcoal/65 line-clamp-2 leading-relaxed">
                    {guide.frontmatter.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <BuyerFooter />
    </main>
  );
}

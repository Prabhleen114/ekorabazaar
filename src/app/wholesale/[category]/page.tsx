import { ALL_CATEGORIES } from "@/lib/categories";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { Metadata } from "next";
import serialize from "serialize-javascript";

type Props = {
  params: Promise<{ category: string }>;
};

// Convert slug back to Category Name for matching
function slugToCategoryLabel(slug: string) {
  return ALL_CATEGORIES.find(c => c.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) || 
         ALL_CATEGORIES.find(c => c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const categoryObj = slugToCategoryLabel(slug);
  
  if (!categoryObj) {
    return { title: "Wholesale Category Not Found" };
  }

  const title = `Wholesale ${categoryObj.label} Suppliers in India | Ekora Bazaar B2B`;
  const description = `Buy ${categoryObj.label} in bulk at wholesale prices from verified manufacturers and suppliers in India. Secure B2B transactions on Ekora Bazaar.`;
  const url = `https://www.ekorabazaar.in/wholesale/${slug}`;

  return {
    title,
    description,
    keywords: [`wholesale ${categoryObj.label}`, `${categoryObj.label} supplier India`, `${categoryObj.label} manufacturer`, `buy ${categoryObj.label} in bulk`],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    }
  };
}

export async function generateStaticParams() {
  return ALL_CATEGORIES.map((cat) => ({
    category: cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));
}

export default async function WholesaleCategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const categoryObj = slugToCategoryLabel(slug);

  if (!categoryObj) {
    notFound();
  }

  // Fetch top products in this category
  const products = await prisma.product.findMany({
    where: {
      category: categoryObj.id,
      status: ProductStatus.PUBLISHED,
      seller: { accountStatus: 'ACTIVE' }
    },
    include: { seller: true },
    take: 12,
    orderBy: { createdAt: 'desc' }
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Wholesale ${categoryObj.label}`,
    "description": `B2B Marketplace for wholesale ${categoryObj.label} in India.`,
    "url": `https://www.ekorabazaar.in/wholesale/${slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.map((p, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Product",
          "url": `https://www.ekorabazaar.in/products/${p.id}`,
          "name": p.title,
          "image": p.imageUrl || "https://www.ekorabazaar.in/og-image.jpg"
        }
      }))
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(structuredData, { isJSON: true }) }} />

      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto w-full flex-1">
        
        {/* Header Section */}
        <div className="mb-12 bg-white p-8 md:p-12 rounded-3xl border border-brand-linen shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-charcoal mb-4">
              Wholesale {categoryObj.label} in India
            </h1>
            <p className="text-brand-charcoal/70 text-lg max-w-2xl">
              Source premium <strong>{categoryObj.label}</strong> directly from verified Indian manufacturers and suppliers. 
              Buy in bulk with minimum order quantities designed for businesses, creators, and brands. 
              100% secure B2B transactions on Ekora Bazaar.
            </p>
            <div className="mt-6 flex gap-4 justify-center md:justify-start">
              <Link href="/shop" className="bg-brand-orange text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-brand-terracotta transition-colors">
                Browse All Categories
              </Link>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brand-charcoal">Top {categoryObj.label} Suppliers</h2>
          <Link href={`/shop?category=${encodeURIComponent(categoryObj.label)}`} className="text-brand-orange font-semibold hover:underline">
            View All
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-brand-linen">
            <h3 className="text-xl font-semibold text-brand-charcoal/50 mb-2">No products found yet</h3>
            <p className="text-brand-charcoal/40">We are currently onboarding suppliers for this category.</p>
          </div>
        )}

        {/* SEO FAQ Section */}
        <div className="mt-16 bg-white p-8 rounded-3xl border border-brand-linen">
          <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-brand-charcoal text-lg mb-2">How do I buy {categoryObj.label} in bulk?</h3>
              <p className="text-brand-charcoal/70">You can purchase {categoryObj.label} in bulk directly on Ekora Bazaar. Simply browse our verified suppliers above, check their minimum order quantities (MOQ) and wholesale pricing tiers, and place your order securely through our platform.</p>
            </div>
            <div>
              <h3 className="font-bold text-brand-charcoal text-lg mb-2">Are the suppliers verified?</h3>
              <p className="text-brand-charcoal/70">Yes, every B2B supplier and manufacturer on Ekora Bazaar undergoes a strict verification process to ensure product quality and reliable shipping across India.</p>
            </div>
            <div>
              <h3 className="font-bold text-brand-charcoal text-lg mb-2">Can I contact the manufacturer directly?</h3>
              <p className="text-brand-charcoal/70">Yes! Once you click on a product, you will see an option to send an enquiry or contact the supplier to discuss custom requirements before placing your wholesale order.</p>
            </div>
          </div>
        </div>

      </div>

      <BuyerFooter />
    </main>
  );
}

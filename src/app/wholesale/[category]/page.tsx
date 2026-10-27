import { notFound } from "next/navigation";
import { ALL_CATEGORIES } from "@/lib/categories";
import { ProductStatus } from "@prisma/client";
import prisma from "@/lib/db";
import serialize from "serialize-javascript";
import { generateCategoryMetadata, generateFaqSchema } from "@/lib/seo";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductCard from "@/components/ProductCard";
import CategoryIntro from "@/components/CategoryIntro";
import NoResults from "@/components/NoResults";
import catalogProducts from "@/lib/data/products.json";
import Link from "next/link";
import { Metadata } from "next";
import { getPostsByCategory } from "@/lib/blog";

export const revalidate = 3600;

type Props = {
  params: Promise<{ category: string }>;
  
};

type ProductType = {
  id: string;
  title: string;
  category: string | null;
  price: number;
  imageUrl?: string | null;
  wholesaleTiers?: any;
};

function normalizeCategoryName(cat: string | null | undefined): string {
  if (!cat) return "";
  return cat.trim().toLowerCase();
}

function slugToCategoryLabel(slug: string) {
  const norm = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return ALL_CATEGORIES.find(c => c.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') === norm) || 
         ALL_CATEGORIES.find(c => c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === norm);
}

async function getWholesaleProducts(categoryObj: any, searchParamsObj?: any): Promise<ProductType[]> {
  const canonicalCategory = normalizeCategoryName(categoryObj.id);
  
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: {
        category: canonicalCategory,
        status: ProductStatus.PUBLISHED,
        OR: [
          { sellerId: null },
          { seller: { accountStatus: 'ACTIVE' } }
        ],
        ...(searchParamsObj?.q ? { title: { contains: String(searchParamsObj.q), mode: 'insensitive' as any } } : {})
      },
      include: { seller: true },
      take: 12,
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.warn(`Could not load products for wholesale category ${categoryObj.label} at build time:`, err);
  }

  // Fallback to static catalog if DB returned 0 products and there are no search queries applied
  if (products.length === 0 && !searchParamsObj?.q) {
    const matching = (catalogProducts as any[]).filter(p => {
      const pCat = normalizeCategoryName(p.category);
      return pCat === canonicalCategory || p.category === categoryObj.id || p.category === categoryObj.label;
    }).slice(0, 12);

    return matching.map(p => ({
      id: String(p.id),
      title: p.name || p.title,
      category: p.category,
      price: Math.round((typeof p.price === 'number' ? p.price : parseFloat(p.price || '0')) * 100),
      imageUrl: p.image || p.imageUrl || '/og-image.jpg',
      wholesaleTiers: p.tiers || [],
      variants: p.variants || []
    }));
  }

  return products.map(p => ({
    id: String(p.id),
    title: p.title,
    category: p.category,
    price: p.price,
    imageUrl: p.imageUrl,
    wholesaleTiers: p.wholesaleTiers || []
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const categoryObj = slugToCategoryLabel(slug);
  
  if (!categoryObj) return { title: "Wholesale Category Not Found" };

  const products = await getWholesaleProducts(categoryObj);

  if (products.length === 0) {
    return {
      title: "No Results Found | Ekora Wholesale",
      robots: { index: false, follow: true },
      alternates: { canonical: `https://www.ekorabazaar.in/wholesale/${slug}` }
    };
  }

  const baseMeta = generateCategoryMetadata(categoryObj.label, slug);
  return {
    ...baseMeta,
    alternates: { canonical: `https://www.ekorabazaar.in/wholesale/${slug}` }
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

  const products = await getWholesaleProducts(categoryObj);
  const relatedArticles = getPostsByCategory(categoryObj.label).slice(0, 3);

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

  const faqSchema = generateFaqSchema([
    {
      question: `How do I buy ${categoryObj.label} in bulk?`,
      answer: `You can purchase ${categoryObj.label} in bulk directly on Ekora Bazaar. Simply browse our verified suppliers above, check their minimum order quantities (MOQ) and wholesale pricing tiers, and place your order securely through our platform.`
    },
    {
      question: "Are the suppliers verified?",
      answer: "Yes, every B2B supplier and manufacturer on Ekora Bazaar undergoes a strict verification process to ensure product quality and reliable shipping across India."
    },
    {
      question: "Can I contact the manufacturer directly?",
      answer: "Yes! Once you click on a product, you will see an option to send an enquiry or contact the supplier to discuss custom requirements before placing your wholesale order."
    }
  ]);

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize([structuredData, faqSchema], { isJSON: true }) }} />

      <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto w-full flex-1">
        
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
              <Link href="/shop" className="bg-brand-orange text-white px-4 md:px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-brand-terracotta transition-colors">
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
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} priority={index < 4} />
              ))}
          </div>
        ) : (
          <NoResults />
        )}
        <CategoryIntro categoryLabel={categoryObj.label} />

        {/* Related Guides & Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 bg-white p-8 md:p-10 rounded-3xl border border-brand-linen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-brand-charcoal">
                  Related Guides &amp; Maker Resources
                </h2>
                <p className="text-sm text-brand-charcoal/60 mt-1">
                  Tutorials, formulation tips, and sourcing advice for {categoryObj.label}.
                </p>
              </div>
              <Link href="/blog" className="text-brand-orange text-sm font-semibold hover:underline">
                View All Guides →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block p-5 rounded-2xl bg-stone-50 border border-brand-linen hover:border-brand-orange/40 hover:bg-white transition-all shadow-xs"
                >
                  <p className="text-xs font-mono text-brand-orange uppercase tracking-wider mb-2">
                    {post.frontmatter.tags[0] || categoryObj.label}
                  </p>
                  <h3 className="font-bold text-base text-brand-charcoal group-hover:text-brand-orange transition-colors line-clamp-2 mb-2">
                    {post.frontmatter.title}
                  </h3>
                  <p className="text-xs text-brand-charcoal/65 line-clamp-2 leading-relaxed">
                    {post.frontmatter.description}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-brand-linen flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <span className="text-brand-charcoal/70">Need detailed specification guidelines?</span>
              <Link
                href={`/guides/${slug}`}
                className="text-brand-orange font-semibold hover:underline"
              >
                Read B2B Sourcing Guide for {categoryObj.label} →
              </Link>
            </div>
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

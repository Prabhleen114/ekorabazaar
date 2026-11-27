import { notFound } from "next/navigation";
import { ProductStatus } from "@prisma/client";
import prisma from "@/lib/db";
import serialize from "serialize-javascript";
import { generateCategoryMetadata, generateFaqSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { getWholesaleCategoryFaqs } from "@/lib/faqs";
import {
  getAllWholesaleDefinitions,
  resolveWholesaleCategoryBySlug,
  FRAGRANCE_RELATED_CROSS_LINKS,
  WholesaleCategoryDefinition,
} from "@/lib/fragrance-collections";
import { normalizeProductBasePriceToINR } from "@/lib/pricing";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductCard from "@/components/ProductCard";
import CategoryIntro from "@/components/CategoryIntro";
import NoResults from "@/components/NoResults";
import catalogProducts from "@/lib/data/products.json";
import Link from "next/link";
import { Metadata } from "next";
import { getPostsByCategory } from "@/lib/blog";

export const dynamicParams = false;

type Props = {
  params: Promise<{ category: string }>;
};

type ProductType = {
  id: string;
  title: string;
  category: string | null;
  price: number;
  customerPrice?: number | null;
  mrp?: number | null;
  source?: string | null;
  imageUrl?: string | null;
  wholesaleTiers?: any;
  variants?: any[];
  isQuoteOnly?: boolean;
};

function normalizeCategoryName(cat: string | null | undefined): string {
  if (!cat) return "";
  return cat.trim().toLowerCase();
}

function slugToCategoryLabel(slug: string): WholesaleCategoryDefinition | undefined {
  return resolveWholesaleCategoryBySlug(slug);
}

async function getWholesaleProducts(categoryObj: WholesaleCategoryDefinition, searchParamsObj?: any): Promise<ProductType[]> {
  const canonicalCategory = normalizeCategoryName(categoryObj.id);
  const categoryList = categoryObj.includeCategories && categoryObj.includeCategories.length > 0
    ? categoryObj.includeCategories
    : [categoryObj.id];
  const categorySetLower = new Set(categoryList.map((c) => c.toLowerCase()));
  const patterns = (categoryObj.titleMatchPatterns || []).map((p) => p.toLowerCase());

  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: {
        OR: categoryList.map((c) => ({ category: { equals: c, mode: "insensitive" as const } })),
        status: ProductStatus.PUBLISHED,
        isActive: true,
        AND: [
          {
            OR: [
              { sellerId: null },
              { seller: { accountStatus: "ACTIVE" } },
            ],
          },
          ...(searchParamsObj?.q
            ? [{ title: { contains: String(searchParamsObj.q), mode: "insensitive" as const } }]
            : []),
        ],
      },
      include: { seller: true },
      take: patterns.length > 0 ? 120 : 40,
      orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    });
  } catch (err) {
    console.warn(`Could not load products for wholesale category ${categoryObj.label} at build time:`, err);
  }

  if (patterns.length > 0 && products.length > 0) {
    const scored = products
      .map((p) => {
        const hay = `${p.title || ""} ${p.category || ""}`.toLowerCase();
        const matchScore = patterns.reduce((acc, pat) => (hay.includes(pat) ? acc + 1 : acc), 0);
        const primaryBoost = p.category && categoryList[0] && p.category.toLowerCase() === categoryList[0].toLowerCase() ? 2 : 0;
        const stockBoost = p.stock > 0 && (p.customerPrice ?? p.price) > 0 ? 5 : 0;
        return { p, score: matchScore + primaryBoost + stockBoost };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);
    products = scored.slice(0, 24);
  } else {
    products = products
      .sort((a, b) => ((b.stock > 0 && (b.customerPrice ?? b.price) > 0 ? 1 : 0) - (a.stock > 0 && (a.customerPrice ?? a.price) > 0 ? 1 : 0)))
      .slice(0, 24);
  }

  // Fallback to static catalog if DB returned 0 products and there are no search queries applied
  if (products.length === 0 && !searchParamsObj?.q) {
    const matching = (catalogProducts as any[])
      .filter((p) => {
        const pCat = normalizeCategoryName(p.category);
        if (!categorySetLower.has(pCat) && pCat !== canonicalCategory && p.category !== categoryObj.label) {
          return false;
        }
        if (patterns.length > 0) {
          const hay = `${p.name || p.title || ""} ${p.category || ""}`.toLowerCase();
          return patterns.some((pat) => hay.includes(pat));
        }
        return true;
      })
      .slice(0, 24);

    return matching.map((p) => {
      const rawPrice = typeof p.price === "number" ? p.price : parseFloat(p.price || "0");
      const isQuoteOnly = p.isQuoteOnly === true || isNaN(rawPrice) || rawPrice <= 0 || p.inStock === false;
      const validTiers = (Array.isArray(p.tiers) ? p.tiers : [])
        .filter((t: any) => t && Number(t.price) > 0)
        .map((t: any) => ({
          ...t,
          price: Math.round(Number(t.price) * 100), // normalize to paise to match ProductCard expectations
        }));

      return {
        id: String(p.id),
        title: p.name || p.title,
        category: p.category,
        price: isQuoteOnly ? 0 : Math.round(rawPrice * 100),
        source: "CATALOG",
        imageUrl: p.image || p.imageUrl || "/og-image.jpg",
        wholesaleTiers: validTiers,
        variants: p.variants || [],
        isQuoteOnly,
      };
    });
  }

  return products.map((p) => {
    const effectivePrice = p.customerPrice ?? p.price;
    const isQuoteOnly = p.stock <= 0 || effectivePrice <= 0;
    const rawTiers = Array.isArray(p.wholesaleTiers) ? (p.wholesaleTiers as any[]) : [];
    const validTiers = rawTiers.filter((t) => t && Number(t.price) > 0);

    return {
      id: String(p.id),
      title: p.title,
      category: p.category,
      price: p.price,
      customerPrice: p.customerPrice,
      mrp: (p as any).mrp ?? null,
      source: p.source,
      imageUrl: p.imageUrl,
      wholesaleTiers: validTiers,
      isQuoteOnly,
    };
  });
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
      alternates: { canonical: `https://ekorabazaar.in/wholesale/${slug}` },
    };
  }

  const baseMeta = generateCategoryMetadata(
    categoryObj.label,
    slug,
    categoryObj.seoTitle,
    categoryObj.seoDescription
  );
  return {
    ...baseMeta,
    alternates: { canonical: `https://ekorabazaar.in/wholesale/${slug}` },
  };
}

export async function generateStaticParams() {
  return getAllWholesaleDefinitions().map((cat) => ({
    category: cat.slug,
  }));
}

export default async function WholesaleCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const categoryObj = slugToCategoryLabel(slug);

  if (!categoryObj) {
    notFound();
  }

  const products = await getWholesaleProducts(categoryObj);
  const relatedArticles = getPostsByCategory(
    categoryObj.includeCategories?.[0] || categoryObj.label
  ).slice(0, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": categoryObj.h1 || `Wholesale ${categoryObj.label}`,
    "description": categoryObj.seoDescription || `B2B Marketplace for wholesale ${categoryObj.label} in India.`,
    "url": `https://ekorabazaar.in/wholesale/${slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": products.length,
      "itemListElement": products.map((p, idx) => {
        const img = p.imageUrl || "https://ekorabazaar.in/og-image.jpg";
        const absImg = img.startsWith("http") ? img : `https://ekorabazaar.in${img}`;
        const priceInr = p.isQuoteOnly ? 0 : normalizeProductBasePriceToINR(p);
        return {
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "Product",
            "url": `https://ekorabazaar.in/products/${p.id}`,
            "name": p.title,
            "image": absImg,
            ...(priceInr > 0
              ? {
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": priceInr,
                    "availability": "https://schema.org/InStock",
                  },
                }
              : {}),
          },
        };
      }),
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://ekorabazaar.in" },
    { name: "Shop", url: "https://ekorabazaar.in/shop" },
    { name: categoryObj.label, url: `https://ekorabazaar.in/wholesale/${slug}` },
  ]);

  const categoryFaqs = getWholesaleCategoryFaqs(categoryObj.label);
  const faqSchema = generateFaqSchema(categoryFaqs);
  const shopFilterUrl = categoryObj.includeCategories?.[0]
    ? `/shop?category=${encodeURIComponent(categoryObj.includeCategories[0])}`
    : `/shop?category=${encodeURIComponent(categoryObj.label)}`;

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize([structuredData, breadcrumbSchema, faqSchema], { isJSON: true }) }} />

      <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto w-full flex-1">

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs sm:text-sm text-brand-charcoal/60">
          <ol className="flex items-center gap-2 flex-wrap">
            <li><Link href="/" className="hover:text-brand-orange transition-colors">Home</Link></li>
            <li aria-hidden="true">&rsaquo;</li>
            <li><Link href="/shop" className="hover:text-brand-orange transition-colors">Shop</Link></li>
            <li aria-hidden="true">&rsaquo;</li>
            <li className="text-brand-charcoal font-medium">{categoryObj.label}</li>
          </ol>
        </nav>

        {/* Header Section */}
        <div className="mb-8 bg-white p-8 md:p-12 rounded-3xl border border-brand-linen shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-charcoal mb-4">
              {categoryObj.h1 || `Wholesale ${categoryObj.label} in India`}
            </h1>
            <p className="text-brand-charcoal/70 text-lg max-w-2xl">
              {categoryObj.heroIntro || (
                <>
                  Source premium <strong>{categoryObj.label}</strong> directly from verified Indian manufacturers and suppliers.
                  Buy in trial quantities or wholesale packs designed for businesses, creators, and brands on Ekora Bazaar.
                </>
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
              <Link href={shopFilterUrl} className="bg-brand-orange text-white px-4 md:px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-brand-terracotta transition-colors">
                Browse Full {categoryObj.label} Catalog
              </Link>
              <Link href="/shop" className="bg-stone-100 text-brand-charcoal px-4 md:px-6 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors">
                All Departments
              </Link>
            </div>
          </div>
        </div>

        {/* Fragrance Priority Cross-Links */}
        {categoryObj.isFragranceRelated && (
          <div className="mb-8 bg-white p-4 rounded-2xl border border-brand-linen">
            <p className="text-[11px] font-mono uppercase tracking-wider text-brand-charcoal/60 mb-2.5">
              Explore Fragrance &amp; Oil Collections
            </p>
            <div className="flex flex-wrap gap-2">
              {FRAGRANCE_RELATED_CROSS_LINKS.map((item) => {
                const isCurrent = item.href.endsWith(`/${slug}`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isCurrent
                        ? "bg-brand-charcoal text-white border-brand-charcoal"
                        : "bg-stone-50 text-brand-charcoal border-stone-200 hover:border-brand-orange hover:text-brand-orange"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Direct Answer: Category Sourcing Quick Facts */}
        <div className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-5 rounded-2xl border border-brand-linen">
          <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/50">
            <span className="text-[10px] font-mono uppercase text-brand-charcoal/50 block mb-0.5">Minimum Order</span>
            <strong className="text-xs sm:text-sm text-brand-charcoal font-semibold">From 1 Unit / Trial Pack</strong>
          </div>
          <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/50">
            <span className="text-[10px] font-mono uppercase text-brand-charcoal/50 block mb-0.5">Pan-India Delivery</span>
            <strong className="text-xs sm:text-sm text-brand-charcoal font-semibold">Flat ₹90 Standard Shipping</strong>
          </div>
          <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/50">
            <span className="text-[10px] font-mono uppercase text-brand-charcoal/50 block mb-0.5">Tax Compliance</span>
            <strong className="text-xs sm:text-sm text-brand-charcoal font-semibold">GST Tax Invoice with ITC</strong>
          </div>
          <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/50">
            <span className="text-[10px] font-mono uppercase text-brand-charcoal/50 block mb-0.5">Dispatch Speed</span>
            <strong className="text-xs sm:text-sm text-brand-charcoal font-semibold">24–48h Dispatch Across India</strong>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brand-charcoal">Featured {categoryObj.label}</h2>
          <Link href={shopFilterUrl} className="text-brand-orange font-semibold hover:underline">
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

        {/* Category AEO FAQ Section */}
        <div className="mt-16 bg-white p-8 rounded-3xl border border-brand-linen">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-orange block mb-1">
              Buyer Questions &amp; Technical Specs
            </span>
            <h2 className="text-2xl font-bold font-serif text-brand-charcoal">
              Frequently Asked Questions About Wholesale {categoryObj.label}
            </h2>
          </div>
          <div className="space-y-6">
            {categoryFaqs.map((faq, idx) => (
              <div key={idx} className="border-b border-stone-100 pb-5 last:border-b-0 last:pb-0">
                <h3 className="font-bold text-brand-charcoal text-base md:text-lg mb-2">
                  {faq.question}
                </h3>
                <p className="text-brand-charcoal/70 text-sm md:text-base leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <BuyerFooter />
    </main>
  );
}

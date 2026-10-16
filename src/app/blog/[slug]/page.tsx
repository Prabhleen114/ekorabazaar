import { getAllPosts, getPostBySlug, markdownToHtml, extractToc } from "@/lib/blog";
import { notFound } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { Metadata } from "next";
import serialize from "serialize-javascript";
import prisma from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import ProductCard, { ProductCardItem } from "@/components/ProductCard";
import { ALL_CATEGORIES } from "@/lib/categories";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ekorabazaar.in";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article Not Found" };

  const { frontmatter } = post;
  const title = frontmatter.title;
  const description = frontmatter.description;

  if (frontmatter.draft) {
    return {
      title,
      description,
      robots: { index: false, follow: false },
    };
  }

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/blog/${slug}`,
      type: "article",
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt,
    },
    authors: [{ name: frontmatter.author }],
  };
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export const revalidate = 3600;

async function getRelatedProducts(tags: string[]): Promise<ProductCardItem[]> {
  if (!tags.length) return [];
  const matchingCat = ALL_CATEGORIES.find(
    (c) => tags.includes(c.label) || tags.includes(c.id)
  );
  if (!matchingCat) return [];
  try {
    const products = await prisma.product.findMany({
      where: {
        category: matchingCat.id,
        status: ProductStatus.PUBLISHED,
        OR: [{ sellerId: null }, { seller: { accountStatus: "ACTIVE" } }],
      },
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        imageUrl: true,
        wholesaleTiers: true,
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
    return products;
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { frontmatter, content } = post;
  const htmlContent = markdownToHtml(content);
  const toc = extractToc(content);
  const relatedProducts = await getRelatedProducts(frontmatter.tags);

  // Related guides: same category slug
  const relatedGuides = frontmatter.tags
    .map((tag) => ALL_CATEGORIES.find((c) => c.label === tag || c.id === tag))
    .filter(Boolean)
    .slice(0, 3)
    .map((cat) => ({
      label: cat!.label,
      slug: cat!.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    }));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    image: [frontmatter.featuredImage || `${BASE_URL}/og-image.jpg`],
    url: `${BASE_URL}/blog/${slug}`,
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.updatedAt || frontmatter.publishedAt,
    author: {
      "@type": "Organization",
      name: frontmatter.author,
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Ekora Bazaar",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/apple-touch-icon.png` },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: frontmatter.title, item: `${BASE_URL}/blog/${slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serialize([articleSchema, breadcrumbSchema], { isJSON: true }),
        }}
      />

      <div className="pt-24 pb-16 px-4 md:px-6 max-w-6xl mx-auto w-full flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-brand-charcoal/60">
          <ol className="flex items-center gap-2 flex-wrap">
            <li><Link href="/" className="hover:text-brand-orange transition-colors">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/blog" className="hover:text-brand-orange transition-colors">Blog</Link></li>
            <li aria-hidden="true">›</li>
            <li className="text-brand-charcoal font-medium line-clamp-1">{frontmatter.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          {/* Main Article */}
          <div>
            {/* Header */}
            <div className="mb-8">
              {frontmatter.tags[0] && (
                <span className="text-xs font-mono uppercase tracking-wider text-brand-orange mb-3 block">
                  {frontmatter.tags[0]}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal mb-4 leading-tight">
                {frontmatter.title}
              </h1>
              <p className="text-lg text-brand-charcoal/70 mb-4">{frontmatter.description}</p>
              <div className="flex items-center gap-4 text-sm text-brand-charcoal/50 border-t border-brand-linen pt-4">
                <span>By {frontmatter.author}</span>
                <span>·</span>
                <span>{frontmatter.readingTimeMinutes} min read</span>
                <span>·</span>
                <time dateTime={frontmatter.publishedAt}>
                  {formatDate(frontmatter.publishedAt)}
                </time>
                {frontmatter.updatedAt && frontmatter.updatedAt !== frontmatter.publishedAt && (
                  <>
                    <span>·</span>
                    <span>Updated {formatDate(frontmatter.updatedAt)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Article body */}
            <article
              className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-brand-charcoal prose-a:text-brand-orange prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Author box */}
            <div className="mt-12 p-6 bg-white rounded-2xl border border-brand-linen flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-orange font-bold text-lg font-serif">E</span>
              </div>
              <div>
                <p className="font-bold text-brand-charcoal">{frontmatter.author}</p>
                <p className="text-sm text-brand-charcoal/65 mt-1">
                  The Ekora Bazaar Editorial Team writes practical guides for India&apos;s craft
                  maker community — covering candle making, soap crafting, resin art, fragrance
                  formulation, and sourcing raw materials.
                </p>
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-6">
                  Related Products
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} priority={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Related Guides */}
            {relatedGuides.length > 0 && (
              <div className="mt-12 p-6 bg-white rounded-2xl border border-brand-linen">
                <h2 className="text-lg font-bold font-serif text-brand-charcoal mb-4">Related Guides</h2>
                <ul className="space-y-2">
                  {relatedGuides.map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/guides/${g.slug}`}
                        className="text-brand-orange hover:underline text-sm font-medium"
                      >
                        How to Choose {g.label}: A Buying Guide →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar: Table of Contents */}
          {toc.length > 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-28 bg-white rounded-2xl border border-brand-linen p-6">
                <p className="text-xs font-mono uppercase tracking-wider text-brand-charcoal/50 mb-4">
                  Table of Contents
                </p>
                <nav>
                  <ul className="space-y-2">
                    {toc.map((item) => (
                      <li key={item.id} style={{ paddingLeft: item.level === 3 ? "0.75rem" : 0 }}>
                        <a
                          href={`#${item.id}`}
                          className="text-sm text-brand-charcoal/70 hover:text-brand-orange transition-colors"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>

      <BuyerFooter />
    </main>
  );
}

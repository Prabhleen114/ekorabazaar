import { getAllPosts } from "@/lib/blog";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { Metadata } from "next";
import serialize from "serialize-javascript";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ekorabazaar.in";

export const metadata: Metadata = {
  title: "Craft Maker Knowledge Base | Ekora Bazaar Blog",
  description:
    "Practical guides on candle making, soap crafting, resin art, skincare formulation, and sourcing raw materials for small businesses in India.",
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: "Craft Maker Knowledge Base | Ekora Bazaar Blog",
    description:
      "Practical guides for Indian craft makers: candle wax selection, soap bases, fragrance usage rates, and wholesale sourcing tips.",
    url: `${BASE_URL}/blog`,
    type: "website",
  },
};

export const revalidate = 3600;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(breadcrumbSchema, { isJSON: true }) }}
      />

      <div className="pt-24 pb-16 px-4 md:px-6 max-w-5xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="mb-12">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-brand-charcoal/60">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-brand-orange transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-brand-charcoal font-medium">Blog</li>
            </ol>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-brand-charcoal mb-4">
            Maker Knowledge Base
          </h1>
          <p className="text-lg text-brand-charcoal/70 max-w-2xl">
            Practical guides on candle making, soap crafting, fragrance formulation, resin art,
            and sourcing raw materials — written for India&apos;s growing community of craft makers
            and small brands.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-brand-charcoal/60 text-lg">Articles coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-brand-linen p-6 hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                {post.frontmatter.tags[0] && (
                  <span className="text-xs font-mono uppercase tracking-wider text-brand-orange">
                    {post.frontmatter.tags[0]}
                  </span>
                )}
                <h2 className="text-xl font-bold font-serif text-brand-charcoal group-hover:text-brand-orange transition-colors line-clamp-2">
                  {post.frontmatter.title}
                </h2>
                <p className="text-brand-charcoal/65 text-sm leading-relaxed line-clamp-3">
                  {post.frontmatter.description}
                </p>
                <div className="mt-auto pt-4 border-t border-brand-linen flex items-center justify-between text-xs text-brand-charcoal/50">
                  <span>{post.frontmatter.author}</span>
                  <span className="flex items-center gap-3">
                    <span>{post.frontmatter.readingTimeMinutes} min read</span>
                    <span>{formatDate(post.frontmatter.publishedAt)}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BuyerFooter />
    </main>
  );
}

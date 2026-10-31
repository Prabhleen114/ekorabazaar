import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import dataRaw from "@/lib/data/formulations.json";
import ProductImageClient from "@/components/ProductImageClient";
import DOMPurify from "isomorphic-dompurify";

type Formulation = {
  title: string;
  url: string;
  imageUrl: string;
  excerpt: string;
  content: string;
};

// Generate static params for build time
export async function generateStaticParams() {
  const data: Formulation[] = dataRaw as Formulation[];

  return data.map((item) => ({
    slug: item.url.split("/").pop() || "",
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data: Formulation[] = dataRaw as Formulation[];
  const formulation = data.find(f => (f.url.split("/").pop() || "") === slug);

  if (!formulation) return { title: "Not Found" };

  const canonicalUrl = `https://www.ekorabazaar.in/formulations/${slug}`;
  return {
    title: `${formulation.title} | Formulations`,
    description: formulation.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${formulation.title} | Formulations`,
      description: formulation.excerpt,
      url: canonicalUrl,
      type: "article",
      images: formulation.imageUrl ? [{ url: formulation.imageUrl }] : undefined,
    },
  };
}

function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1','h2','h3','h4','h5','h6','p','br','hr','ul','ol','li','a',
      'strong','em','b','i','u','span','div','table','thead','tbody',
      'tr','th','td','img','blockquote','pre','code','sub','sup'
    ],
    ALLOWED_ATTR: ['href','src','alt','title','class','id','target','rel','width','height'],
    ALLOW_DATA_ATTR: false,
  });
}

import serialize from "serialize-javascript";

export default async function FormulationSinglePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data: Formulation[] = dataRaw as Formulation[];

  const formulation = data.find(f => decodeURIComponent(f.url.split("/").pop() || "") === decodeURIComponent(slug));

  if (!formulation) {
    notFound();
  }

  const canonicalUrl = `https://www.ekorabazaar.in/formulations/${slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: formulation.title,
    description: formulation.excerpt,
    url: canonicalUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    image: [formulation.imageUrl || "https://www.ekorabazaar.in/og-image.jpg"],
    author: {
      "@type": "Organization",
      name: "Ekora Formulation Lab",
      url: "https://www.ekorabazaar.in/formulations",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://www.ekorabazaar.in/#organization",
      name: "Ekora Bazaar",
      url: "https://www.ekorabazaar.in",
      logo: { "@type": "ImageObject", url: "https://www.ekorabazaar.in/images/logo.jpg" },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.ekorabazaar.in" },
      { "@type": "ListItem", position: 2, name: "Formulations", item: "https://www.ekorabazaar.in/formulations" },
      { "@type": "ListItem", position: 3, name: formulation.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal selection:bg-brand-orange/20">
      <BuyerNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize([articleSchema, breadcrumbSchema], { isJSON: true }) }}
      />

      <main className="pt-24 md:pt-28 pb-16 md:pb-20 px-4 md:px-6 max-w-3xl mx-auto">
        <Link
          href="/formulations"
          className="inline-flex items-center gap-2 text-brand-charcoal/60 hover:text-brand-orange transition-colors font-medium text-sm mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all formulations
        </Link>

        <article className="w-full">
          <header className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal mb-6 leading-snug">
              {formulation.title}
            </h1>
            <div className="w-16 h-1 bg-brand-orange mx-auto rounded-full mb-8"></div>
          </header>

          {formulation.imageUrl && (
            <div className="w-full mb-12 aspect-[16/9] relative rounded-2xl overflow-hidden shadow-md max-h-[500px]">
              <ProductImageClient
                src={formulation.imageUrl}
                alt={formulation.title}
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            </div>
          )}

          {/* Render the sanitized HTML content */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-charcoal prose-p:text-brand-charcoal/80 prose-p:leading-relaxed prose-a:text-brand-orange hover:prose-a:text-brand-orange/80 prose-li:text-brand-charcoal/80 prose-img:rounded-xl prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(formulation.content) }}
          />

          {/* Source Wholesale Ingredients Callout */}
          <div className="mt-14 p-6 sm:p-8 bg-stone-50 border border-stone-200 rounded-2xl">
            <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-2">
              Source Professional Ingredients for This Formulation
            </h3>
            <p className="text-sm text-stone-600 mb-5 leading-relaxed">
              Ekora Bazaar supplies batch-tested raw ingredients, cosmetic bases, essential oils, and packaging containers with tiered wholesale pricing and ₹90 pan-India delivery.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/wholesale/cosmetic-preservatives-chemicals"
                className="inline-flex items-center text-xs font-mono uppercase tracking-wider px-3.5 py-2 bg-white border border-stone-300 hover:border-brand-orange hover:text-brand-orange transition-colors rounded-lg"
              >
                Cosmetic Actives &amp; Preservatives →
              </Link>
              <Link
                href="/wholesale/raw-butters-carrier-oils"
                className="inline-flex items-center text-xs font-mono uppercase tracking-wider px-3.5 py-2 bg-white border border-stone-300 hover:border-brand-orange hover:text-brand-orange transition-colors rounded-lg"
              >
                Raw Butters &amp; Carrier Oils →
              </Link>
              <Link
                href="/wholesale/cosmetic-jars-bottles"
                className="inline-flex items-center text-xs font-mono uppercase tracking-wider px-3.5 py-2 bg-white border border-stone-300 hover:border-brand-orange hover:text-brand-orange transition-colors rounded-lg"
              >
                Bottles, Droppers &amp; Jars →
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center text-xs font-mono uppercase tracking-wider px-3.5 py-2 bg-brand-charcoal text-white hover:bg-brand-charcoal/90 transition-colors rounded-lg"
              >
                Browse All Wholesale Supplies →
              </Link>
            </div>
          </div>
        </article>
      </main>

      <BuyerFooter />
    </div>
  );
}

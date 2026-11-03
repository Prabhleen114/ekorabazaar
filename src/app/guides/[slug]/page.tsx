import { ALL_CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { Metadata } from "next";
import serialize from "serialize-javascript";
import { getWholesaleCategoryFaqs } from "@/lib/faqs";
import { generateFaqSchema } from "@/lib/seo";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ekorabazaar.in";

type Props = {
  params: Promise<{ slug: string }>;
};

// Convert slug back to Category Name for matching
function slugToCategoryLabel(slug: string) {
  return ALL_CATEGORIES.find(c => c.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) ||
         ALL_CATEGORIES.find(c => c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categoryObj = slugToCategoryLabel(slug);
  
  if (!categoryObj) {
    return { title: "Guide Not Found" };
  }

  const title = `How to Choose ${categoryObj.label}: A Buying Guide`;
  const description = `Practical guidance on selecting and sourcing ${categoryObj.label} for small businesses and makers in India. Understand quality standards, usage tips, and what to look for when buying wholesale.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/guides/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/guides/${slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  return ALL_CATEGORIES.map((cat) => ({
    slug: cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const categoryObj = slugToCategoryLabel(slug);

  if (!categoryObj) {
    notFound();
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Guides", "item": `${BASE_URL}/guides` },
      { "@type": "ListItem", "position": 3, "name": categoryObj.label, "item": `${BASE_URL}/guides/${slug}` },
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `How to Choose ${categoryObj.label}: A Buying Guide`,
    "description": `Practical guidance on selecting and sourcing ${categoryObj.label} for small businesses and makers in India.`,
    "url": `${BASE_URL}/guides/${slug}`,
    "publisher": {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "Ekora Bazaar",
      "url": BASE_URL,
      "logo": { "@type": "ImageObject", "url": `${BASE_URL}/images/logo.jpg` },
    },
    "author": {
      "@type": "Organization",
      "name": "Ekora Bazaar Editorial Team",
      "url": `${BASE_URL}/about`,
    },
  };

  const categoryFaqs = getWholesaleCategoryFaqs(categoryObj.label);
  const faqSchema = generateFaqSchema(categoryFaqs);

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serialize([breadcrumbSchema, articleSchema, faqSchema], { isJSON: true }),
        }}
      />

      <div className="pt-24 pb-12 px-4 md:px-6 max-w-4xl mx-auto w-full flex-1">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-brand-charcoal/60">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-brand-orange transition-colors">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/guides" className="hover:text-brand-orange transition-colors">Guides</Link></li>
            <li aria-hidden="true">›</li>
            <li className="text-brand-charcoal font-medium">{categoryObj.label} Guide</li>
          </ol>
        </nav>
        
        <article className="bg-white p-8 md:p-12 rounded-3xl border border-brand-linen shadow-sm prose prose-stone max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal mb-4">
            How to Choose {categoryObj.label}: A Buying Guide for Makers
          </h1>
          
          <p className="text-lg text-brand-charcoal/80 leading-relaxed mb-6">
            Whether you are a small creator, an emerging brand, or a commercial manufacturing operation,
            sourcing quality <strong>{categoryObj.label}</strong> requires understanding what the
            technical specifications mean and how they affect your finished products.
            This guide covers the key factors to consider before you place a wholesale order.
          </p>

          {/* Direct Answer Summary Box */}
          <div className="not-prose my-8 p-6 bg-stone-50 border border-brand-linen rounded-2xl">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-orange font-bold block mb-1">
              Direct Answer &bull; Sourcing Summary
            </span>
            <h2 className="text-lg font-serif font-bold text-brand-charcoal mb-3">
              Key Sourcing Criteria for {categoryObj.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-brand-charcoal/80 leading-relaxed">
              <div className="space-y-1">
                <strong className="block text-brand-charcoal font-semibold">1. Minimum Order &amp; Sampling:</strong>
                <p>Begin with 1 unit trial samples or small slabs before committing to 12+ unit wholesale cartons to verify hot throw, demoulding, and scent stability.</p>
              </div>
              <div className="space-y-1">
                <strong className="block text-brand-charcoal font-semibold">2. Batch Purity &amp; Compliance:</strong>
                <p>Always verify lot-specific Certificate of Analysis (COA), Technical Data Sheet (TDS), and IFRA 51st Amendment compliance documents.</p>
              </div>
              <div className="space-y-1">
                <strong className="block text-brand-charcoal font-semibold">3. Climate &amp; Storage:</strong>
                <p>Store raw ingredients in dark, airtight containers below 25°C to prevent thermal degradation, oxidation, and humidity sweating in Indian summers.</p>
              </div>
              <div className="space-y-1">
                <strong className="block text-brand-charcoal font-semibold">4. Pan-India Delivery &amp; Invoicing:</strong>
                <p>Ekora Bazaar charges flat ₹90 shipping across India with automatic B2B GST tax invoices for full Input Tax Credit (ITC) eligibility.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-brand-charcoal mt-8 mb-4">1. Understanding Quality Documentation</h2>
          <p className="text-brand-charcoal/70 mb-6">
            When buying {categoryObj.label} at wholesale volume, ask suppliers for a
            certificate of analysis (COA) for each batch. Where applicable, request safety
            data sheets (SDS or MSDS) as well. These documents confirm what is in the product
            and allow you to accurately label your finished goods and comply with applicable
            regulations. Batch-to-batch consistency is especially important if you produce
            under your own brand.
          </p>

          <h2 className="text-2xl font-bold text-brand-charcoal mt-8 mb-4">2. Minimum Order Quantities and Pricing Tiers</h2>
          <p className="text-brand-charcoal/70 mb-6">
            Most wholesale suppliers structure pricing in volume tiers. Understanding your
            actual consumption rate before committing to a large order prevents over-ordering
            stock that may degrade before use. Calculate your monthly usage based on current
            or projected production volume, then add a reasonable safety buffer (typically 15–20%)
            before selecting a tier. For new materials, always begin with a smaller sample
            order to test performance before scaling.
          </p>

          <h2 className="text-2xl font-bold text-brand-charcoal mt-8 mb-4">3. Choosing the Right Variant for Your Application</h2>
          <p className="text-brand-charcoal/70 mb-6">
            Within the {categoryObj.label} category, there are often several grades, formulations,
            or specifications suited to different end applications. Review the supplier&apos;s
            technical data sheet carefully, and if in doubt, ask for guidance on which variant
            performs best in your specific use case. Most suppliers are able to provide sample
            quantities before a bulk purchase.
          </p>

          {/* Frequently Asked Questions */}
          <div className="not-prose mt-12 pt-8 border-t border-brand-linen">
            <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-6">
              Frequently Asked Questions About {categoryObj.label}
            </h2>
            <div className="space-y-4">
              {categoryFaqs.map((faq, idx) => (
                <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-brand-linen/80">
                  <h3 className="font-bold text-brand-charcoal text-sm sm:text-base mb-1.5">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-charcoal/75 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="not-prose mt-12 p-8 bg-stone-50 rounded-2xl border border-brand-linen text-center">
            <h3 className="text-xl font-bold text-brand-charcoal mb-4">Browse {categoryObj.label} on Ekora Bazaar</h3>
            <p className="text-brand-charcoal/70 mb-6 text-sm">
              View available products, pricing tiers, and supplier details for {categoryObj.label}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/wholesale/${slug}`} className="bg-brand-orange text-white px-4 md:px-6 py-3 rounded-xl font-semibold hover:bg-brand-terracotta transition-colors shadow-md inline-block text-sm">
                View Wholesale Products
              </Link>
              <Link href={`/shop?category=${encodeURIComponent(categoryObj.label)}`} className="bg-white text-brand-charcoal border border-brand-linen px-4 md:px-6 py-3 rounded-xl font-semibold hover:bg-stone-50 transition-colors inline-block text-sm">
                Browse All Products
              </Link>
            </div>
          </div>
        </article>
      </div>

      <BuyerFooter />
    </main>
  );
}

import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { Metadata } from "next";
import { ALL_CATEGORIES } from "@/lib/categories";
import serialize from "serialize-javascript";
import { BookOpen, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { generateFaqSchema } from "@/lib/seo";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ekorabazaar.in";

export const metadata: Metadata = {
  title: "Sourcing & Buying Guides",
  description:
    "Comprehensive sourcing and buying guides for craft makers, candle artisans, soap makers, and cosmetic formulators in India. Learn quality standards, batch testing criteria, and wholesale specifications.",
  alternates: {
    canonical: `${BASE_URL}/guides`,
  },
  openGraph: {
    title: "Sourcing & Buying Guides",
    description:
      "Comprehensive sourcing and buying guides for craft makers, candle artisans, soap makers, and cosmetic formulators in India.",
    url: `${BASE_URL}/guides`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

const GUIDES_HUB_FAQS = [
  {
    question: "What is the difference between buying craft supplies wholesale vs retail in India?",
    answer:
      "Wholesale sourcing gives makers direct access to manufacturer batches with transparent volume tiers (e.g., 12+ and 52+ units), batch Certificates of Analysis (COA), safety data sheets (MSDS), and GST tax invoices with Input Tax Credit (ITC), eliminating middleman markups."
  },
  {
    question: "What documentation should I verify before purchasing bulk candle waxes or cosmetic bases?",
    answer:
      "Always request and inspect three primary documents: 1) Certificate of Analysis (COA) confirming chemical purity and melt point, 2) Technical Data Sheet (TDS) detailing safe pouring and processing guidelines, and 3) IFRA certificates for fragrances confirming safe percentage limits for your specific application."
  },
  {
    question: "Does Ekora Bazaar deliver heavy bulk cartons across India?",
    answer:
      "Yes. Ekora Bazaar applies a standard flat delivery charge of ₹90 per order across India, regardless of total weight or number of cartons, dispatched within 24 to 48 hours from our fulfillment hub in Muzaffarpur, Bihar."
  },
  {
    question: "Can emerging brands and home studios get GST invoices for Input Tax Credit (ITC)?",
    answer:
      "Yes. Every purchase on Ekora Bazaar generates a formal B2B GST tax invoice containing your company name, GSTIN, and itemized HSN/SAC codes for 100% ITC claims. Simply enter your GST number during checkout."
  }
];

export default function GuidesIndexPage() {
  const guides = ALL_CATEGORIES.map((cat) => ({
    label: cat.label,
    id: cat.id,
    slug: cat.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  }));

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Guides", "item": `${BASE_URL}/guides` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ekora Sourcing & Buying Guides",
    description:
      "Practical guidance on selecting and sourcing verified raw materials for small businesses and makers in India.",
    url: `${BASE_URL}/guides`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: guides.map((guide, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: `How to Choose ${guide.label}: A Buying Guide`,
        url: `${BASE_URL}/guides/${guide.slug}`,
      })),
    },
  };

  const faqSchema = generateFaqSchema(GUIDES_HUB_FAQS);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal selection:bg-brand-orange/20 flex flex-col">
      <BuyerNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serialize([breadcrumbSchema, collectionSchema, faqSchema], { isJSON: true }),
        }}
      />

      <main className="flex-1 pt-24 pb-20 px-4 md:px-6 max-w-7xl mx-auto w-full">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-brand-charcoal/60">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand-orange transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">&rsaquo;</li>
            <li className="text-brand-charcoal font-medium">Guides</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Maker Knowledge Base
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal mb-5">
            Sourcing &amp; Buying Guides
          </h1>
          <p className="text-brand-charcoal/75 text-lg leading-relaxed">
            Expert buying advice, quality assessment checklists, and technical criteria for sourcing raw craft materials, silicone moulds, and packaging containers across India.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group bg-white rounded-2xl p-6 border border-brand-linen hover:border-brand-orange/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                    Buying Guide
                  </span>
                  <Sparkles className="w-4 h-4 text-brand-orange/60 group-hover:text-brand-orange transition-colors" />
                </div>
                <h2 className="font-serif font-bold text-xl text-brand-charcoal mb-2.5 group-hover:text-brand-orange transition-colors">
                  How to Choose {guide.label}
                </h2>
                <p className="text-sm text-brand-charcoal/70 leading-relaxed line-clamp-3 mb-6">
                  Practical guidelines on selecting, testing, and purchasing {guide.label.toLowerCase()} in wholesale quantities. Quality standards, batch authenticity, and maker tips.
                </p>
              </div>

              <div className="pt-4 border-t border-brand-linen/60 flex items-center justify-between text-xs font-semibold text-brand-orange group-hover:translate-x-0.5 transition-transform">
                <span>Read Full Guide</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Sourcing Hub FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl border border-brand-linen p-8 md:p-10">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-orange block mb-1">
              Direct Answer &bull; Sourcing FAQs
            </span>
            <h2 className="text-2xl font-bold font-serif text-brand-charcoal">
              Frequently Asked Questions About Raw Material Sourcing
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GUIDES_HUB_FAQS.map((faq, idx) => (
              <div key={idx} className="p-5 bg-stone-50/70 rounded-xl border border-brand-linen/80 space-y-2">
                <h3 className="font-bold text-brand-charcoal text-base">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-brand-charcoal/75 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Value Prop Banner */}
        <div className="mt-10 bg-white rounded-2xl border border-brand-linen p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-orange/10 rounded-xl text-brand-orange shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-brand-charcoal mb-1">
                Verified Sourcing for Commercial Production
              </h3>
              <p className="text-sm text-brand-charcoal/70">
                All guides are compiled by formulating chemists and craft production specialists to ensure batch integrity and regulatory compliance.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="shrink-0 px-6 py-3 bg-brand-charcoal hover:bg-black text-white rounded-xl text-sm font-medium transition-colors"
          >
            Explore Materials Shop
          </Link>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}

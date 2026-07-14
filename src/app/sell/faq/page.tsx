import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import FAQAccordion from "@/components/FAQAccordion";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Sell on Ekora",
  description:
    "Everything you need to know about selling on Ekora, our creator marketplace, instant storefronts, zero DMs checkout, and wholesale pricing.",
  keywords: [
    "Ekora FAQ",
    "how to sell on Ekora questions",
    "Instagram seller FAQ India",
    "Ekora creator marketplace help",
  ],
  alternates: {
    canonical: "https://www.ekorabazaar.in/sell/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions — Sell on Ekora",
    description:
      "Everything you need to know about selling on Ekora, our creator marketplace, instant storefronts, and wholesale pricing.",
    url: "https://www.ekorabazaar.in/sell/faq",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
      images: [
      {
        url: "https://www.ekorabazaar.in/og-image.jpg",
        secureUrl: "https://www.ekorabazaar.in/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ekora Bazaar — India's First Creator Commerce Platform",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions — Sell on Ekora",
    description:
      "Everything you need to know about selling on Ekora, our creator marketplace, instant storefronts, and wholesale pricing.",
      images: ["https://www.ekorabazaar.in/og-image.jpg"],
  },
};

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Who can apply to sell on Ekora?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Any independent creator or artisan in India selling handmade, crafted, or custom items on Instagram can apply.",
        },
      },
      {
        "@type": "Question",
        name: "How long does the verification process take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most creator applications are reviewed and approved within 48 hours.",
        },
      },
      {
        "@type": "Question",
        name: "How does Ekora handle payments and orders?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ekora provides an automated storefront with secure checkout, removing the need to manage orders via DMs.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.ekorabazaar.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Sell on Ekora",
        item: "https://www.ekorabazaar.in/sell",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "FAQ",
        item: "https://www.ekorabazaar.in/sell/faq",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-16 md:pt-20 pb-2 px-6 text-center bg-brand-bg">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold font-serif tracking-tight text-brand-charcoal mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-brand-charcoal/60 leading-relaxed">
            Everything you need to know about Ekora, the Early Access program, and how we help creators grow.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pt-2 pb-16 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-6">
          <FAQAccordion />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-brand-bg border-t border-brand-linen text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange/5 blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight text-brand-charcoal mb-8">
            Still have questions?
          </h2>
          <Link
            href="/start-selling"
            className="inline-flex items-center justify-center bg-brand-orange hover:bg-brand-terracotta text-white px-8 py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-brand-orange/20 hover:scale-[1.02]"
          >
            Apply for Early Access
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

import serialize from "serialize-javascript";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import FAQAccordion from "@/components/FAQAccordion";
import { flags, FAQFlag } from "@/data/faq-flags";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Everything you need to know about Ekora, our creator marketplace, instant storefronts, zero DMs checkout, and wholesale pricing.",
  alternates: {
    canonical: "https://ekorabazaar.in/faq",
  },
};

export default function FAQServerPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: flags.map((item: FAQFlag) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serialize(faqSchema, { isJSON: true }),
        }}
      />
      <Navbar />

      <section className="pt-16 md:pt-20 pb-2 px-4 md:px-6 text-center bg-brand-bg">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold font-serif tracking-tight text-brand-charcoal mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-brand-charcoal/60 leading-relaxed">
            Everything you need to know about Ekora, the Early Access program, and how we help creators grow.
          </p>
        </div>
      </section>

      <section className="pt-2 pb-16 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <FAQAccordion />
        </div>
      </section>

      <section className="py-16 md:py-20 bg-brand-bg border-t border-brand-linen text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange/5 blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 md:px-6 relative z-10">
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

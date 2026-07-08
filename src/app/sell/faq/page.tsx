import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata = {
  title: "Frequently Asked Questions — Ekora",
  description: "Everything you need to know about Ekora, the Early Access program, and how we help creators grow.",
};

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 text-center bg-brand-bg">
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
      <section className="py-16 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-6">
          <FAQAccordion />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-bg border-t border-brand-linen text-center relative overflow-hidden">
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

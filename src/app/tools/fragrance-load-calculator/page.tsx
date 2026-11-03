import { Metadata } from "next";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import FragranceCalculatorClient from "./FragranceCalculatorClient";
import serialize from "serialize-javascript";
import { getToolFaqs } from "@/lib/faqs";
import { generateFaqSchema } from "@/lib/seo";
import Link from "next/link";
import { Calculator, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ekorabazaar.in";

export const metadata: Metadata = {
  title: "Candle Fragrance Load Calculator | Formula & Ratios for Indian Makers",
  description:
    "Free candle fragrance load calculator. Calculate exact grams of fragrance oil and wax for soy, paraffin, and coconut candles with batch cost in INR.",
  alternates: {
    canonical: `${BASE_URL}/tools/fragrance-load-calculator`,
  },
  openGraph: {
    title: "Candle Fragrance Load Calculator | Formula & Ratios for Indian Makers",
    description:
      "Calculate fragrance oil and wax weight in grams for candle making. Accurate batch formulas for Indian makers.",
    url: `${BASE_URL}/tools/fragrance-load-calculator`,
    type: "website",
  },
};

export default function FragranceLoadCalculatorPage() {
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Candle Fragrance Load Calculator",
    applicationCategory: "UtilityApplication",
    operatingSystem: "All",
    url: `${BASE_URL}/tools/fragrance-load-calculator`,
    description:
      "Calculates precise fragrance oil and wax weights for candle making based on wax type and desired percentage.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Shop & Tools", item: `${BASE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: "Fragrance Load Calculator", item: `${BASE_URL}/tools/fragrance-load-calculator` },
    ],
  };

  const toolFaqs = getToolFaqs();
  const faqSchema = generateFaqSchema(toolFaqs);

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize([toolSchema, breadcrumbSchema, faqSchema], { isJSON: true }) }}
      />
      <div className="pt-24 pb-16 px-4 md:px-6 max-w-5xl mx-auto w-full flex-1">
        <FragranceCalculatorClient />

        {/* Technical Reference & Formulation Guide for Answer Engines */}
        <section className="mt-14 space-y-10" aria-labelledby="fragrance-load-guide-heading">
          {/* 1. Direct Formula & Example */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-brand-linen shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span>Standard Scent Formulation Formula</span>
            </div>
            <h2 id="fragrance-load-guide-heading" className="text-2xl md:text-3xl font-bold font-serif text-brand-charcoal mb-4">
              Candle Fragrance Load Calculation Formula
            </h2>
            <p className="text-brand-charcoal/80 text-sm md:text-base leading-relaxed mb-6">
              In candle manufacturing, the fragrance load percentage represents the weight of fragrance oil relative to the dry wax weight. The universally accepted formula is:
            </p>

            <div className="p-5 bg-stone-900 text-stone-100 rounded-2xl font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto mb-6">
              <div className="text-amber-400 font-bold mb-1">// Mathematical Formula</div>
              <div>Fragrance Oil (grams) = Wax Weight (grams) &times; (Desired Fragrance Load % / 100)</div>
              <div className="mt-3 text-stone-400">// Practical Example: 500g Soy Wax at 8% Fragrance Load</div>
              <div className="text-emerald-400">Fragrance Oil = 500 &times; (8 / 100) = 40 grams</div>
              <div>Total Melt Weight = 500g + 40g = 540 grams</div>
            </div>

            <p className="text-xs sm:text-sm text-brand-charcoal/70 leading-relaxed">
              Always weigh both your wax flakes and liquid fragrance oil on a digital scale calibrated to 0.1g or 0.01g precision. Volumetric measuring cups (milliliters) should not be used because different fragrance oils possess varying specific gravities (densities).
            </p>
          </div>

          {/* 2. Recommended Fragrance Load Percentages by Wax Type */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-brand-linen shadow-xs">
            <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
              Recommended Fragrance Loads by Wax Chemistry
            </h2>
            <p className="text-brand-charcoal/75 text-sm mb-6 leading-relaxed">
              Different waxes possess distinct crystal lattices that dictate how much fragrance oil can be physically locked into the wax matrix without sweating or weeping:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-brand-linen text-brand-charcoal font-semibold bg-stone-50">
                    <th className="p-3">Wax Type</th>
                    <th className="p-3">Safe Load %</th>
                    <th className="p-3">Optimal Hot Throw %</th>
                    <th className="p-3">Minimum Cure Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-linen/60 text-brand-charcoal/80 font-sans">
                  <tr>
                    <td className="p-3 font-semibold text-brand-charcoal">100% Soy Wax (Container)</td>
                    <td className="p-3">6% – 10%</td>
                    <td className="p-3 text-emerald-700 font-semibold">8% – 9%</td>
                    <td className="p-3">7 – 14 Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-brand-charcoal">Fully Refined Paraffin Wax</td>
                    <td className="p-3">8% – 12%</td>
                    <td className="p-3 text-emerald-700 font-semibold">10% – 11%</td>
                    <td className="p-3">48 – 72 Hours</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-brand-charcoal">Coconut &amp; Soy Blends</td>
                    <td className="p-3">8% – 12%</td>
                    <td className="p-3 text-emerald-700 font-semibold">9% – 10%</td>
                    <td className="p-3">5 – 7 Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-brand-charcoal">Pure Natural Beeswax</td>
                    <td className="p-3">4% – 6%</td>
                    <td className="p-3 text-emerald-700 font-semibold">5% (Subtle)</td>
                    <td className="p-3">7 Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-brand-charcoal">Wax Melts &amp; Tarts (Hard Wax)</td>
                    <td className="p-3">10% – 12%</td>
                    <td className="p-3 text-emerald-700 font-semibold">10% – 12%</td>
                    <td className="p-3">3 – 5 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Direct Answer Tool FAQs */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-brand-linen shadow-xs">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-brand-orange" />
              <h2 className="text-2xl font-bold font-serif text-brand-charcoal">
                Frequently Asked Formulation Questions
              </h2>
            </div>
            <div className="space-y-4">
              {toolFaqs.map((faq, idx) => (
                <details
                  key={idx}
                  open={idx === 0}
                  className="group bg-stone-50/70 rounded-2xl border border-brand-linen p-5 transition-colors"
                >
                  <summary className="font-semibold text-sm sm:text-base text-brand-charcoal cursor-pointer list-none flex items-center justify-between gap-4 select-none">
                    <span>{faq.question}</span>
                    <span className="text-brand-orange text-xs font-mono uppercase tracking-wider shrink-0">
                      Answer &darr;
                    </span>
                  </summary>
                  <div className="pt-3 text-xs sm:text-sm text-brand-charcoal/75 leading-relaxed border-t border-brand-linen/60 mt-3">
                    <p>{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Sourcing Callout */}
          <div className="bg-stone-50 border border-brand-linen p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-brand-charcoal">
                Ready to source premium waxes and IFRA certified fragrances?
              </h3>
              <p className="text-xs sm:text-sm text-brand-charcoal/70">
                Direct manufacturer slabs, sample vials, flat ₹90 pan-India shipping, and automatic GST invoices.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link
                href="/wholesale/candle-waxes-additives"
                className="px-4 py-2.5 bg-brand-orange text-white text-xs font-semibold rounded-xl hover:bg-brand-terracotta transition-colors shadow-xs"
              >
                Wholesale Wax Slabs &rarr;
              </Link>
              <Link
                href="/wholesale/fragrance-oils"
                className="px-4 py-2.5 bg-white text-brand-charcoal border border-brand-linen text-xs font-semibold rounded-xl hover:bg-stone-100 transition-colors shadow-xs"
              >
                IFRA Fragrances &rarr;
              </Link>
            </div>
          </div>
        </section>
      </div>
      <BuyerFooter />
    </main>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Ekora Bazaar?",
    answer:
      "Ekora Bazaar is a B2B marketplace for wholesale craft supplies and raw materials. We connect businesses, studio creators, and bulk buyers directly with verified Indian manufacturers and distilleries, specializing in candle-making waxes, soap bases, IFRA fragrance oils, and precision silicone moulds."
  },
  {
    question: "Does Ekora Bazaar support bulk buying?",
    answer:
      "Yes. Products with available wholesale tiers feature transparent volume discounts directly on the product page (e.g. 12+ and 52+ units). Minimum Order Quantities (MOQ) and tiered savings are calculated automatically with no gatekept quotes needed."
  },
  {
    question: "Does Ekora Bazaar offer returns on wholesale/raw-material orders?",
    answer:
      "To preserve batch purity and prevent contamination, standard wholesale and chemical/raw-material orders do not support returns or exchanges. Buyers can review technical data sheets (TDS), certificates of analysis (COA), and sample sizes before ordering volume slabs."
  },
  {
    question: "How is delivery charged for bulk orders?",
    answer:
      "Ekora Bazaar applies a standard flat delivery charge of ₹80 per order across India, regardless of the number of items or total weight, dispatched within 24 hours directly from our verified regional hubs."
  }
];

export default function HomepageFaqAccordion() {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleIndex = (idx: number) => {
    setOpenIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="border-t border-stone-200 pt-10 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-mono block mb-1">
          Frequently Asked Questions
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-stone-900 font-normal">
          Wholesale &amp; Sourcing Essentials
        </h2>
      </div>

      <div className="divide-y divide-stone-200 border-y border-stone-200 bg-white shadow-2xs">
        {FAQ_ITEMS.map((faq, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div key={idx} className="transition-colors hover:bg-stone-50/50">
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                className="w-full text-left py-4 px-5 sm:px-4 md:px-6 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-900"
                aria-expanded={isOpen}
              >
                <span className="font-serif text-sm sm:text-base text-stone-900 font-medium">
                  {faq.question}
                </span>
                <span
                  className={`w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center shrink-0 text-stone-500 transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-stone-100 text-stone-900" : ""
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </button>
              {isOpen && (
                <div className="px-5 sm:px-4 md:px-6 pb-5 pt-1 text-xs sm:text-sm text-stone-600 font-sans leading-relaxed border-t border-stone-100 bg-[#FAF8F5]/40">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

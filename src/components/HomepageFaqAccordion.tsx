"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { HOMEPAGE_FAQS, FaqItem } from "@/lib/faqs";

export { HOMEPAGE_FAQS, type FaqItem };

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
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C734B] font-sans block mb-1">
          Frequently Asked Questions
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-stone-900 font-normal">
          Wholesale &amp; Sourcing Essentials
        </h2>
      </div>

      <div className="divide-y divide-stone-200 border-y border-stone-200 bg-white shadow-2xs">
        {HOMEPAGE_FAQS.map((faq, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div key={idx} className="transition-colors hover:bg-stone-50/50">
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                className="w-full text-left py-4 px-5 sm:px-4 md:px-6 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-900"
                aria-expanded={isOpen}
              >
                <span className="font-sans text-sm sm:text-base text-stone-900 font-medium">
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

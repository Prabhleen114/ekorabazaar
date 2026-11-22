"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { flags, faqs } from "@/data/faq-flags";
export type { FAQFlag, FAQItem } from "@/data/faq-flags";
export { flags, faqs };

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto w-full">
      {faqs.map((faq, index) => (
        <div key={index} className="border-b border-brand-linen">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between py-6 text-left focus:outline-none"
          >
            <span className="text-lg font-medium text-brand-charcoal pr-8">{faq.question}</span>
            <ChevronDown
              className={`w-5 h-5 text-brand-charcoal/40 transition-transform duration-200 flex-shrink-0 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              openIndex === index ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0"
            }`}
          >
            <p className="text-brand-charcoal/70 leading-relaxed pr-8">{faq.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

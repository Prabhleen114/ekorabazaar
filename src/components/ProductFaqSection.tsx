import { ChevronDown, HelpCircle, MessageCircle, Sparkles, ShieldCheck } from "lucide-react";
import { getCategoryFaqs, FaqItem } from "@/lib/faqs";

export { getCategoryFaqs, type FaqItem };

interface Props {
  productName: string;
  category: string;
  department?: string;
  price?: number;
}

export default function ProductFaqSection({ productName, category }: Props) {
  const faqs = getCategoryFaqs(productName, category);

  return (
    <section className="mt-12 pt-10 border-t border-brand-linen w-full" aria-labelledby="product-faq-heading">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Creator Technical Advisory</span>
          </div>
          <h2 id="product-faq-heading" className="text-2xl md:text-3xl font-bold font-serif text-brand-charcoal">
            Pre-Purchase Technical Q&amp;As
          </h2>
          <p className="text-xs md:text-sm text-brand-charcoal/60 mt-1">
            Frequently asked formulation, safety, and wholesale questions for {productName}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal/60 bg-white px-3.5 py-2 rounded-xl border border-brand-linen shadow-sm shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified by Ekora Lab Formulators</span>
        </div>
      </div>

      {/* Accordion List (Crawlable Server-Rendered Semantic HTML) */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <details
            key={idx}
            open={idx === 0}
            className="group bg-white rounded-2xl border border-brand-linen overflow-hidden shadow-sm transition-all duration-200 hover:border-brand-orange/40"
          >
            <summary className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden transition-colors">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-bg flex items-center justify-center text-xs font-bold text-brand-charcoal/70 shrink-0 mt-0.5">
                  Q{idx + 1}
                </span>
                <div>
                  {faq.tag && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange block mb-0.5">
                      {faq.tag}
                    </span>
                  )}
                  <h3 className="font-semibold text-sm md:text-base text-brand-charcoal inline">
                    {faq.question}
                  </h3>
                </div>
              </div>
              <div className="w-7 h-7 rounded-lg bg-brand-bg flex items-center justify-center shrink-0 text-brand-charcoal/60 transition-transform duration-200 group-open:rotate-180 group-open:bg-brand-orange/10 group-open:text-brand-orange">
                <ChevronDown className="w-4 h-4" />
              </div>
            </summary>

            <div className="px-5 pb-5 pt-1 text-sm text-brand-charcoal/75 leading-relaxed border-t border-brand-linen/60 bg-stone-50/50 pl-14">
              <p>{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>

      {/* Bottom Help Banner */}
      <div className="mt-6 bg-gradient-to-r from-stone-50 to-amber-50/40 p-4 md:p-5 rounded-2xl border border-brand-linen flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-brand-linen flex items-center justify-center shrink-0 text-brand-orange">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-brand-charcoal">Have a custom batch or formulation requirement?</h4>
            <p className="text-xs text-brand-charcoal/60">
              Our technical formulation advisory connects you with certified laboratory data sheets and batch specialists.
            </p>
          </div>
        </div>

        <a
          href={`https://wa.me/919041500605?text=${encodeURIComponent(
            `Hi Ekora Technical Advisory, I have a formulation question regarding ${productName}:`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-brand-charcoal text-xs font-semibold px-4 py-2.5 rounded-xl border border-brand-linen shadow-xs transition-colors shrink-0"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Ask a Formulator</span>
        </a>
      </div>
    </section>
  );
}

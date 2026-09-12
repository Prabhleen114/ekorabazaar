"use client";

import { useState, useMemo } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Sparkles, ShieldCheck } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
  tag?: string;
}

interface Props {
  productName: string;
  category: string;
  department?: string;
  price?: number;
}

export function getCategoryFaqs(productName: string, category: string): FaqItem[] {
  const cat = (category || "").toLowerCase();
  const name = productName || "this raw material";

  if (cat.includes("wax") || name.toLowerCase().includes("wax")) {
    return [
      {
        question: `What is the recommended fragrance oil load percentage for ${name}?`,
        answer: `For ${name}, the recommended fragrance load is between 6% and 10% by wax weight (approx. 60g to 100g per 1kg of melted wax). For optimal hot throw, heat wax to 80°C–85°C, add fragrance oil at 70°C–75°C, stir gently for 2 full minutes, and pour into pre-warmed vessels at 55°C–65°C.`,
        tag: "Technical Formulation"
      },
      {
        question: `What are the melting point and pouring temperature guidelines?`,
        answer: `Melting starts at approximately 48°C–52°C. Never exceed 90°C to prevent discoloration and thermal degradation of natural triglycerides. Recommended pouring temperature is between 58°C and 65°C depending on ambient room temperature and container material.`,
        tag: "Processing"
      },
      {
        question: `Is ${name} batch-tested and free from paraffin adulteration?`,
        answer: `Yes. Every production batch of ${name} on Ekora Bazaar undergoes certified laboratory gas chromatography (GC-MS) verification to guarantee 100% plant-based purity, zero toxic phthalates, and zero paraffin or petroleum waxes.`,
        tag: "Quality & Compliance"
      },
      {
        question: `Which candle wicks pair best with this wax?`,
        answer: `Cotton braided wicks (ECO and CD series) or natural untreated booster wooden wicks offer the cleanest burn pool with minimal mushrooming. Always conduct single-pour test burns for your specific vessel diameter.`,
        tag: "Wick Sizing"
      },
      {
        question: `Can I purchase bulk sacks (25kg carton / sack) with a GST invoice for small businesses?`,
        answer: `Yes. We provide automatic wholesale volume tier discounts (up to 20% off) at 12+ and 52+ units. Valid B2B GST tax invoices with input tax credit (ITC) are automatically generated with every order.`,
        tag: "Wholesale & B2B"
      }
    ];
  }

  if (cat.includes("fragrance") || cat.includes("essential") || cat.includes("oil") || cat.includes("attar")) {
    return [
      {
        question: `Is ${name} skin-safe and IFRA compliant?`,
        answer: `Yes. ${name} is manufactured strictly in compliance with the International Fragrance Association (IFRA 51st Amendment) standards. It is safe for candles (up to 10%), cold process and melt-and-pour soaps (up to 3%), lotions and body creams (up to 1.5%), and reed diffusers (up to 25%).`,
        tag: "Safety & IFRA"
      },
      {
        question: `What is the flash point of ${name}?`,
        answer: `The flash point is above 75°C (>167°F), making it completely safe for candle hot-pour processing, cold soap making, and secure domestic transport via air and surface courier without hazardous material restrictions.`,
        tag: "Safety Data"
      },
      {
        question: `Does this fragrance cause acceleration, ricing, or discoloration in cold process soap?`,
        answer: `This formulation has been laboratory bench-tested at 40°C in standard olive/coconut/palm CP soap batter. It exhibits minimal trace acceleration and zero ricing. For vanillin-containing blends, slight tan/amber discoloration is natural and can be stabilized with vanilla color stabilizer if desired.`,
        tag: "Soap Making"
      },
      {
        question: `Can I get an official Certificate of Analysis (COA) and MSDS sheet for this batch?`,
        answer: `Yes. Full batch-specific Certificate of Analysis (COA), Technical Data Sheet (TDS), and Material Safety Data Sheet (MSDS) reports are available for instant public download directly on this product page without any login wall.`,
        tag: "Documentation"
      },
      {
        question: `What wholesale volume packaging is available for small businesses?`,
        answer: `We supply in 500ml, 1 Liter, 5 Liter, and 25kg carboys sealed with tamper-evident caps. Tier discounts apply automatically when ordering 12+ or 52+ units with verified GST tax invoice.`,
        tag: "Bulk Supply"
      }
    ];
  }

  if (cat.includes("mould") || cat.includes("mold") || cat.includes("silicone")) {
    return [
      {
        question: `What temperature range can this silicone mould withstand?`,
        answer: `This silicone mould is precision-cured with industrial high-grade platinum elastomer, safe across temperatures from -40°C (-40°F) up to 230°C (446°F). It is fully compatible with hot-pour soy wax, paraffin, melt & pour soap, cold process lye soap, epoxy resin, and jesmonite/eco-casting powder.`,
        tag: "Thermal Specs"
      },
      {
        question: `How many casting cycles can I get from this mould before wear?`,
        answer: `Under standard production conditions with proper mould release techniques, our studio-grade silicone moulds achieve over 1,500+ wax pours and 400+ aggressive resin casting cycles with zero loss of surface fidelity.`,
        tag: "Durability"
      },
      {
        question: `How do I demould intricate details without tearing?`,
        answer: `For detailed floral, geometric, or pillar moulds, allow complete ambient cooling. For resin, wait until full 24-hour exothermic cure. Spraying a light mist of isopropyl alcohol or food-safe mould release spray along inner edges allows effortless slide-out demoulding.`,
        tag: "Production Tips"
      },
      {
        question: `How should this silicone mould be cleaned and stored?`,
        answer: `Wash gently with lukewarm soapy water using a non-abrasive microfiber cloth. Avoid sharp metal tools or harsh acetone solvents. Store flat or upright in a dust-free polybag away from direct UV sunlight.`,
        tag: "Maintenance"
      },
      {
        question: `Are wholesale pack discounts available for commercial studios?`,
        answer: `Yes. Automatic tier discounts (10% to 25% off) are enabled for wholesale orders of 12+ and 52+ units. Every order ships in rigid protective packaging to prevent transit deformation.`,
        tag: "Wholesale & B2B"
      }
    ];
  }

  if (cat.includes("jar") || cat.includes("bottle") || cat.includes("container") || cat.includes("tin")) {
    return [
      {
        question: `Are these containers heat-resistant for hot candle pouring?`,
        answer: `Yes. Made from heavy-wall annealed flint or soda-lime glass, these containers are rated for sudden thermal shock up to 80°C temperature differential, ensuring zero vessel cracking during candle pouring.`,
        tag: "Thermal Safety"
      },
      {
        question: `What closures and neck sizes fit this bottle/jar?`,
        answer: `Precision manufactured according to DIN industry tolerances. Closures (droppers, mist sprayers, lotion pumps, or metal screw caps) feature EPE/foam liners or airtight silicone gaskets to prevent any essential oil or fragrance leakage during shipping.`,
        tag: "Fit & Closures"
      },
      {
        question: `How are these fragile items packed to prevent courier breakage?`,
        answer: `Every glass and aluminium container order is packed in custom 5-ply corrugated master cartons with cell partitions and protective bubble sleeves. Ekora Bazaar guarantees 100% free transit-damage replacement within 7 days.`,
        tag: "Shipping Protection"
      },
      {
        question: `What is the case pack quantity and dispatch turnaround time?`,
        answer: `Wholesale cases range from 24 to 120 units per carton depending on volume. Orders placed before 2:00 PM are dispatched within 24 hours across India with real-time tracking.`,
        tag: "B2B Logistics"
      }
    ];
  }

  if (cat.includes("pigment") || cat.includes("mica") || cat.includes("color")) {
    return [
      {
        question: `Is this pigment stable in high pH cold process soap?`,
        answer: `Yes. Our cosmetic micas and mineral pigments are rigorously tested in pH 12–14 lye environments. They do not morph, fade, or bleed into adjoining color layers in cold process or melt and pour soap.`,
        tag: "Chemical Stability"
      },
      {
        question: `Is this pigment cosmetic-grade, non-toxic, and heavy-metal tested?`,
        answer: `Yes. Certified non-toxic, ethically sourced, and tested for lead, arsenic, and mercury within international cosmetic safety limits. Safe for bath bombs, body scrubs, soaps, and resin crafts.`,
        tag: "Cosmetic Compliance"
      },
      {
        question: `How much pigment should I use per kilogram of base?`,
        answer: `Recommended dispersion rate is 1g to 3g per 1kg of soap base or casting resin. For best results, pre-disperse in a small amount of rubbing alcohol, liquid glycerin, or carrier oil before blending.`,
        tag: "Usage Rate"
      }
    ];
  }

  // General Raw Material Fallback
  return [
    {
      question: `Is ${name} batch-tested for commercial studio consistency?`,
      answer: `Yes. Every batch of ${name} supplied on Ekora Bazaar comes with verified supplier laboratory testing, ensuring reliable density, purity, and performance consistency from trial samples to full production pallets.`,
      tag: "Quality Control"
    },
    {
      question: `Can I download the Certificate of Analysis (COA) and Technical Data Sheet (TDS)?`,
      answer: `Yes. Official batch reports including COA and TDS are publicly available for download directly on this product page.`,
      tag: "Documentation"
    },
    {
      question: `What wholesale discounts are available for small businesses?`,
      answer: `We provide automatic tier discounts at 12+ and 52+ units. Valid B2B GST tax invoices with Input Tax Credit (ITC) eligibility are generated automatically.`,
      tag: "B2B Pricing"
    },
    {
      question: `What is the delivery turnaround timeline across India?`,
      answer: `We dispatch within 24 to 48 hours via premium express couriers (Bluedart, Delhivery, DTDC). Expected delivery is 2–4 days for metros and 4–6 days for regional destinations.`,
      tag: "Shipping"
    }
  ];
}

export default function ProductFaqSection({ productName, category }: Props) {
  const faqs = useMemo(() => getCategoryFaqs(productName, category), [productName, category]);
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First FAQ open by default

  const toggleFaq = (idx: number) => {
    setOpenIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <section className="mt-12 pt-10 border-t border-brand-linen w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Creator Technical Advisory</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-brand-charcoal">
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

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-brand-linen overflow-hidden shadow-sm transition-all duration-200 hover:border-brand-orange/40"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-4 transition-colors"
                aria-expanded={isOpen}
              >
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
                    <span className="font-semibold text-sm md:text-base text-brand-charcoal">
                      {faq.question}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-7 h-7 rounded-lg bg-brand-bg flex items-center justify-center shrink-0 text-brand-charcoal/60 transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-brand-orange/10 text-brand-orange" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-brand-charcoal/75 leading-relaxed border-t border-brand-linen/60 bg-stone-50/50 pl-14">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Help Banner */}
      <div className="mt-6 bg-gradient-to-r from-stone-50 to-amber-50/40 p-4 md:p-5 rounded-2xl border border-brand-linen flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-brand-linen flex items-center justify-center shrink-0 text-brand-orange">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Have a Custom Formulation or Bulk Pallet Query?
            </h4>
            <p className="text-xs text-brand-charcoal/60 mt-0.5">
              Chat directly with our chemical engineers and raw material sourcing desk.
            </p>
          </div>
        </div>

        <a
          href={`https://wa.me/919999999999?text=${encodeURIComponent(
            `Hi Ekora Bazaar, I have a technical question regarding ${productName} (Category: ${category}). Could you assist me?`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide transition-colors shadow-sm shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Ask Sourcing Desk</span>
        </a>
      </div>
    </section>
  );
}

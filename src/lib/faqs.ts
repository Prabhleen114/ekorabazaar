export interface FaqItem {
  question: string;
  answer: string;
  tag?: string;
}

export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    question: "What is Ekora Bazaar?",
    answer:
      "Ekora Bazaar is a B2B marketplace for wholesale craft supplies and raw materials. We connect businesses, studio creators, and bulk buyers directly with verified Indian manufacturers and distilleries, specializing in candle-making waxes, soap bases, IFRA fragrance oils, and precision silicone moulds.",
    tag: "Entity Overview"
  },
  {
    question: "Does Ekora Bazaar support bulk buying?",
    answer:
      "Yes. Products with available wholesale tiers feature transparent volume discounts directly on the product page (e.g. 12+ and 52+ units). Minimum Order Quantities (MOQ) and tiered savings are calculated automatically with no gatekept quotes needed.",
    tag: "Wholesale & B2B"
  },
  {
    question: "Does Ekora Bazaar offer returns on wholesale/raw-material orders?",
    answer:
      "To preserve batch purity and prevent contamination, standard wholesale and chemical/raw-material orders do not support returns or exchanges. Buyers can review technical data sheets (TDS), certificates of analysis (COA), and sample sizes before ordering volume slabs.",
    tag: "Commercial Policy"
  },
  {
    question: "How is delivery charged for bulk orders?",
    answer:
      "Ekora Bazaar applies a standard flat delivery charge of ₹90 per order across India, regardless of the number of items or total weight, dispatched within 24 hours directly from our verified regional hubs.",
    tag: "Shipping Rate"
  }
];

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

  if (name.toLowerCase().includes("ethanol") || name.toLowerCase().includes("alcohol")) {
    return [
      {
        question: `Is this alcohol safe for candle making?`,
        answer: `No. Ethanol sold as perfumer’s alcohol is highly flammable and is NOT recommended for candle wicks or heated applications. Use only for cold fragrance blending, perfumery, or room sprays.`,
        tag: "Safety"
      },
      {
        question: `What is the purity level of this solvent?`,
        answer: `This is 99% pure perfumer's grade alcohol, denatured specifically for cosmetic and fragrance blending. It ensures completely clear solutions with no cloudiness when mixing with aroma chemicals or essential oils.`,
        tag: "Purity & Usage"
      },
      {
        question: `Can I get an official Certificate of Analysis (COA) and MSDS sheet for this batch?`,
        answer: `Yes. Full batch-specific Certificate of Analysis (COA) and Material Safety Data Sheet (MSDS) reports are available for instant public download directly on this product page.`,
        tag: "Documentation"
      },
      {
        question: `What wholesale volume packaging is available for small businesses?`,
        answer: `We supply in 500ml, 1 Liter, 5 Liter, and bulk carboys sealed with tamper-evident caps. Tier discounts apply automatically when ordering higher volumes with a verified GST tax invoice.`,
        tag: "Wholesale & B2B"
      }
    ];
  }

  if (cat.includes("fragrance") || cat.includes("scent") || name.toLowerCase().includes("fragrance") || name.toLowerCase().includes("aroma")) {
    return [
      {
        question: `What is the flash point of ${name}?`,
        answer: `Most concentrated fragrance oils in our catalog possess flash points exceeding 93°C (200°F), ensuring safety during high-temperature wax blending and hot melt-and-pour soap bases. Always check the batch specification sheet on this page for the exact flash point degree.`,
        tag: "Safety & Flash Point"
      },
      {
        question: `Is ${name} 100% IFRA Certified?`,
        answer: `Yes. Every fragrance formulation on Ekora Bazaar complies strictly with the IFRA 51st Amendment Standards for category safety across candle making, cosmetic leave-on lotions, and rinse-off soap bars.`,
        tag: "Regulatory Compliance"
      },
      {
        question: `Does this fragrance cause vanilla discoloration or ricing in cold process soap?`,
        answer: `Fragrances with vanillin content exceeding 1% may naturally oxidize to tan or brown in high pH environments. Review our technical notes above or use an approved vanilla color stabilizer when soap making.`,
        tag: "Soap Formulation"
      },
      {
        question: `Can I purchase sample vials before ordering 1 Liter or 5 Liter bulk carboys?`,
        answer: `Yes. We provide 30ml, 100ml, 500ml, and 1kg trial containers so studio perfumers and makers can evaluate cold and hot scent throws before committing to bulk manufacturing tiers.`,
        tag: "Sampling & Scale"
      }
    ];
  }

  if (cat.includes("mould") || cat.includes("mold") || name.toLowerCase().includes("mould") || name.toLowerCase().includes("mold")) {
    return [
      {
        question: `What is the temperature resistance of this silicone mould?`,
        answer: `Our precision studio moulds are manufactured from high-tear vulcanized food and craft grade silicone rated from -40°C to 230°C (-40°F to 446°F). They withstand direct molten wax, hot soap batter, and exothermic resin reactions.`,
        tag: "Material Specs"
      },
      {
        question: `Is this mould reusable and compatible with epoxy resin and Jesmonite?`,
        answer: `Yes. Engineered with micro-mirror internal polishing, castings release cleanly with zero distortion. Compatible with eco-resin (Jesmonite/acrylic composite), polyurethane resin, paraffin, soy wax, and melt & pour soap.`,
        tag: "Casting Compatibility"
      },
      {
        question: `How should I clean and preserve this mould for studio production?`,
        answer: `Wash with mild warm water and liquid dish soap. Avoid abrasive sponges, caustic solvents, or sharp fingernails. Store flat in dust-free containers away from direct UV sunlight to prevent silicone embrittlement.`,
        tag: "Studio Maintenance"
      }
    ];
  }

  if (cat.includes("essential") || name.toLowerCase().includes("essential oil")) {
    return [
      {
        question: `Is ${name} 100% pure steam-distilled or adulterated with dipropylene glycol (DPG)?`,
        answer: `Every essential oil on Ekora Bazaar is 100% pure, natural, and undiluted, obtained through direct steam or water distillation of botanical biomass. We never dilute or adulterate with synthetic carriers, mineral oil, or DPG.`,
        tag: "Botanical Purity"
      },
      {
        question: `What is the recommended safe dermal dilution rate?`,
        answer: `For leave-on topical formulations (body oils, lotions), dilute between 0.5% and 2.0% in an approved carrier oil (such as Jojoba, Sweet Almond, or Fractionated Coconut Oil). For wash-off products, 1% to 3% is standard.`,
        tag: "Skin Safety"
      },
      {
        question: `Can I obtain lot-specific Gas Chromatography (GC-MS) chemical profiles?`,
        answer: `Yes. Lot-specific GC-MS reports documenting major terpene, alcohol, and ester constituents are available on request for cosmetic compliance dossiers.`,
        tag: "Quality Certification"
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
      answer: `We dispatch within 24 to 48 hours via premium express couriers (Bluedart, Delhivery, DTDC). Expected delivery is 4–6 days for metros and 6–8 days for regional destinations.`,
      tag: "Shipping"
    }
  ];
}

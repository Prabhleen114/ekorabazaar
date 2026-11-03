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
      "To preserve batch purity and prevent contamination, standard wholesale and chemical/raw-material orders do not support returns or exchanges. Buyers can review technical data sheets (TDS), certificates of analysis (COA), and sample sizes before ordering volume slabs. Transit damage or leakages reported with continuous unboxing video within 24 hours are replaced promptly.",
    tag: "Commercial Policy"
  },
  {
    question: "How is delivery charged for bulk orders?",
    answer:
      "Ekora Bazaar applies a standard flat delivery charge of ₹90 per order across India, regardless of the number of items or total weight, dispatched within 24 hours directly from our verified regional hubs.",
    tag: "Shipping Rate"
  },
  {
    question: "Can I get a GST tax invoice with Input Tax Credit (ITC) for business purchases?",
    answer:
      "Yes. Every purchase on Ekora Bazaar generates a compliant B2B GST tax invoice containing your company name, GSTIN, and product HSN/SAC codes for 100% Input Tax Credit (ITC) claiming. Enter your GST number during checkout to receive the tax invoice automatically upon order confirmation.",
    tag: "Tax & Compliance"
  },
  {
    question: "How are liquid raw materials and aroma chemicals packed to prevent transit leaks?",
    answer:
      "All liquid raw materials, including IFRA fragrance oils, pure essential oils, and cosmetic chemicals, are packed in chemical-resistant amber glass bottles or HDPE carboys with induction-sealed tamper-evident caps, protected by multi-layer bubble wrap and reinforced corrugated outer cartons.",
    tag: "Packaging & Safety"
  },
  {
    question: "What is the dispatch timeframe and tracking process for wholesale orders?",
    answer:
      "Standard orders dispatch within 24 to 48 business hours from our fulfillment hub in Muzaffarpur, Bihar. Real-time courier tracking numbers (Bluedart, Delhivery, DTDC) are sent automatically via SMS and WhatsApp upon handover to logistics partners.",
    tag: "Dispatch & Tracking"
  },
  {
    question: "Where does Ekora Bazaar source its raw materials?",
    answer:
      "Ekora Bazaar sources directly from verified Indian distilleries, botanical extraction facilities, and ISO/GMP-certified chemical refineries. Eliminating secondary brokers guarantees unadulterated batch purity, transparent Certificates of Analysis (COA), and competitive factory-direct pricing.",
    tag: "Sourcing & Purity"
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

  if (cat.includes("soap") || name.toLowerCase().includes("soap")) {
    return [
      {
        question: `What is the melting temperature for this soap base?`,
        answer: `Melt slowly between 55°C and 65°C using a double boiler or microwave in 15-second bursts. Avoid boiling the soap base, as excessive heat evaporates natural moisture and causes surface sweating or rubbery textures.`,
        tag: "Melting Guide"
      },
      {
        question: `Does this soap base sweat in humid Indian weather?`,
        answer: `Our ultra-clear and goat milk soap bases are formulated with low-sweat moisture balancing ingredients. To prevent glycerin sweating during monsoon season, wrap cured bars tightly in airtight shrink wrap within 45 minutes of unmoulding.`,
        tag: "Climate & Storage"
      },
      {
        question: `What percentage of additives, clays, and fragrance can I incorporate?`,
        answer: `Add up to 1% to 2% fragrance or essential oil, 0.5% botanical extracts or clays, and cosmetic mica as needed. Add ingredients when the melted base cools to 50°C–52°C before pouring to maintain clarity and suspend botanicals evenly.`,
        tag: "Formulation Limits"
      },
      {
        question: `Is this soap base SLS, SLES, and paraben-free?`,
        answer: `Yes. All artisan melt-and-pour bases on Ekora Bazaar are 100% free from harsh sodium lauryl sulfate (SLS), sodium laureth sulfate (SLES), parabens, and animal cruelty.`,
        tag: "Safety & Purity"
      }
    ];
  }

  if (cat.includes("butter") || cat.includes("carrier oil") || name.toLowerCase().includes("butter") || name.toLowerCase().includes("oil")) {
    return [
      {
        question: `Is this raw butter/carrier oil cold-pressed and unrefined?`,
        answer: `We supply pure, mechanical cold-pressed and expeller-pressed botanical oils and unrefined/deodorized cosmetic butters. Check the product certificate of analysis (COA) on this page for exact extraction method and fatty acid profiles.`,
        tag: "Extraction & Purity"
      },
      {
        question: `How should I store this botanical butter or oil to prevent rancidity?`,
        answer: `Store in airtight containers below 22°C away from moisture, oxygen, and direct sunlight. Unrefined butters and oils with high polyunsaturated fatty acid content benefit from refrigeration or addition of 0.1% Vitamin E (Tocopherol) antioxidant.`,
        tag: "Shelf Life & Storage"
      },
      {
        question: `Can I use this butter/oil directly in leave-on skincare formulations?`,
        answer: `Yes. Our raw cosmetic-grade butters and carrier oils are 100% skin safe and commonly formulated into body lotions, lip balms, hair masks, and cold-process soap bars.`,
        tag: "Topical Application"
      }
    ];
  }

  if (cat.includes("preservative") || cat.includes("chemical") || name.toLowerCase().includes("preservative")) {
    return [
      {
        question: `What is the recommended dosage percentage for this cosmetic preservative?`,
        answer: `Most broad-spectrum preservatives in our catalog (such as Phenoxyethanol + Ethylhexylglycerin blends or Liquid Germall Plus) are formulated at 0.5% to 1.0% of the total batch weight. Always add during the cool-down phase below 45°C.`,
        tag: "Usage Rate"
      },
      {
        question: `What is the effective pH operating range?`,
        answer: `Check the technical data sheet on this page for the exact batch pH range. Most organic acid-based eco preservatives require a pH below 5.5, while paraben-free broad-spectrum blends operate effectively across pH 3.0 to 8.0.`,
        tag: "pH Stability"
      },
      {
        question: `Is this preservative formaldeyde-free and paraben-free?`,
        answer: `Yes. All cosmetic preservatives listed on Ekora Bazaar are modern, consumer-safe, formaldehyde-free, and paraben-free formulations compliant with EU and Indian cosmetic standards.`,
        tag: "Regulatory Standards"
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
      answer: `We dispatch within 24 to 48 hours via premium express couriers (Bluedart, Delhivery, DTDC). Expected delivery is 4–6 days for metros and 6–8 days for regional destinations. Standard shipping is a flat ₹90 across India.`,
      tag: "Shipping"
    }
  ];
}

export function getWholesaleCategoryFaqs(categoryLabel: string): FaqItem[] {
  const norm = (categoryLabel || "").toLowerCase();

  if (norm.includes("wax") || norm.includes("candle")) {
    return [
      {
        question: `How do I buy wholesale candle waxes and additives on Ekora Bazaar?`,
        answer: `Browse our verified Indian wax suppliers above. Volume tiers (e.g. 1kg, 5kg slabs, and 25kg master cartons) with automatic wholesale pricing are clearly shown on every product page. Place your order online with instant ₹90 pan-India shipping and automatic GST input tax credit (ITC) invoices.`
      },
      {
        question: `What is the difference between container soy wax and pillar soy wax?`,
        answer: `Container soy wax has a lower melting point (48°C–52°C) designed to adhere smoothly to glass jars without shrinking away. Pillar soy wax or beeswax blends have a higher melting point (58°C–65°C) and contract upon cooling, allowing easy release from silicone and polycarbonate moulds.`
      },
      {
        question: `Are your wholesale waxes tested for paraffin and pesticide adulteration?`,
        answer: `Yes. All natural soy wax flakes and beeswax supplied through Ekora Bazaar undergo gas chromatography (GC-MS) verification to ensure 100% botanical/natural origin, zero paraffin blending, and zero toxic heavy metals.`
      },
      {
        question: `What are the minimum order quantities (MOQ) for bulk candle waxes?`,
        answer: `Standard catalog MOQs start as low as 1 unit (1kg trial slab) so small businesses can conduct test burns before scaling to 12+ or 52+ carton wholesale tiers with up to 20% discount.`
      },
      {
        question: `What is the shipping cost for heavy 25kg bulk wax cartons?`,
        answer: `Ekora Bazaar charges a flat delivery fee of only ₹90 per order across India, regardless of package weight or unit count, dispatched directly from our verified regional fulfillment centers.`
      }
    ];
  }

  if (norm.includes("soap") || norm.includes("base")) {
    return [
      {
        question: `What wholesale soap bases are available on Ekora Bazaar?`,
        answer: `We offer premium melt-and-pour bases including Ultra-Clear Glycerin, Goat Milk, Shea Butter, Aloe Vera, and African Black Soap bases. All bases are 100% SLS-free, SLES-free, and paraben-free.`
      },
      {
        question: `Do these melt-and-pour soap bases sweat in Indian humidity?`,
        answer: `Our soap bases are formulated with low-sweat vegetable glycerin balances. During high-humidity monsoon seasons, unmoulded bars should be shrink-wrapped within 45 minutes of cooling to lock in freshness and prevent moisture condensation.`
      },
      {
        question: `What fragrance and essential oil ratio can I add to melted soap base?`,
        answer: `The recommended fragrance load is 1% to 2% (approx. 10g to 20g per 1kg of soap base). Incorporate fragrance oils when the melted base has cooled down to 50°C–52°C to prevent aromatic evaporation.`
      },
      {
        question: `What are the wholesale volume tiers for soap manufacturers?`,
        answer: `Soap bases are available in 1kg blocks, 10kg cartons, and 50kg production batches with automatic volume tier discounts configured directly on the platform.`
      }
    ];
  }

  if (norm.includes("fragrance") || norm.includes("scent")) {
    return [
      {
        question: `Are all fragrance oils IFRA-certified with safe usage limits?`,
        answer: `Yes. 100% of fragrance oils listed on Ekora Bazaar adhere strictly to the International Fragrance Association (IFRA) 51st Amendment Standards. Batch IFRA certificates specifying maximum safe limits for candles (Category 12), body lotions (Category 5A), and soaps (Category 9) are available for immediate download.`
      },
      {
        question: `What is the difference between candle-grade and skin-safe fragrance oils?`,
        answer: `Candle-grade fragrance oils are optimized for high flash points and strong hot scent throw in molten wax. Skin-safe fragrances are dermatologically compliant for topical skin contact in lotions, lip balms, soaps, and body mists.`
      },
      {
        question: `How are bulk fragrance oils packed to prevent leaking during shipping?`,
        answer: `Concentrated fragrance oils are filled in chemical-resistant amber bottles and HDPE containers with induction-sealed caps and leak-proof tamper bands, packed in double-cushioned outer boxes.`
      },
      {
        question: `Can I buy trial samples before ordering 1 Liter or 5 Liter carboys?`,
        answer: `Yes. Scent samples are available in 30ml and 100ml trial sizes so perfumers and makers can evaluate cold and hot scent throws before ordering bulk wholesale quantities.`
      }
    ];
  }

  if (norm.includes("mould") || norm.includes("mold")) {
    return [
      {
        question: `What material are Ekora Bazaar wholesale moulds made from?`,
        answer: `Our moulds are precision-engineered from high-tear platinum and craft-grade silicone capable of withstanding temperatures from -40°C to 230°C. They feature mirror-smooth internal finishes for glossy, bubble-free demoulding.`
      },
      {
        question: `Are these moulds reusable for resin, Jesmonite, concrete, and candle wax?`,
        answer: `Yes. The durable silicone elasticity is multi-medium compatible. They can be reused for hundreds of casting cycles with epoxy resin, acrylic composites, soy wax, beeswax, and soap.`
      },
      {
        question: `How do I care for and store studio silicone moulds?`,
        answer: `Wash with warm soapy water after every casting cycle. Never use sharp metal tools or abrasive pads. Store flat in cool, dust-free containers away from direct UV sunlight to prevent silicone warping.`
      }
    ];
  }

  if (norm.includes("butter") || norm.includes("carrier oil") || norm.includes("essential")) {
    return [
      {
        question: `Are your wholesale botanical oils and butters unadulterated?`,
        answer: `Yes. We guarantee 100% purity with zero synthetic carrier oils, mineral oil, or synthetic fillers. Each production lot comes with verified Gas Chromatography (GC-MS) analysis and Certificate of Analysis (COA).`
      },
      {
        question: `What is the shelf life and proper storage condition?`,
        answer: `Most cold-pressed carrier oils and raw butters have a shelf life of 12 to 24 months when stored below 22°C in a dry, dark place. Nitrogen-flushed amber glass or HDPE packaging prevents photo-oxidation.`
      },
      {
        question: `What volume tiers are available for cosmetic brands?`,
        answer: `Oils are available from 100ml trial bottles up to 5 Liter and 25kg commercial drums with automated wholesale pricing tiers and GST invoices.`
      }
    ];
  }

  // General Wholesale Category Fallback
  return [
    {
      question: `How do I buy ${categoryLabel} in bulk on Ekora Bazaar?`,
      answer: `You can purchase ${categoryLabel} directly online through Ekora Bazaar. Browse our verified manufacturers above, review their automated wholesale tiers and minimum order quantities (MOQ), and checkout securely with flat ₹90 pan-India shipping.`
    },
    {
      question: `Are the suppliers and materials verified?`,
      answer: `Yes. Every supplier and batch on Ekora Bazaar undergoes strict verification. Chemical and formulation products include batch-specific Certificates of Analysis (COA) and Technical Data Sheets (TDS) for full commercial traceability.`
    },
    {
      question: `Can I get a GST Input Tax Credit (ITC) invoice?`,
      answer: `Yes. Valid B2B GST tax invoices with itemized HSN/SAC codes are generated automatically with every order. Enter your company GSTIN during checkout to receive your invoice instantly.`
    },
    {
      question: `What is the standard delivery timeframe across India?`,
      answer: `Wholesale orders dispatch within 24 to 48 hours from our fulfillment hub in Muzaffarpur, Bihar. Delivery typically takes 4–6 business days for metro locations and 6–8 days for regional destinations.`
    }
  ];
}

export function getToolFaqs(): FaqItem[] {
  return [
    {
      question: "What is the formula to calculate candle fragrance oil percentage?",
      answer:
        "The standard formula used by professional candlemakers is: Fragrance Oil Weight (grams) = Wax Weight (grams) × (Desired Fragrance Load % / 100). For example, for 500 grams of melted soy wax at an 8% fragrance load: 500 × 0.08 = 40 grams of fragrance oil."
    },
    {
      question: "What is the recommended fragrance load for 100% soy wax candles?",
      answer:
        "For 100% soy wax (such as Golden Wax 464 or pure soy flakes), the recommended fragrance load is between 6% and 10% (optimal hot throw is usually achieved at 8%–9%). Exceeding 10% may cause oil sweating, wick drowning, flame soot, or surface frosting."
    },
    {
      question: "At what temperature should fragrance oil be added to melted wax?",
      answer:
        "Heat soy wax to 80°C–85°C to break crystalline memory. Cool the wax to 70°C–75°C before adding fragrance oil. Stir gently and continuously for 2 full minutes to ensure thorough binding of aroma chemicals without burning off volatile top notes."
    },
    {
      question: "Why does fragrance oil flash point matter in candle making?",
      answer:
        "The flash point is the lowest temperature at which fragrance vapors can ignite in the presence of an open spark. Adding fragrance oil below its flash point (or keeping wax below 85°C) ensures safety and prevents delicate aromatic compounds from flashing off into the studio air."
    },
    {
      question: "How long should soy candles cure before testing hot scent throw?",
      answer:
        "Soy wax candles require a minimum of 7 to 14 days of curing at room temperature. Natural vegetable triglycerides need time to complete polymorphic crystal reorganization and fully trap fragrance oil molecules for maximum hot throw."
    }
  ];
}

export function getFormulationFaqs(title: string, excerpt: string): FaqItem[] {
  return [
    {
      question: `What is the recommended pH target for ${title}?`,
      answer: `For stable cosmetic performance, the ideal pH is between 5.0 and 5.5 for barrier and brightening serums, or 5.5 to 6.5 for hair vitality and rinse-off washes. Always test and adjust using a calibrated digital pH meter or high-accuracy test strips.`
    },
    {
      question: `Which broad-spectrum preservative is recommended for this water-containing recipe?`,
      answer: `Any aqueous cosmetic formulation requires broad-spectrum preservation against bacteria, yeast, and mold. We recommend 0.5%–1.0% Phenoxyethanol + Ethylhexylglycerin (Ases Preserve PHEHG) or Liquid Germall Plus, incorporated during the cool-down phase below 45°C.`
    },
    {
      question: `What is the expected shelf life of this finished formulation?`,
      answer: `When prepared under sanitized studio conditions with distilled water and an approved broad-spectrum preservative at proper pH, the typical shelf life is 12 to 18 months stored in airtight pump bottles below 25°C.`
    },
    {
      question: `Can this formulation recipe be scaled up for commercial batch manufacturing?`,
      answer: `Yes. All formulation percentages are calibrated to 100% batch weight. To scale from a 100g test sample to a 10kg or 50kg production run, multiply each ingredient weight proportionally while maintaining temperature controls and high-shear blending.`
    }
  ];
}

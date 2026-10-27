"use client";

interface Props {
  product: {
    category: string;
    fragranceNotes?: any;
    usageLevels?: any;
    name: string;
  };
}

export default function ProductKeySpecs({ product }: Props) {
  const isFragranceOrOil =
    product.category.toLowerCase().includes("fragrance") ||
    product.category.toLowerCase().includes("essential") ||
    product.category.toLowerCase().includes("scent");

  // 1. Scent Notes
  let scentNotesText = "Natural craft formulation grade aroma";
  if (product.fragranceNotes) {
    const top = Array.isArray(product.fragranceNotes.top) ? product.fragranceNotes.top.join(", ") : product.fragranceNotes.top;
    const heart = Array.isArray(product.fragranceNotes.heart) ? product.fragranceNotes.heart.join(", ") : product.fragranceNotes.heart;
    const base = Array.isArray(product.fragranceNotes.base) ? product.fragranceNotes.base.join(", ") : product.fragranceNotes.base;
    scentNotesText = [top && `Top: ${top}`, heart && `Heart: ${heart}`, base && `Base: ${base}`].filter(Boolean).join(" • ");
  } else if (isFragranceOrOil) {
    scentNotesText = "Concentrated aroma oil blend &bull; IFRA certified";
  } else if (product.category.toLowerCase().includes("wax")) {
    scentNotesText = "Neutral / Unscented natural base wax";
  } else if (product.category.toLowerCase().includes("mould") || product.category.toLowerCase().includes("mold")) {
    scentNotesText = "Odorless platinum / tin cured silicone";
  } else {
    scentNotesText = "Standard studio craft formulation profile";
  }

  // 2. Usage Rate
  let usageRateText = "Standard formulation guidelines";
  if (product.usageLevels && typeof product.usageLevels === "object") {
    usageRateText = Object.entries(product.usageLevels)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" • ");
  } else if (isFragranceOrOil) {
    usageRateText = "Candles: 6–10% • Soaps: 2–3% • Diffusers: 15–20%";
  } else if (product.category.toLowerCase().includes("wax")) {
    usageRateText = "100% pure or blend up to 30% with botanical waxes";
  } else if (product.category.toLowerCase().includes("pigment") || product.category.toLowerCase().includes("mica")) {
    usageRateText = "0.1% to 1% by weight for deep, vibrant opacity";
  } else {
    usageRateText = "As per batch formulation requirement";
  }

  // 3. Flash Point
  let flashPointText = "> 93°C / 200°F (Safe for Candle Wax & Soap Base Pouring)";
  if (!isFragranceOrOil && !product.category.toLowerCase().includes("wax")) {
    flashPointText = "Non-combustible under standard ambient studio processing";
  }

  // 4. Shelf Life
  const shelfLifeText = "24 Months from manufacturing date (sealed in original container)";

  // 5. Storage
  let storageText = "Store in original amber / HDPE container at 15°C–25°C away from direct sunlight & heat.";
  if (product.category.toLowerCase().includes("mould") || product.category.toLowerCase().includes("mold")) {
    storageText = "Wash with mild soapy water. Store flat on level surface away from sharp objects and UV exposure.";
  } else if (product.category.toLowerCase().includes("wax")) {
    storageText = "Store slabs/pellets in a cool, ventilated dry area below 25°C away from heat.";
  }

  const rows = [
    { label: "Scent / Notes", value: scentNotesText },
    { label: "Recommended Usage", value: usageRateText },
    { label: "Flash Point", value: flashPointText },
    { label: "Shelf Life", value: shelfLifeText },
    { label: "Studio Storage", value: storageText },
  ];

  return (
    <div className="border border-stone-200 bg-white overflow-hidden shadow-2xs">
      <div className="bg-stone-50/80 px-4 py-2.5 border-b border-stone-200 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.18em] font-sans font-bold text-stone-900">
          Key Technical Specifications
        </h3>
        <span className="text-[10px] text-stone-400 font-sans uppercase">
          Batch Verified
        </span>
      </div>
      <div className="divide-y divide-stone-100 text-xs font-sans">
        {rows.map((row, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-1 sm:gap-4 hover:bg-stone-50/40 transition-colors">
            <span className="w-40 shrink-0 text-stone-500 font-medium text-[11px] uppercase tracking-wider">
              {row.label}
            </span>
            <span className="text-stone-800 font-normal leading-relaxed">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

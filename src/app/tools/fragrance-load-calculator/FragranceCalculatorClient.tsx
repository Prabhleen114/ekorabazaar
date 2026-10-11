"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, AlertCircle, RefreshCw } from "lucide-react";

export default function FragranceCalculatorClient() {
  const [waxWeight, setWaxWeight] = useState<number>(500);
  const [percentage, setPercentage] = useState<number>(8);
  const [calculationMode, setCalculationMode] = useState<"addition" | "total">("addition");
  const [vesselSize, setVesselSize] = useState<number>(200);

  // Calculations
  let calculatedWax = waxWeight;
  let calculatedFragrance = 0;
  let totalBatch = 0;

  if (calculationMode === "addition") {
    // Standard maker addition: percentage of wax weight
    calculatedWax = Math.max(0, waxWeight);
    calculatedFragrance = Math.round((calculatedWax * (percentage / 100)) * 10) / 10;
    totalBatch = Math.round((calculatedWax + calculatedFragrance) * 10) / 10;
  } else {
    // Total candle target weight
    const totalTarget = Math.max(0, waxWeight);
    calculatedFragrance = Math.round((totalTarget * (percentage / 100)) * 10) / 10;
    calculatedWax = Math.round((totalTarget - calculatedFragrance) * 10) / 10;
    totalBatch = totalTarget;
  }

  const estimatedJars = vesselSize > 0 ? Math.floor((totalBatch / vesselSize) * 10) / 10 : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-mono font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Maker Studio Tool
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-charcoal mb-4">
          Candle Fragrance Load Calculator
        </h1>
        <p className="text-brand-charcoal/70 text-base md:text-lg max-w-2xl leading-relaxed">
          Accurately calculate grams of wax and fragrance oil for your candle making batches.
          Prevents wick clogging, oil sweating, and poor hot throw.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
        {/* Calculator Form */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-xs space-y-6">
          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-brand-charcoal/60 mb-2">
              Calculation Method
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setCalculationMode("addition")}
                className={`py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  calculationMode === "addition"
                    ? "bg-white text-brand-charcoal shadow-xs"
                    : "text-brand-charcoal/60 hover:text-brand-charcoal"
                }`}
              >
                Wax Addition (% of Wax)
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode("total")}
                className={`py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  calculationMode === "total"
                    ? "bg-white text-brand-charcoal shadow-xs"
                    : "text-brand-charcoal/60 hover:text-brand-charcoal"
                }`}
              >
                Net Total Batch Weight
              </button>
            </div>
            <p className="text-xs text-brand-charcoal/50 mt-1.5">
              {calculationMode === "addition"
                ? "Standard artisan method: Fragrance oil is calculated as a direct percentage of the solid wax flakes weight."
                : "Formulation method: You specify the total desired poured candle weight, and the tool calculates wax and fragrance fractions."}
            </p>
          </div>

          {/* Weight Input */}
          <div>
            <label className="block text-sm font-bold text-brand-charcoal mb-2">
              {calculationMode === "addition" ? "Wax Flakes Weight (Grams)" : "Total Target Batch Weight (Grams)"}
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="50000"
                step="10"
                value={waxWeight || ""}
                onChange={(e) => setWaxWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-brand-linen focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-hidden font-mono text-lg text-brand-charcoal font-semibold bg-stone-50/50"
              />
              <span className="absolute right-4 top-3.5 text-sm font-mono text-brand-charcoal/40">grams</span>
            </div>
          </div>

          {/* Fragrance Load Slider & Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-brand-charcoal">
                Fragrance Oil Percentage (%)
              </label>
              <span className="text-base font-mono font-bold text-brand-orange">{percentage}%</span>
            </div>

            <input
              type="range"
              min="3"
              max="14"
              step="0.5"
              value={percentage}
              onChange={(e) => setPercentage(parseFloat(e.target.value))}
              className="w-full accent-brand-orange h-2 bg-stone-200 rounded-lg cursor-pointer"
            />

            <div className="flex gap-2 mt-3 flex-wrap">
              {[6, 8, 10, 12].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPercentage(preset)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors border ${
                    percentage === preset
                      ? "bg-brand-orange text-white border-brand-orange"
                      : "bg-stone-50 text-brand-charcoal/70 border-brand-linen hover:bg-stone-100"
                  }`}
                >
                  {preset}% {preset === 6 ? "(Subtle / EO)" : preset === 8 ? "(Standard Soy)" : preset === 10 ? "(Maximum Soy)" : "(Heavy Paraffin)"}
                </button>
              ))}
            </div>
          </div>

          {/* Vessel Sizing */}
          <div>
            <label className="block text-sm font-bold text-brand-charcoal mb-2">
              Vessel / Jar Size (Optional - to estimate candle count)
            </label>
            <div className="relative">
              <input
                type="number"
                min="30"
                max="2000"
                step="10"
                value={vesselSize || ""}
                onChange={(e) => setVesselSize(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-brand-linen focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-hidden font-mono text-sm text-brand-charcoal bg-stone-50/50"
              />
              <span className="absolute right-4 top-3 text-sm font-mono text-brand-charcoal/40">g / jar</span>
            </div>
          </div>
        </div>

        {/* Calculation Output Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-brand-charcoal text-white p-6 md:p-8 rounded-3xl shadow-md space-y-6">
            <h2 className="text-lg font-mono uppercase tracking-wider text-brand-orange font-bold pb-4 border-b border-white/10">
              Batch Formulation Recipe
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs font-mono text-white/60 mb-1">Wax Required</p>
                <p className="text-2xl md:text-3xl font-bold font-mono text-white">{calculatedWax} g</p>
                <p className="text-[11px] text-white/50 mt-1">{(calculatedWax / 1000).toFixed(2)} kg</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs font-mono text-brand-orange mb-1">Fragrance Oil</p>
                <p className="text-2xl md:text-3xl font-bold font-mono text-brand-orange">{calculatedFragrance} g</p>
                <p className="text-[11px] text-white/50 mt-1">At {percentage}% load</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-white/60">Total Batch Weight</p>
                <p className="text-xl font-bold font-mono text-white">{totalBatch} g</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-white/60">Approx. Output</p>
                <p className="text-xl font-bold font-mono text-white">~{estimatedJars} candles</p>
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Usage Rate Guidelines
            </div>
            <p className="leading-relaxed">
              <strong>Soy Wax:</strong> 6% to 10% maximum. Higher than 10% frequently causes oil sweating and tunneling.<br />
              <strong>Paraffin Wax:</strong> 6% to 12% depending on melt point and grade.<br />
              <strong>Coconut Wax Blends:</strong> 8% to 12% maximum.<br />
              <strong>Pure Essential Oils:</strong> 6% to 8% maximum to prevent flash vaporization and flame smoking.
            </p>
          </div>
        </div>
      </div>

      {/* Internal SEO Hub Links */}
      <div className="mt-16 bg-white p-8 md:p-10 rounded-3xl border border-brand-linen">
        <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
          Learn More &amp; Source Batch Raw Materials
        </h2>
        <p className="text-brand-charcoal/70 text-sm mb-6 max-w-2xl leading-relaxed">
          Accurate fragrance calculations are the foundation of professional candle making. Explore our in-depth formulation tutorials and source verified wholesale ingredients directly from Indian manufacturers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/blog/fragrance-oil-usage-rates"
            className="group p-5 rounded-2xl bg-stone-50 border border-brand-linen hover:border-brand-orange/40 hover:bg-white transition-all"
          >
            <BookOpen className="w-5 h-5 text-brand-orange mb-2" />
            <h3 className="font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors text-sm mb-1">
              Fragrance Oil Usage Rates Guide
            </h3>
            <p className="text-xs text-brand-charcoal/60 line-clamp-2">
              Read how flash points, cure times, and wax crystal structures affect hot scent throw.
            </p>
          </Link>

          <Link
            href="/wholesale/candle-waxes-additives"
            className="group p-5 rounded-2xl bg-stone-50 border border-brand-linen hover:border-brand-orange/40 hover:bg-white transition-all"
          >
            <ArrowRight className="w-5 h-5 text-brand-orange mb-2" />
            <h3 className="font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors text-sm mb-1">
              Wholesale Candle Waxes &amp; Additives
            </h3>
            <p className="text-xs text-brand-charcoal/60 line-clamp-2">
              Source bulk soy wax, paraffin slabs, beeswax, vybar, and stearic acid at tiered B2B pricing.
            </p>
          </Link>

          <Link
            href="/wholesale/fragrance-oils"
            className="group p-5 rounded-2xl bg-stone-50 border border-brand-linen hover:border-brand-orange/40 hover:bg-white transition-all"
          >
            <ArrowRight className="w-5 h-5 text-brand-orange mb-2" />
            <h3 className="font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors text-sm mb-1">
              Wholesale Fragrance Oils
            </h3>
            <p className="text-xs text-brand-charcoal/60 line-clamp-2">
              High-flashpoint concentrated fragrance oils tested for clean burns and strong diffusion.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

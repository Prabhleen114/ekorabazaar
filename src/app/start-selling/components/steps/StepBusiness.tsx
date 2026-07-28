"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

const CATEGORIES = [
  "Candles", "Resin Art", "Crochet", "Pottery", "Jewellery",
  "Home Decor", "Paintings", "DIY Kits", "Fashion Accessories",
  "Customized Gifts", "Small Businesses", "Other",
];

export default function StepBusiness() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.brandName.trim()) e.brandName = "Brand Name is required";
    if (!data.instagram.trim()) e.instagram = "Instagram Username is required";
    if (!data.category) e.category = "Please select a category";
    if (!data.description.trim()) e.description = "Business Description is required";
    if (!data.yearsInBusiness) e.yearsInBusiness = "Years in Business is required";
    if (!data.monthlyOrders) e.monthlyOrders = "Monthly Orders is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) setCurrentStep(3); };

  const fieldCls = (key: string) =>
    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-brand-bg/50 transition-all " +
    (errors[key] ? "border-red-500 focus:ring-red-500" : "border-brand-linen focus:ring-brand-charcoal");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Business Information</h2>
        <p className="text-brand-charcoal/60">Tell us about your brand and what you create.</p>
      </div>

      <div className="space-y-5 bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="brandName" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Brand Name *</label>
            <input
              id="brandName" type="text" value={data.brandName}
              onChange={(e) => updateData({ brandName: e.target.value })}
              placeholder="e.g. Ekora Crafts" className={fieldCls("brandName")}
            />
            {errors.brandName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.brandName}</p>}
          </div>

          <div>
            <label htmlFor="instagram" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Instagram Username *</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-brand-charcoal/50">@</span>
              <input
                id="instagram" type="text" value={data.instagram}
                onChange={(e) => updateData({ instagram: e.target.value.replace("@", "") })}
                placeholder="yourbrand"
                className={"w-full pl-8 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-brand-bg/50 transition-all " +
                  (errors.instagram ? "border-red-500 focus:ring-red-500" : "border-brand-linen focus:ring-brand-charcoal")}
              />
            </div>
            {errors.instagram && <p className="text-red-500 text-xs mt-1 font-medium">{errors.instagram}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Business Category *</label>
          <select
            id="category" value={data.category}
            onChange={(e) => updateData({ category: e.target.value })}
            className={fieldCls("category") + " appearance-none"}
          >
            <option value="" disabled>Select a category</option>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1 font-medium">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Business Description *</label>
          <textarea
            id="description" rows={4} value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder="Tell us what you sell, your process, and what makes your products special..."
            className={fieldCls("description") + " resize-none"}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-semibold text-brand-charcoal mb-1.5">
            Website <span className="text-brand-charcoal/40 font-normal">(Optional)</span>
          </label>
          <input
            id="website" type="url" value={data.website}
            onChange={(e) => updateData({ website: e.target.value })}
            placeholder="https://yourwebsite.com"
            className="w-full px-4 py-3 rounded-xl border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-charcoal bg-brand-bg/50 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="yearsInBusiness" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Years in Business *</label>
            <select id="yearsInBusiness" value={data.yearsInBusiness}
              onChange={(e) => updateData({ yearsInBusiness: e.target.value })}
              className={fieldCls("yearsInBusiness") + " appearance-none"}
            >
              <option value="" disabled>Select</option>
              <option value="Less than 1 year">Less than 1 year</option>
              <option value="1-3 years">1–3 years</option>
              <option value="3-5 years">3–5 years</option>
              <option value="5+ years">5+ years</option>
            </select>
            {errors.yearsInBusiness && <p className="text-red-500 text-xs mt-1 font-medium">{errors.yearsInBusiness}</p>}
          </div>

          <div>
            <label htmlFor="monthlyOrders" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Average Monthly Orders *</label>
            <select id="monthlyOrders" value={data.monthlyOrders}
              onChange={(e) => updateData({ monthlyOrders: e.target.value })}
              className={fieldCls("monthlyOrders") + " appearance-none"}
            >
              <option value="" disabled>Select</option>
              <option value="0-50">0 – 50</option>
              <option value="51-200">51 – 200</option>
              <option value="201-500">201 – 500</option>
              <option value="500+">500+</option>
            </select>
            {errors.monthlyOrders && <p className="text-red-500 text-xs mt-1 font-medium">{errors.monthlyOrders}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(1)}
          className="flex items-center gap-2 px-6 py-4 text-brand-charcoal font-bold hover:bg-black/5 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={handleNext}
          className="flex items-center gap-2 px-8 py-4 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand-charcoal/20">
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

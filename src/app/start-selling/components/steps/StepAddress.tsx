"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState } from "react";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";

export default function StepAddress() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.address.trim()) e.address = "Address is required";
    if (!data.city.trim()) e.city = "City is required";
    if (!data.state.trim()) e.state = "State is required";
    if (!data.pinCode.trim() || !/^[0-9]{6}$/.test(data.pinCode))
      e.pinCode = "Valid 6-digit PIN Code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) setCurrentStep(4); };

  const fieldCls = (key: string) =>
    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-brand-bg/50 transition-all " +
    (errors[key] ? "border-red-500 focus:ring-red-500" : "border-brand-linen focus:ring-brand-charcoal");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Business Address</h2>
        <p className="text-brand-charcoal/60">Where do you operate your business from?</p>
      </div>

      <div className="space-y-5 bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <MapPin className="w-48 h-48" />
        </div>

        <div className="relative z-10 space-y-5">
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Business Address *</label>
            <input
              id="address" type="text" value={data.address}
              onChange={(e) => updateData({ address: e.target.value })}
              placeholder="Start typing your address..."
              className={fieldCls("address")}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address}</p>}
          </div>

          <div>
            <label htmlFor="landmark" className="block text-sm font-semibold text-brand-charcoal mb-1.5">
              Landmark <span className="text-brand-charcoal/40 font-normal">(Optional)</span>
            </label>
            <input
              id="landmark" type="text" value={data.landmark}
              onChange={(e) => updateData({ landmark: e.target.value })}
              placeholder="e.g. Near Apollo Hospital"
              className="w-full px-4 py-3 rounded-xl border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-charcoal bg-brand-bg/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-brand-charcoal mb-1.5">City *</label>
              <input id="city" type="text" value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
                placeholder="Mumbai" className={fieldCls("city")}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1 font-medium">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-semibold text-brand-charcoal mb-1.5">State *</label>
              <input id="state" type="text" value={data.state}
                onChange={(e) => updateData({ state: e.target.value })}
                placeholder="Maharashtra" className={fieldCls("state")}
              />
              {errors.state && <p className="text-red-500 text-xs mt-1 font-medium">{errors.state}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="pinCode" className="block text-sm font-semibold text-brand-charcoal mb-1.5">PIN Code *</label>
            <input
              id="pinCode" type="text" maxLength={6} value={data.pinCode}
              onChange={(e) => updateData({ pinCode: e.target.value.replace(/\D/g, "") })}
              placeholder="400001" className={fieldCls("pinCode")}
            />
            {errors.pinCode && <p className="text-red-500 text-xs mt-1 font-medium">{errors.pinCode}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(2)}
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

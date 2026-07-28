"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function StepPersonal() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.fullName.trim()) newErrors.fullName = "Full Name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim() || !emailRegex.test(data.email)) {
      newErrors.email = "Valid Email is required";
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!data.mobile.trim() || !phoneRegex.test(data.mobile)) {
      newErrors.mobile = "Valid 10-digit mobile number is required";
    }

    if (data.whatsapp && !phoneRegex.test(data.whatsapp)) {
      newErrors.whatsapp = "WhatsApp number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) setCurrentStep(2);
  };

  const fieldClass = (field: string) =>
    [
      "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-brand-bg/50 transition-all",
      errors[field]
        ? "border-red-500 focus:ring-red-500"
        : "border-brand-linen focus:ring-brand-charcoal",
    ].join(" ");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Personal Information</h2>
        <p className="text-brand-charcoal/60">Tell us a bit about yourself so we can get to know you better.</p>
      </div>

      <div className="space-y-5 bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm">
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Full Name *</label>
          <input
            id="fullName"
            type="text"
            value={data.fullName}
            onChange={(e) => updateData({ fullName: e.target.value })}
            placeholder="John Doe"
            className={fieldClass("fullName")}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Email Address *</label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="john@example.com"
            className={fieldClass("email")}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="mobile" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Mobile Number *</label>
            <input
              id="mobile"
              type="tel"
              maxLength={10}
              value={data.mobile}
              onChange={(e) => updateData({ mobile: e.target.value.replace(/\D/g, "") })}
              placeholder="9876543210"
              className={fieldClass("mobile")}
            />
            {errors.mobile && <p className="text-red-500 text-xs mt-1 font-medium">{errors.mobile}</p>}
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-semibold text-brand-charcoal mb-1.5">
              WhatsApp Number <span className="text-brand-charcoal/40 font-normal">(Optional)</span>
            </label>
            <input
              id="whatsapp"
              type="tel"
              maxLength={10}
              value={data.whatsapp}
              onChange={(e) => updateData({ whatsapp: e.target.value.replace(/\D/g, "") })}
              placeholder="9876543210"
              className={fieldClass("whatsapp")}
            />
            {errors.whatsapp && <p className="text-red-500 text-xs mt-1 font-medium">{errors.whatsapp}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-8 py-4 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand-charcoal/20"
        >
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

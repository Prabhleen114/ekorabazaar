"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { CheckCircle2, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function SuccessPage() {
  const { resetOnboarding } = useOnboarding();

  // Clear local storage on unmount (when leaving success page)
  useEffect(() => {
    return () => {
      resetOnboarding();
    };
  }, [resetOnboarding]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
      
      <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
        <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
      </div>

      <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal mb-4">
        Application Submitted Successfully 🎉
      </h1>
      
      <p className="text-lg text-brand-charcoal/60 max-w-xl mx-auto mb-10 leading-relaxed">
        Your creator application has been received and your account has been created. Once your application is approved, you can access your Seller Dashboard.
      </p>

      <div className="bg-white p-8 rounded-3xl border border-brand-linen shadow-sm max-w-lg w-full mb-10 text-left">
        <h3 className="font-bold text-brand-charcoal text-lg mb-4">What happens next?</h3>
        <ul className="space-y-4">
          {[
            "Our team will verify your identity and GST documents.",
            "We will review your catalogue and categorize your products.",
            "We will professionally create your Ekora storefront.",
            "Your products will be published within 24 hours after verification."
          ].map((item, idx) => (
            <li key={idx} className="flex gap-3 text-brand-charcoal/80">
              <span className="w-6 h-6 rounded-full bg-brand-charcoal/5 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-charcoal">{idx + 1}</span>
              <span className="mt-0.5">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="flex items-center gap-2 px-8 py-4 bg-white border border-brand-linen text-brand-charcoal rounded-xl font-bold hover:bg-black/5 transition-all shadow-sm"
        >
          <Home className="w-5 h-5" /> Return Home
        </Link>

        <Link 
          href="/login"
          className="flex items-center gap-2 px-8 py-4 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand-charcoal/20"
        >
          Creator Login
        </Link>
      </div>
    </div>
  );
}

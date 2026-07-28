"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function StepPayment() {
  const { data, setCurrentStep } = useOnboarding();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    if (!agreedTerms || !agreedPrivacy) {
      setError("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "creator_applications"), {
        ...data,
        status: "Payment Pending",
        applicationStage: "Submitted",
        createdAt: serverTimestamp(),
      });
      // Simulate payment gateway handoff delay (replace with Razorpay/Cashfree SDK call)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCurrentStep(10);
    } catch (err) {
      console.error(err);
      setError("Failed to submit application. Please try again.");
      setIsSubmitting(false);
    }
  };

  const checkboxBase =
    "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Final Step: Onboarding Fee</h2>
        <p className="text-brand-charcoal/60">Secure your spot as a Founding Creator.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm">
        {/* Pricing card */}
        <div className="bg-brand-charcoal text-white rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-white/20">
              Founding Creator Program
            </div>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-5xl font-bold font-serif">&#8377;199</span>
              <span className="text-xl text-white/50 line-through mb-1">&#8377;299</span>
            </div>
            <p className="text-white/80 font-medium mb-6">One-Time Onboarding Fee</p>
            <ul className="space-y-4">
              {[
                "Founding Creator Badge",
                "Priority Marketplace Visibility",
                "Dedicated Store Setup by Ekora",
                "Early Access Features",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-brand-orange flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className={checkboxBase + " " + (agreedTerms ? "bg-brand-charcoal border-brand-charcoal" : "border-brand-linen group-hover:border-brand-charcoal/40")}
              onClick={() => setAgreedTerms(!agreedTerms)}
            >
              {agreedTerms && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <span className="text-brand-charcoal/80 text-sm font-medium">
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-brand-orange hover:underline">Terms &amp; Conditions</a>{" "}
              of Ekora Bazaar.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className={checkboxBase + " " + (agreedPrivacy ? "bg-brand-charcoal border-brand-charcoal" : "border-brand-linen group-hover:border-brand-charcoal/40")}
              onClick={() => setAgreedPrivacy(!agreedPrivacy)}
            >
              {agreedPrivacy && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <span className="text-brand-charcoal/80 text-sm font-medium">
              I agree to the{" "}
              <a href="/privacy" target="_blank" className="text-brand-orange hover:underline">Privacy Policy</a>.
            </span>
          </label>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-4 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-brand-charcoal/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Processing...
            </>
          ) : (
            "Proceed to Payment"
          )}
        </button>
      </div>

      <div className="flex justify-start pt-4">
        <button
          onClick={() => setCurrentStep(8)}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-4 text-brand-charcoal font-bold hover:bg-black/5 rounded-xl transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Review
        </button>
      </div>
    </div>
  );
}

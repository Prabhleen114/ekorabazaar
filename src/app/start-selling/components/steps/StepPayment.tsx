"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { CONSENT_VERSION } from "@/lib/consentVersion";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";

export default function StepPayment() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [agreedMandatory, setAgreedMandatory] = useState(false);
  const [agreedMarketing, setAgreedMarketing] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { checkout, isProcessing: isRazorpayLoading } = useRazorpayCheckout();

  const handlePayment = async () => {
    setHasAttemptedSubmit(true);

    // Client-side gate — UX validation before the network call
    if (!data.password || data.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreedMandatory) {
      setError("Please agree to the mandatory legal terms to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      /**
       * The application is submitted through a server-side API route, NOT
       * directly to Firestore from the browser. The API route (/api/seller-application)
       * independently validates that:
       *   - legalConsent.mandatoryAccepted === true (boolean, not string)
       *   - legalConsent.version matches the current CONSENT_VERSION constant
       *   - legalConsent.marketingAccepted is a boolean
       *   - The server-side timestamp is set by the server, not trusted from client
       *
       * The client sends mandatoryConsented: true only because it has already
       * validated the checkbox locally. The server re-validates independently.
       */
      const response = await fetch("/api/seller-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          legalConsent: {
            version: CONSENT_VERSION,   // imported from single source of truth
            mandatoryAccepted: true,    // client confirmed; server will re-validate
            marketingAccepted: agreedMarketing,
            // timestamp is intentionally omitted — the server sets it
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed.");
      }

      // Step 2: Authenticate so we can create order
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password })
      });
      if (!loginRes.ok) throw new Error("Failed to authenticate for payment");

      // Step 3: Open Razorpay
      checkout({
        apiCreateRoute: "/api/seller/payment/create-order",
        apiVerifyRoute: "/api/seller/payment/verify",
        createPayload: {}, // No payload needed for onboarding fee
        name: "Ekora Bazaar Onboarding",
        description: "Founding Creator Fee",
        onSuccess: () => {
          setCurrentStep(10); // Success step
        },
        onError: (err) => {
          setError(err);
          setIsSubmitting(false);
        }
      });
      
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to submit application. Please try again.";
      setError(message);
      setIsSubmitting(false);
    }
  };

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

        {/* Account Creation Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold font-serif text-brand-charcoal mb-4">Create Your Account</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-charcoal mb-1.5">Email Address</label>
              <input
                type="email"
                value={data.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-brand-linen bg-brand-bg/50 text-brand-charcoal/60 cursor-not-allowed"
              />
              <p className="text-xs text-brand-charcoal/50 mt-1">This will be your login email.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-charcoal mb-1.5">Password *</label>
                <input
                  type="password"
                  value={data.password || ""}
                  onChange={(e) => updateData({ password: e.target.value })}
                  placeholder="Min 8 characters"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-brand-bg/50 transition-all ${
                    hasAttemptedSubmit && (!data.password || data.password.length < 8)
                      ? "border-red-500 focus:ring-red-500"
                      : "border-brand-linen focus:ring-brand-charcoal"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-charcoal mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  value={data.confirmPassword || ""}
                  onChange={(e) => updateData({ confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-brand-bg/50 transition-all ${
                    hasAttemptedSubmit && (data.password !== data.confirmPassword || !data.confirmPassword)
                      ? "border-red-500 focus:ring-red-500"
                      : "border-brand-linen focus:ring-brand-charcoal"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Legal Consent */}
        <div className="space-y-2 mb-8">
          <label
            className="flex items-start gap-3 cursor-pointer group min-h-[44px] p-2 -ml-2 rounded-xl hover:bg-brand-linen/30 transition-colors"
          >
            <div className="relative flex items-center justify-center pt-0.5">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={agreedMandatory}
                onChange={(e) => {
                  setAgreedMandatory(e.target.checked);
                  if (error) setError("");
                }}
                aria-invalid={hasAttemptedSubmit && !agreedMandatory}
                aria-describedby={hasAttemptedSubmit && !agreedMandatory ? "consent-error" : undefined}
              />
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                agreedMandatory
                  ? "bg-brand-charcoal border-brand-charcoal"
                  : (hasAttemptedSubmit && !agreedMandatory ? "border-red-500 bg-red-50" : "border-brand-linen peer-focus-visible:ring-2 peer-focus-visible:ring-brand-orange peer-focus-visible:ring-offset-2")
              }`}>
                {agreedMandatory && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </div>
            <span className={`text-sm font-medium pt-0.5 ${hasAttemptedSubmit && !agreedMandatory ? "text-red-600" : "text-brand-charcoal/80"}`}>
              I agree to Ekora Bazaar&apos;s{" "}
              <a href="/terms" target="_blank" className="text-brand-orange hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>Terms &amp; Conditions</a>{" "}
              and{" "}
              <a href="/seller-agreement" target="_blank" className="text-brand-orange hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>Seller Agreement</a>,{" "}
              and acknowledge the{" "}
              <a href="/privacy" target="_blank" className="text-brand-orange hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
            </span>
          </label>

          <label
            className="flex items-start gap-3 cursor-pointer group min-h-[44px] p-2 -ml-2 rounded-xl hover:bg-brand-linen/30 transition-colors"
          >
            <div className="relative flex items-center justify-center pt-0.5">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={agreedMarketing}
                onChange={(e) => setAgreedMarketing(e.target.checked)}
              />
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                agreedMarketing
                  ? "bg-brand-charcoal border-brand-charcoal"
                  : "border-brand-linen peer-focus-visible:ring-2 peer-focus-visible:ring-brand-orange peer-focus-visible:ring-offset-2"
              }`}>
                {agreedMarketing && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </div>
            <span className="text-brand-charcoal/80 text-sm font-medium pt-0.5">
              I&apos;d like to receive product updates, offers and marketing communications from Ekora Bazaar.{" "}
              <span className="text-brand-charcoal/50">(Optional)</span>
            </span>
          </label>
        </div>

        {error && (
          <div
            id="consent-error"
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
          >
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isSubmitting || isRazorpayLoading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-brand-charcoal/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting || isRazorpayLoading ? (
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

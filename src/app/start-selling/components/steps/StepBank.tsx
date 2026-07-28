"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Shield } from "lucide-react";

export default function StepBank() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.accountHolder.trim()) e.accountHolder = "Account Holder Name is required";
    if (!data.bankName.trim()) e.bankName = "Bank Name is required";
    if (!data.accountNumber.trim()) {
      e.accountNumber = "Account Number is required";
    } else if (!/^[0-9]{9,18}$/.test(data.accountNumber)) {
      e.accountNumber = "Invalid Account Number format";
    }
    if (data.accountNumber !== data.confirmAccountNumber)
      e.confirmAccountNumber = "Account Numbers do not match";
    if (!data.ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode))
      e.ifscCode = "Valid 11-character IFSC Code is required";
    if (data.upiId && !/^[\w.-]+@[\w.-]+$/.test(data.upiId))
      e.upiId = "Invalid UPI ID format";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) setCurrentStep(6); };

  const fieldCls = (key: string) =>
    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-brand-bg/50 transition-all " +
    (errors[key] ? "border-red-500 focus:ring-red-500" : "border-brand-linen focus:ring-brand-charcoal");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Bank Details</h2>
        <p className="text-brand-charcoal/60">Where should we send your payouts?</p>
      </div>

      <div className="space-y-5 bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex gap-3 mb-2">
          <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-emerald-800">Your banking information is encrypted and securely stored.</p>
        </div>

        <div>
          <label htmlFor="accountHolder" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Account Holder Name *</label>
          <input id="accountHolder" type="text" value={data.accountHolder}
            onChange={(e) => updateData({ accountHolder: e.target.value })}
            placeholder="As per bank records" className={fieldCls("accountHolder")} />
          {errors.accountHolder && <p className="text-red-500 text-xs mt-1 font-medium">{errors.accountHolder}</p>}
        </div>

        <div>
          <label htmlFor="bankName" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Bank Name *</label>
          <input id="bankName" type="text" value={data.bankName}
            onChange={(e) => updateData({ bankName: e.target.value })}
            placeholder="e.g. HDFC Bank" className={fieldCls("bankName")} />
          {errors.bankName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.bankName}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Account Number *</label>
            <input id="accountNumber" type="password" value={data.accountNumber}
              onChange={(e) => updateData({ accountNumber: e.target.value.replace(/\D/g, "") })}
              placeholder="••••••••••••" className={fieldCls("accountNumber")} />
            {errors.accountNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.accountNumber}</p>}
          </div>

          <div>
            <label htmlFor="confirmAccountNumber" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Confirm Account Number *</label>
            <input id="confirmAccountNumber" type="text" value={data.confirmAccountNumber}
              onChange={(e) => updateData({ confirmAccountNumber: e.target.value.replace(/\D/g, "") })}
              placeholder="Re-enter account number" className={fieldCls("confirmAccountNumber")} />
            {errors.confirmAccountNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmAccountNumber}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="ifscCode" className="block text-sm font-semibold text-brand-charcoal mb-1.5">IFSC Code *</label>
            <input id="ifscCode" type="text" maxLength={11} value={data.ifscCode}
              onChange={(e) => updateData({ ifscCode: e.target.value.toUpperCase() })}
              placeholder="HDFC0001234" className={fieldCls("ifscCode") + " uppercase"} />
            {errors.ifscCode && <p className="text-red-500 text-xs mt-1 font-medium">{errors.ifscCode}</p>}
          </div>

          <div>
            <label htmlFor="upiId" className="block text-sm font-semibold text-brand-charcoal mb-1.5">
              UPI ID <span className="text-brand-charcoal/40 font-normal">(Optional)</span>
            </label>
            <input id="upiId" type="text" value={data.upiId}
              onChange={(e) => updateData({ upiId: e.target.value.toLowerCase() })}
              placeholder="yourname@upi" className={fieldCls("upiId") + " lowercase"} />
            {errors.upiId && <p className="text-red-500 text-xs mt-1 font-medium">{errors.upiId}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(4)}
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

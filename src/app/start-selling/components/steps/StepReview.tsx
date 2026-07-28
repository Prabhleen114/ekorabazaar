"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { ArrowRight, ArrowLeft, Edit2, CheckCircle2 } from "lucide-react";

export default function StepReview() {
  const { data, setCurrentStep } = useOnboarding();

  const Section = ({
    title, step, children,
  }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="bg-white rounded-3xl border border-brand-linen p-6 md:p-8 shadow-sm">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-brand-linen/60">
        <h3 className="text-xl font-serif font-bold text-brand-charcoal">{title}</h3>
        <button
          onClick={() => setCurrentStep(step)}
          className="text-sm font-semibold text-brand-orange hover:text-brand-terracotta flex items-center gap-1 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
      <span className="text-sm font-medium text-brand-charcoal/50 mb-1 sm:mb-0">{label}</span>
      <span className="text-sm font-semibold text-brand-charcoal text-left sm:text-right">{value || "—"}</span>
    </div>
  );

  const StatusLabel = ({ isUploaded }: { isUploaded: boolean }) =>
    isUploaded ? (
      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
        <CheckCircle2 className="w-4 h-4" /> Uploaded
      </span>
    ) : (
      <span className="text-brand-charcoal/30">Not provided</span>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Review Application</h2>
        <p className="text-brand-charcoal/60">Double-check your information before proceeding to payment.</p>
      </div>

      <div className="space-y-5">
        <Section title="1. Personal Information" step={1}>
          <Row label="Full Name" value={data.fullName} />
          <Row label="Email Address" value={data.email} />
          <Row label="Mobile Number" value={data.mobile} />
          <Row label="WhatsApp" value={data.whatsapp} />
        </Section>

        <Section title="2. Business Information" step={2}>
          <Row label="Brand Name" value={data.brandName} />
          <Row label="Instagram" value={"@" + data.instagram} />
          <Row label="Category" value={data.category} />
          <Row label="Years in Business" value={data.yearsInBusiness} />
          <Row label="Monthly Orders" value={data.monthlyOrders} />
          <Row label="Website" value={data.website} />
        </Section>

        <Section title="3. Business Address" step={3}>
          <Row label="Address" value={data.address} />
          <Row label="Landmark" value={data.landmark} />
          <Row label="City & State" value={data.city + ", " + data.state} />
          <Row label="PIN Code" value={data.pinCode} />
        </Section>

        <Section title="4. GST Details" step={4}>
          <Row label="GST Registered" value={data.hasGST === "yes" ? "Yes" : "No"} />
          {data.hasGST === "yes" && (
            <>
              <Row label="GST Number" value={data.gstNumber} />
              <Row label="GST Certificate" value={<StatusLabel isUploaded={!!data.gstCertificateUrl} />} />
            </>
          )}
        </Section>

        <Section title="5. Bank Details" step={5}>
          <Row label="Account Holder" value={data.accountHolder} />
          <Row label="Bank Name" value={data.bankName} />
          <Row label="Account Number" value={"••••••••" + data.accountNumber.slice(-4)} />
          <Row label="IFSC Code" value={data.ifscCode} />
          <Row label="UPI ID" value={data.upiId} />
        </Section>

        <Section title="6. Identity Documents" step={6}>
          <Row label="PAN Card" value={<StatusLabel isUploaded={!!data.panCardUrl} />} />
          <Row label="Aadhaar Card" value={<StatusLabel isUploaded={!!data.aadhaarCardUrl} />} />
          <Row label="Business Logo" value={<StatusLabel isUploaded={!!data.businessLogoUrl} />} />
          <Row label="Profile Photo" value={<StatusLabel isUploaded={!!data.profilePhotoUrl} />} />
        </Section>

        <Section title="7. Catalogue Details" step={7}>
          <Row label="Catalogue File" value={<StatusLabel isUploaded={!!data.catalogueUrl} />} />
          <Row label="Drive Link" value={data.driveLink} />
          <Row label="Dropbox Link" value={data.dropboxLink} />
        </Section>
      </div>

      <div className="flex justify-between pt-4 pb-12">
        <button
          onClick={() => setCurrentStep(7)}
          className="flex items-center gap-2 px-6 py-4 text-brand-charcoal font-bold hover:bg-black/5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={() => setCurrentStep(9)}
          className="flex items-center gap-2 px-8 py-4 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand-charcoal/20"
        >
          Proceed to Payment <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Ekora Bazaar",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <div className="pt-32 pb-16 px-6 max-w-4xl mx-auto flex-1">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-brand-charcoal mb-8">Terms of Service</h1>
        <div className="prose prose-brand max-w-none text-brand-charcoal/80">
          <p className="mb-4">Last updated: August 2026</p>
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing and using Ekora Bazaar, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">2. Description of Service</h2>
          <p className="mb-4">Ekora Bazaar is a B2B and B2C marketplace for raw materials, craft supplies, and educational masterclasses. We reserve the right to modify or discontinue the service with or without notice.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">3. User Accounts</h2>
          <p className="mb-4">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">4. Orders and Pricing</h2>
          <p className="mb-4">All orders are subject to availability. Prices for our products are subject to change without notice. Wholesale pricing tiers are automatically applied based on volume.</p>
        </div>
      </div>
      <BuyerFooter />
    </main>
  );
}

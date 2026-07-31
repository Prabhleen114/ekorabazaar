import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Ekora Bazaar",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <div className="pt-32 pb-16 px-6 max-w-4xl mx-auto flex-1">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-brand-charcoal mb-8">Privacy Policy</h1>
        <div className="prose prose-brand max-w-none text-brand-charcoal/80">
          <p className="mb-4">Last updated: August 2026</p>
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We collect information you provide directly to us, such as when you create an account, place an order, or communicate with us. This may include your name, email address, shipping address, and payment information.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to process your transactions, communicate with you about your orders, and improve our services and platform experience.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">3. Data Security</h2>
          <p className="mb-4">We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        </div>
      </div>
      <BuyerFooter />
    </main>
  );
}

import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Ekora Bazaar",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      <div className="pt-32 pb-16 px-6 max-w-4xl mx-auto flex-1">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-brand-charcoal mb-8">Refund Policy</h1>
        <div className="prose prose-brand max-w-none text-brand-charcoal/80">
          <p className="mb-4">Last updated: August 2026</p>
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">1. Returns & Refunds</h2>
          <p className="mb-4">Due to the nature of raw materials and chemical supplies, we do not accept general returns once a product has been opened or used, to maintain batch integrity and safety standards.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">2. Damaged or Defective Items</h2>
          <p className="mb-4">If you receive a damaged or defective item, please contact our support team within 48 hours of delivery with photographic evidence. We will issue a replacement or refund upon verification.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">3. Class & Masterclass Refunds</h2>
          <p className="mb-4">Enrollment fees for classes and masterclasses are non-refundable once the course materials or kits have been dispatched or accessed. Cancellations made 7 days prior to the start of a live class may be eligible for a partial refund or credit.</p>
        </div>
      </div>
      <BuyerFooter />
    </main>
  );
}

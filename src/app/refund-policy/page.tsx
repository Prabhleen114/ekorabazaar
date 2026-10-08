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
      <div className="pt-32 pb-16 px-4 md:px-6 max-w-4xl mx-auto flex-1">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-brand-charcoal mb-8">Refund Policy</h1>
        <div className="prose prose-brand max-w-none text-brand-charcoal/80">
          <p className="mb-4">Last updated: August 2026</p>
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">1. Returns & Refunds</h2>
          <p className="mb-4">To maintain strict batch integrity and safety standards, <strong>we do not accept general returns or exchanges for wholesale or B2B raw material orders</strong> once dispatched.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">2. Damaged or Incorrect Items</h2>
          <p className="mb-4">If you receive an item that is damaged in transit or incorrect, please contact us within <strong>48 hours of delivery</strong> with a full unboxing video (no cuts). Without this video, we cannot process damage or shortage claims. We will promptly issue a free replacement or full refund upon verification.</p>
          
          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">3. Class & Masterclass Refunds</h2>
          <p className="mb-4">Enrollment fees for classes and masterclasses are non-refundable once the course materials or kits have been dispatched or accessed. Cancellations made 7 days prior to the start of a live class may be eligible for a partial refund or credit.</p>

          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">Contact Support</h2>
          <p className="mb-4">For any refund or replacement requests, please reach out to our dedicated support desk:</p>
          <ul className="list-disc pl-5 mb-4">
            <li><strong>Email:</strong> <a href="mailto:ekorabazaar@gmail.com" className="text-brand-orange hover:underline">ekorabazaar@gmail.com</a></li>
            <li><strong>WhatsApp / Phone:</strong> <a href="https://wa.me/919041500605" className="text-brand-orange hover:underline">+91 9041500605</a></li>
          </ul>
        </div>
      </div>
      <BuyerFooter />
    </main>
  );
}

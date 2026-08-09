import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Seller Agreement | Ekora Bazaar",
  description: "Read the Ekora Bazaar Seller Agreement.",
};

export default function SellerAgreementPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 min-h-[60vh]">
        <h1 className="text-4xl md:text-5xl font-bold font-serif mb-8 text-brand-charcoal">Seller Agreement</h1>
        
        <div className="bg-orange-50 border border-brand-orange/30 rounded-2xl p-8 flex items-start gap-4 shadow-sm">
          <AlertCircle className="w-6 h-6 text-brand-orange shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-brand-charcoal mb-2">Agreement Currently Under Review</h2>
            <p className="text-brand-charcoal/80 leading-relaxed mb-4">
              The official Ekora Bazaar Seller Agreement is currently being drafted by our legal team. It will outline the obligations, fee structures, and compliance requirements for all Founding Creators on our platform.
            </p>
            <p className="text-brand-charcoal/80 leading-relaxed">
              This page serves as a placeholder. Once the agreement is finalized, the full legal text will be published here. By submitting a seller application, you acknowledge that you will be required to formally accept the final Seller Agreement prior to your storefront going live.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

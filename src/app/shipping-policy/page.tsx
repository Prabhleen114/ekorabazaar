import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Shipping Policy | Ekora Bazaar",
  description: "Read the Ekora Bazaar shipping policy.",
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 min-h-[60vh]">
        <h1 className="text-4xl md:text-5xl font-bold font-serif mb-8 text-brand-charcoal">Shipping Policy</h1>
        
        <div className="bg-orange-50 border border-brand-orange/30 rounded-2xl p-8 flex items-start gap-4 shadow-sm">
          <AlertCircle className="w-6 h-6 text-brand-orange shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-brand-charcoal mb-2">Policy Currently Under Review</h2>
            <p className="text-brand-charcoal/80 leading-relaxed mb-4">
              Our shipping policy is currently being finalized by our legal and operations team to ensure we offer the best possible delivery experience for our customers.
            </p>
            <p className="text-brand-charcoal/80 leading-relaxed">
              Once approved, the official legal text will be published on this page. If you have immediate questions regarding shipping timelines or costs, please contact our support team.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

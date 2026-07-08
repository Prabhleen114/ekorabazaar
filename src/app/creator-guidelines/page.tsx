import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Creator Guidelines — Ekora",
  description: "Platform standards and catalog requirements for selling on Ekora.",
};

export default function CreatorGuidelinesPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl font-bold font-serif mb-8 text-left">Creator Guidelines</h1>
        
        <div className="prose prose-zinc max-w-none text-left space-y-6 text-brand-charcoal/70">
          <p className="text-sm font-semibold">Last Updated: July 2025</p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">1. Product Quality &amp; Authenticity</h2>
          <p>
            All products listed on Ekora must be handmade, designed, or finished by you or your small team. Reselling mass-produced commercial goods is strictly prohibited and will lead to account suspension.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">2. Listing &amp; Catalog Requirements</h2>
          <p>
            Product listings must include clear, high-resolution photographs representing the actual item. Descriptions should clearly state the size, weight, materials used, and estimated crafting time for custom custom-made orders.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">3. Customer Communication</h2>
          <p>
            While Ekora manages standard transactional messages and order status updates, creators should provide direct support for specific buyer customization requests. Direct communication should remain professional.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">4. Shipping &amp; Timelines</h2>
          <p>
            Creators must dispatch items within the preparation timeframe indicated on the product catalog page. Late shipments affect your visibility placement score in the search algorithm.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">5. Contact</h2>
          <p>
            To clarify specific listing questions, contact our onboarding support desk at <a href="mailto:techekora@gmail.com" className="underline text-brand-orange">techekora@gmail.com</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

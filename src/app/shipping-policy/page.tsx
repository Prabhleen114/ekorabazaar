import type { Metadata } from "next";`r`nimport BuyerNavbar from "@/components/BuyerNavbar";`r`nimport BuyerFooter from "@/components/BuyerFooter";

export const metadata: Metadata = {
  title: "Shipping Policy | Ekora Bazaar",
  description: "Read the Ekora Bazaar shipping policy. We offer flat-rate shipping across India for wholesale raw materials and craft supplies.",
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal flex flex-col">`r`n      <BuyerNavbar />`r`n      <div className="flex-1 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <h1 className="text-4xl md:text-5xl font-bold font-serif mb-8 text-brand-charcoal">Shipping Policy</h1>
        
        <div className="prose prose-orange max-w-none text-brand-charcoal/80">
          <p className="text-lg">
            At Ekora Bazaar, we strive to make sourcing wholesale raw materials and handmade products as seamless as possible. Our shipping policy is designed to be transparent and fair for small businesses and creators across India.
          </p>

          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">1. Flat-Rate Shipping</h2>
          <p>
            We currently apply a <strong>flat delivery charge of ₹90 per order</strong>. This rate applies regardless of the number of items in your cart, the total weight of your package, or your location within India. 
          </p>

          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">2. Processing & Dispatch Time</h2>
          <p>
            Orders are typically processed and dispatched within <strong>24 to 48 hours</strong> of payment confirmation. Our wholesale raw materials are shipped directly from our warehouse to ensure strict quality control and fast turnaround. Products ordered from independent creators may have specific preparation times listed on their respective product pages.
          </p>

          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">3. Delivery Timelines</h2>
          <p>
            Once dispatched, standard delivery within India generally takes <strong>2 to 5 business days</strong>, depending on your region and accessibility. You will receive tracking information via email or SMS as soon as your order leaves our facility.
          </p>

          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">4. Shipping Partners</h2>
          <p>
            We partner with reliable, national logistics providers to ensure your bulk supplies arrive safely. For particularly large wholesale orders (e.g., bulk waxes, heavy moulds), we use specialized freight carriers optimized for safe handling.
          </p>

          <h2 className="text-2xl font-semibold text-brand-charcoal mt-8 mb-4">5. International Shipping</h2>
          <p>
            At this time, Ekora Bazaar solely serves the Indian domestic market. We do not offer international shipping for our wholesale raw materials or retail products.
          </p>
        </div>
      </div>`r`n      </div>`r`n      <BuyerFooter />`r`n    </main>
  );
}

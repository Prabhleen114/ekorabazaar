import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — Ekora Bazaar",
  description:
    "Clear terms regarding refunds, replacements, and order cancellations for wholesale craft supplies and creator products on Ekora Bazaar.",
  alternates: {
    canonical: "/refund-policy",
  },
  openGraph: {
    title: "Refund & Cancellation Policy — Ekora Bazaar",
    description:
      "Clear terms regarding refunds, replacements, and order cancellations on Ekora Bazaar.",
    url: "https://www.ekorabazaar.in/refund-policy",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Refund & Cancellation Policy — Ekora Bazaar",
    description:
      "Clear terms regarding refunds, replacements, and order cancellations on Ekora Bazaar.",
  },
};

export default function RefundPolicyPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.ekorabazaar.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Refund & Cancellation Policy",
        item: "https://www.ekorabazaar.in/refund-policy",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl font-bold font-serif mb-8 text-left">Refund &amp; Cancellation Policy</h1>
        
        <div className="prose prose-zinc max-w-none text-left space-y-6 text-brand-charcoal/70">
          <p className="text-sm font-semibold">Last Updated: July 2025</p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">1. Onboarding Fee Refund</h2>
          <p>
            The ₹199 fee collected during onboarding is a one-time setup fee that covers administrative and catalog integration costs. This fee is non-refundable once store setup has initiated.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">2. Order Cancellations</h2>
          <p>
            Creators are expected to ship orders within the standard fulfillment window. Customers may cancel an order before it has been marked as shipped by the creator.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">3. Damaged or Faulty Items</h2>
          <p>
            If a customer receives an item damaged during transit, Ekora mediates the exchange process. Creators must package items securely in approved packing materials to ensure eligibility for delivery insurance.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">4. Dispute Resolution</h2>
          <p>
            Our dedicated team reviews disputes on a case-by-case basis. We strive to protect creator income while keeping customer satisfaction high.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">5. Contact</h2>
          <p>
            For disputes or support questions, email us at <a href="mailto:techekora@gmail.com" className="underline text-brand-orange">techekora@gmail.com</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

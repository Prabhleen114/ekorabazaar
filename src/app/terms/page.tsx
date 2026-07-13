import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Ekora Bazaar",
  description: "Terms and conditions for buyers and creators using the Ekora Bazaar platform.",
  alternates: {
    canonical: "https://www.ekorabazaar.in/terms",
  },
  openGraph: {
    title: "Terms of Service — Ekora Bazaar",
    description: "Terms and conditions for buyers and creators using the Ekora Bazaar platform.",
    url: "https://www.ekorabazaar.in/terms",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
      images: [
      {
        url: "https://www.ekorabazaar.in/og-image.jpg",
        secureUrl: "https://www.ekorabazaar.in/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ekora Bazaar — India's First Creator Commerce Platform",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service — Ekora Bazaar",
    description: "Terms and conditions for buyers and creators using the Ekora Bazaar platform.",
      images: ["https://www.ekorabazaar.in/og-image.jpg"],
  },
};

export default function TermsPage() {
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
        name: "Terms of Service",
        item: "https://www.ekorabazaar.in/terms",
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
      <div className="max-w-4xl mx-auto px-6 pt-24 md:pt-28 pb-16 md:pb-20">
        <h1 className="text-4xl font-bold font-serif mb-8 text-left">Terms of Service</h1>
        
        <div className="prose prose-zinc max-w-none text-left space-y-6 text-brand-charcoal/70">
          <p className="text-sm font-semibold">Last Updated: July 2025</p>
          
          <p>
            Welcome to Ekora Bazaar. By applying to become a Founding Creator or utilizing our storefront services, you agree to be bound by the following terms and conditions. Please read them carefully.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">1. Creator Qualifications</h2>
          <p>
            To register as a seller, you must operate an active social storefront (such as an Instagram page) producing handmade, artisanal, or creative custom products. Ekora reserves the right to approve or reject applications to maintain platform quality.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">2. Storefront Setup &amp; Onboarding</h2>
          <p>
            Approved creators receive store-setup assistance and are entitled to lifetime priority visibility. A one-time non-refundable onboarding fee of ₹199 is required to secure your place in the Founding Creator cohort.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">3. Fees and Payments</h2>
          <p>
            Ekora processes buyer payments through secure, encrypted gateways. Payouts are routed to the creator&apos;s registered bank account on a split escrow schedule (30% on shipment confirmation, 70% upon delivery confirmation).
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">4. Shipping &amp; Logistics</h2>
          <p>
            Creators are responsible for packing orders using approved materials and preparing items for our logistics partners. Shipping tracking details must be updated promptly within the platform dashboard.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">5. Contact Information</h2>
          <p>
            For any queries regarding these terms, please reach out to us at <a href="mailto:techekora@gmail.com" className="underline text-brand-orange">techekora@gmail.com</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

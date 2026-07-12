import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Ekora Bazaar",
  description: "How we collect, use, and protect your information at Ekora Bazaar.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy — Ekora Bazaar",
    description: "How we collect, use, and protect your information at Ekora Bazaar.",
    url: "https://www.ekorabazaar.in/privacy",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy — Ekora Bazaar",
    description: "How we collect, use, and protect your information at Ekora Bazaar.",
  },
};

export default function PrivacyPage() {
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
        name: "Privacy Policy",
        item: "https://www.ekorabazaar.in/privacy",
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
        <h1 className="text-4xl font-bold font-serif mb-8 text-left">Privacy Policy</h1>
        
        <div className="prose prose-zinc max-w-none text-left space-y-6 text-brand-charcoal/70">
          <p className="text-sm font-semibold">Last Updated: July 2025</p>
          
          <p>
            At Ekora, we value your trust. This Privacy Policy details how we handle the personal information you provide when applying to become a seller or using our services.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">1. Information We Collect</h2>
          <p>
            When you register, we collect details such as your name, email address, phone number, Instagram handle, and business description. We collect bank settlement details solely for processing payouts.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">2. How We Use Your Data</h2>
          <p>
            We use your information to coordinate store setup, handle order fulfillment notifications, verify payouts, communicate updates, and provide direct technical support.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">3. Security</h2>
          <p>
            All connection handshakes, logins, and transaction details are encrypted using industry-standard protocols. We do not sell or lease seller information to third parties.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">4. Updates</h2>
          <p>
            We may update this policy periodically. Any changes will be posted on this page with an updated modification date.
          </p>

          <h2 className="text-xl font-bold text-brand-charcoal font-serif pt-4">5. Contact us</h2>
          <p>
            For questions about our data security practices, please contact us at <a href="mailto:techekora@gmail.com" className="underline text-brand-orange">techekora@gmail.com</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

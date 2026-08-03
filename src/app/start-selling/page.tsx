import OnboardingContainer from "./OnboardingContainer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import serialize from "serialize-javascript";

export const metadata: Metadata = {
  title: "Start Selling | Creator Onboarding Portal | Ekora Bazaar",
  description:
    "Apply to become a Founding Creator on Ekora Bazaar. Complete your onboarding in minutes — share your details, upload your catalogue, and start selling.",
  alternates: {
    canonical: "https://www.ekorabazaar.in/start-selling",
  },
  openGraph: {
    title: "Start Selling on Ekora — Creator Onboarding Portal",
    description:
      "Apply to become a Founding Creator on Ekora Bazaar. Complete your onboarding in minutes.",
    url: "https://www.ekorabazaar.in/start-selling",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://www.ekorabazaar.in/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ekora Bazaar Creator Onboarding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Start Selling on Ekora — Creator Onboarding Portal",
    description: "Apply to become a Founding Creator on Ekora Bazaar.",
    images: ["https://www.ekorabazaar.in/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function StartSellingPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.ekorabazaar.in" },
      { "@type": "ListItem", position: 2, name: "Sell", item: "https://www.ekorabazaar.in/sell" },
      { "@type": "ListItem", position: 3, name: "Start Selling", item: "https://www.ekorabazaar.in/start-selling" },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(breadcrumbSchema, { isJSON: true }) }}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-28 pb-12 px-6 text-center border-b border-brand-linen bg-brand-bg">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight text-brand-charcoal mb-4">
            Creator Onboarding
          </h1>
          <p className="text-lg md:text-xl text-brand-charcoal/60 leading-relaxed">
            Apply to become a Founding Creator. Your progress is saved automatically.
          </p>
        </div>
      </section>

      {/* Main Onboarding Flow */}
      <OnboardingContainer />
      
      <Footer />
    </main>
  );
}

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import Transformation from "@/components/Transformation";
import PlatformPreview from "@/components/PlatformPreview";
import CategoriesPreview from "@/components/CategoriesPreview";
import WhyJoinEarly from "@/components/WhyJoinEarly";
import FounderStory from "@/components/FounderStory";
import MysteryCohort from "@/components/MysteryCohort";
import EarlyAccess from "@/components/EarlyAccess";
import Footer from "@/components/Footer";
import { getCreatorCount } from "@/lib/leads";
import type { Metadata } from "next";

export const revalidate = 0; // force dynamic rendering so fs count is live

export const metadata: Metadata = {
  title: "Sell on Ekora — India's Premier Creator Commerce Platform",
  description:
    "Turn your Instagram followers into buyers with zero hassle. Join verified creators selling unique handmade art, candles, resin, and home decor on Ekora.",
  keywords: [
    "sell handmade products India",
    "Instagram seller platform",
    "creator commerce India",
    "sell resin art online",
    "sell candles online India",
    "Ekora seller application",
  ],
  alternates: {
    canonical: "https://www.ekorabazaar.in/sell",
  },
  openGraph: {
    title: "Sell on Ekora — India's Premier Creator Commerce Platform",
    description:
      "Turn your Instagram followers into buyers with zero hassle. Join verified creators selling on Ekora.",
    url: "https://www.ekorabazaar.in/sell",
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
    title: "Sell on Ekora — India's Premier Creator Commerce Platform",
    description:
      "Turn your Instagram followers into buyers with zero hassle. Join verified creators selling on Ekora.",
      images: ["https://www.ekorabazaar.in/og-image.jpg"],
  },
};

export default function Home() {
  const creatorCount = getCreatorCount();

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
        name: "Sell on Ekora",
        item: "https://www.ekorabazaar.in/sell",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-brand-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Navbar />
      <Hero count={creatorCount} />
      <SocialProof />
      <Transformation />
      <PlatformPreview />
      <CategoriesPreview />
      <WhyJoinEarly />
      <FounderStory />
      <MysteryCohort count={creatorCount} />
      <EarlyAccess />
      <Footer />
    </main>
  );
}

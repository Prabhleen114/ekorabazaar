import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Platform — Interactive Storefront & Wholesale Flow | Ekora",
  description:
    "Explore the Ekora creator platform — trust signals, automated Instagram sync, sample kits, and wholesale-ready flows designed for independent sellers.",
  keywords: [
    "Ekora creator platform",
    "Instagram seller tools India",
    "wholesale creator storefront",
  ],
  alternates: {
    canonical: "https://www.ekorabazaar.in/sell/platform",
  },
  openGraph: {
    title: "Creator Platform — Interactive Storefront & Wholesale Flow | Ekora",
    description:
      "Explore the Ekora creator platform — trust signals, automated Instagram sync, sample kits, and wholesale-ready flows.",
    url: "https://www.ekorabazaar.in/sell/platform",
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
    title: "Creator Platform — Interactive Storefront & Wholesale Flow | Ekora",
    description:
      "Explore the Ekora creator platform — trust signals, automated Instagram sync, sample kits, and wholesale-ready flows.",
      images: ["https://www.ekorabazaar.in/og-image.jpg"],
  },
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      {
        "@type": "ListItem",
        position: 3,
        name: "Platform",
        item: "https://www.ekorabazaar.in/sell/platform",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}

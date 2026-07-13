import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Ekora — Building Commerce Infrastructure for Creators",
  description:
    "Our mission to build the commerce infrastructure that independent creators deserve — fair fees, instant storefronts, and reliable fulfillment.",
  keywords: [
    "why sell on Ekora",
    "creator infrastructure India",
    "Instagram creator marketplace advantages",
  ],
  alternates: {
    canonical: "https://www.ekorabazaar.in/sell/why-ekora",
  },
  openGraph: {
    title: "Why Ekora — Building Commerce Infrastructure for Creators",
    description:
      "Our mission to build the commerce infrastructure that independent creators deserve.",
    url: "https://www.ekorabazaar.in/sell/why-ekora",
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
    title: "Why Ekora — Building Commerce Infrastructure for Creators",
    description:
      "Our mission to build the commerce infrastructure that independent creators deserve.",
      images: ["https://www.ekorabazaar.in/og-image.jpg"],
  },
};

export default function WhyEkoraLayout({
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
        name: "Why Ekora",
        item: "https://www.ekorabazaar.in/sell/why-ekora",
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale Craft Supplies & Raw Materials Shop | Ekora Bazaar",
  description:
    "Shop premium batch-tested raw materials for candle making, resin art, perfumery, and soaps. Wholesale bulk discounts available for verified creators across India.",
  keywords: [
    "buy craft supplies wholesale",
    "candle raw materials shop",
    "resin art supplies online India",
    "soap making raw material wholesale",
    "Ekora shop",
  ],
  alternates: {
    canonical: "https://www.ekorabazaar.in/shop",
  },
  openGraph: {
    title: "Wholesale Craft Supplies & Raw Materials Shop | Ekora Bazaar",
    description:
      "Shop premium batch-tested raw materials for candle making, resin art, perfumery, and soaps.",
    url: "https://www.ekorabazaar.in/shop",
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
    title: "Wholesale Craft Supplies & Raw Materials Shop | Ekora Bazaar",
    description:
      "Shop premium batch-tested raw materials for candle making, resin art, perfumery, and soaps.",
      images: ["https://www.ekorabazaar.in/og-image.jpg"],
  },
};

export default function ShopLayout({
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
        name: "Shop",
        item: "https://www.ekorabazaar.in/shop",
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

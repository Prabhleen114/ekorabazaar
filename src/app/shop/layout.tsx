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
    canonical: "/shop",
  },
  openGraph: {
    title: "Wholesale Craft Supplies & Raw Materials Shop | Ekora Bazaar",
    description:
      "Shop premium batch-tested raw materials for candle making, resin art, perfumery, and soaps.",
    url: "https://www.ekorabazaar.in/shop",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wholesale Craft Supplies & Raw Materials Shop | Ekora Bazaar",
    description:
      "Shop premium batch-tested raw materials for candle making, resin art, perfumery, and soaps.",
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

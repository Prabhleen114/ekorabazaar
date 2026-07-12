import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply to Sell — Early Access Seller Application | Ekora",
  description:
    "Apply to become a verified seller on Ekora Bazaar. Setup your creator storefront in 2 minutes and start selling to buyers across India.",
  keywords: [
    "Ekora seller application",
    "apply to sell handmade products",
    "register as Instagram creator seller",
  ],
  alternates: {
    canonical: "/sell/start-selling",
  },
  openGraph: {
    title: "Apply to Sell — Early Access Seller Application | Ekora",
    description:
      "Apply to become a verified seller on Ekora Bazaar. Setup your creator storefront in 2 minutes.",
    url: "https://www.ekorabazaar.in/sell/start-selling",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apply to Sell — Early Access Seller Application | Ekora",
    description:
      "Apply to become a verified seller on Ekora Bazaar. Setup your creator storefront in 2 minutes.",
  },
};

export default function StartSellingLayout({
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
        name: "Start Selling",
        item: "https://www.ekorabazaar.in/sell/start-selling",
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

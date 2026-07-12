import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL("https://www.ekorabazaar.in"),
  title: {
    default: "Ekora — India's First Creator Commerce Platform",
    template: "%s | Ekora",
  },
  description:
    "Discover India's best Instagram creators in one place. Buy unique handmade products directly from verified creators — wholesale raw materials, batch-tested craft supplies, and unique creations.",
  keywords: [
    "creator marketplace",
    "Instagram sellers",
    "handmade products India",
    "creator commerce",
    "buy from Instagram creators",
    "wholesale craft supplies",
    "raw materials India",
    "candle making supplies",
    "soap base wholesale",
    "resin art materials",
    "Ekora Bazaar",
    "Ekora",
  ],
  authors: [{ name: "Ekora Bazaar", url: "https://www.ekorabazaar.in" }],
  creator: "Ekora Bazaar",
  publisher: "Ekora Bazaar",
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "https://www.ekorabazaar.in",
    },
  },
  openGraph: {
    title: "Ekora — India's First Creator Commerce Platform",
    description:
      "Discover India's best Instagram creators in one place. Buy unique handmade products and wholesale raw materials directly from verified creators.",
    url: "https://www.ekorabazaar.in",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ekora Bazaar — India's First Creator Commerce Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ekora — India's First Creator Commerce Platform",
    description: "Discover India's best Instagram creators. From Reels to Cart.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

import WhatsAppButton from "@/components/WhatsAppButton";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ekora Bazaar",
    url: "https://www.ekorabazaar.in",
    logo: "https://www.ekorabazaar.in/apple-touch-icon.png",
    description:
      "India's premier creator commerce platform and wholesale raw materials marketplace.",
    sameAs: [
      "https://www.instagram.com/ekorabazaar",
      "https://www.facebook.com/ekorabazaar",
      "https://www.linkedin.com/company/ekorabazaar",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ekora Bazaar",
    url: "https://www.ekorabazaar.in",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.ekorabazaar.in/shop?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Ekora Bazaar",
    image: "https://www.ekorabazaar.in/og-image.jpg",
    url: "https://www.ekorabazaar.in",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
    },
    priceRange: "₹₹",
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${newsreader.variable} font-sans antialiased bg-brand-bg text-brand-charcoal`}
      >
        {children}
        <WhatsAppButton />
        {process.env.NODE_ENV === "production" && (
          <GoogleAnalytics gaId="G-YTRDDR6JBB" />
        )}
        {process.env.NODE_ENV === "production" && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "xl8241neb6");
            `}
          </Script>
        )}
      </body>
    </html>
  );
}

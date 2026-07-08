import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
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
  title: "Ekora — India's First Creator Commerce Platform",
  description:
    "Discover India's best Instagram creators in one place. Buy unique handmade products directly from verified creators — no DMs, no hassle.",
  keywords: [
    "creator marketplace",
    "Instagram sellers",
    "handmade products India",
    "creator commerce",
    "buy from Instagram creators",
    "Ekora",
  ],
  authors: [{ name: "Ekora" }],
  openGraph: {
    title: "Ekora — India's First Creator Commerce Platform",
    description:
      "Discover India's best Instagram creators in one place. Buy unique handmade products directly from verified creators.",
    type: "website",
    locale: "en_IN",
    siteName: "Ekora",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ekora — India's First Creator Commerce Platform",
    description: "Discover India's best Instagram creators. From Reels to Cart.",
  },
};

import WhatsAppButton from "@/components/WhatsAppButton";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${newsreader.variable} font-sans antialiased bg-brand-bg text-brand-charcoal`}>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}

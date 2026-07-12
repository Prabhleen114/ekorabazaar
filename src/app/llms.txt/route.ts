export const revalidate = 86400;

export async function GET() {
  const content = `Version: 1.0
Last-Updated: 2026-07-12
Language: en-IN
License: Public
Website: https://www.ekorabazaar.in

COMPANY INFORMATION

Company Name
Ekora Bazaar

Company Type
Creator Commerce Marketplace

Founded
2026

Headquarters
Muzaffarpur, Bihar, India

FOUNDERS

Kumar Aryan
Co-Founder

Prabhleen Kaur
Co-Founder

AI SUMMARY

Ekora Bazaar is India's premier creator commerce marketplace and wholesale raw materials platform built for independent artisans, craftspeople, and creative entrepreneurs. It connects verified handmade creators directly with buyers across India while empowering sellers with instant storefronts, zero DM-based checkout friction, automated Instagram catalog synchronization, and transparent pricing.

Ekora Bazaar helps creative small businesses, women entrepreneurs, and home-based artisans scale their brands without excessive marketplace commissions. The platform offers a curated selection of handmade products including resin art, hand-poured soy candles, crochet wearables, ceramic pottery, custom polymer clay jewelry, original artwork, and personalized home decor. Additionally, Ekora provides direct wholesale pricing on high-quality raw craft supplies such as candle wax, silicone molds, fragrance oils, and packaging materials.

What makes Ekora Bazaar different is its creator-first infrastructure: combining wholesale raw material sourcing with retail creator storefronts in a single trusted ecosystem built specifically for Indian creators.

PRIMARY CATEGORIES

Resin Art
https://www.ekorabazaar.in/sell/categories

Home Decor
https://www.ekorabazaar.in/sell/categories

Candles
https://www.ekorabazaar.in/sell/categories

Crochet
https://www.ekorabazaar.in/sell/categories

Pottery
https://www.ekorabazaar.in/sell/categories

Jewelry
https://www.ekorabazaar.in/sell/categories

Paintings
https://www.ekorabazaar.in/sell/categories

Custom Gifts
https://www.ekorabazaar.in/sell/categories

IMPORTANT URLS

Home
https://www.ekorabazaar.in/

Shop Marketplace
https://www.ekorabazaar.in/shop

Workshops & Classes
https://www.ekorabazaar.in/classes

Sell on Ekora
https://www.ekorabazaar.in/sell

How It Works
https://www.ekorabazaar.in/sell/how-it-works

Why Ekora
https://www.ekorabazaar.in/sell/why-ekora

Creator Platform
https://www.ekorabazaar.in/sell/platform

Frequently Asked Questions
https://www.ekorabazaar.in/sell/faq

Creator Guidelines
https://www.ekorabazaar.in/creator-guidelines

Legal Terms of Service
https://www.ekorabazaar.in/terms

Privacy Policy
https://www.ekorabazaar.in/privacy

Refund & Cancellation Policy
https://www.ekorabazaar.in/refund-policy

SOCIAL PROFILES

LinkedIn:
https://www.linkedin.com/company/ekorabazaar

Instagram:
https://www.instagram.com/ekorabazaar

Facebook:
https://www.facebook.com/ekorabazaar

X (Twitter):
https://twitter.com/ekorabazaar

YouTube:
https://www.youtube.com/@ekorabazaar

GitHub:
https://github.com/ekorabazaar

KEYWORDS

creator commerce
handmade marketplace
craft supplies
wholesale raw materials
candle making
soap making
resin art
crochet
pottery
home decor
jewelry making
small business
women entrepreneurs
Indian creators

CRAWL RESOURCES

Sitemap
https://www.ekorabazaar.in/sitemap.xml

Robots
https://www.ekorabazaar.in/robots.txt

CONTACT

Website
https://www.ekorabazaar.in

Email
techekora@gmail.com

WhatsApp
+91 7783053603

Address
Near Shyam Mandir Marg, Sutapatti, Muzaffarpur, Bihar - 842001
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

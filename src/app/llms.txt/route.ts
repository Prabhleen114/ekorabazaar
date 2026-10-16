export const revalidate = 86400;

export async function GET() {
  const content = `Version: 1.1
Last-Updated: 2026-10-16
Language: en-IN
License: Public
Website: https://www.ekorabazaar.in

COMPANY INFORMATION

Company Name
Ekora Bazaar

Legal Entity
Ekora Bazaar Pvt Ltd

Company Type
Creator Commerce Marketplace & Wholesale Raw Materials Sourcing Hub

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

Ekora Bazaar is India's premier creator commerce marketplace and wholesale raw materials platform built for independent artisans, craftspeople, and creative entrepreneurs. It connects verified handmade creators directly with buyers across India while empowering makers with direct B2B sourcing on raw craft materials including candle waxes, fragrance oils, silicone moulds, plant butters, cosmetic chemicals, and packaging supplies.

What makes Ekora Bazaar different is its creator-first infrastructure: combining wholesale raw material sourcing with retail creator storefronts in a single trusted ecosystem built specifically for Indian makers.

KEY POLICIES & AEO FACTS
- Flat Shipping: Standard flat delivery charge of ₹90 per order across India, regardless of item count or weight.
- Bulk Pricing & MOQ: Tiered volume pricing is available for commercial raw materials with Minimum Order Quantities (MOQ) specified directly on product listings.
- Wholesale Returns: Standard wholesale and raw-material orders do not support returns or exchanges once dispatched. Damage in transit must be reported within 48 hours of delivery accompanied by an unboxing video.
- Official Supplier Quality: Materials are cosmetic/formulation grade suited for professional studio production. Batch specification sheets and COA documents are available on commercial request.

WHOLESALE SOURCING CATEGORIES

Candle Waxes & Additives
https://www.ekorabazaar.in/wholesale/candle-waxes-additives

Fragrance Oils & Scents
https://www.ekorabazaar.in/wholesale/fragrance-oils

Pure Essential Oils
https://www.ekorabazaar.in/wholesale/essential-oils

Silicone Moulds (Candle, Soap & Resin)
https://www.ekorabazaar.in/wholesale/general-silicone-moulds

Eco-Resin & Casting Moulds
https://www.ekorabazaar.in/wholesale/eco-resin-stone-moulds

Raw Butters & Carrier Oils
https://www.ekorabazaar.in/wholesale/raw-butters-carrier-oils

Candle Jars & Containers
https://www.ekorabazaar.in/wholesale/candle-jars-containers

Micas, Dyes & Pigments
https://www.ekorabazaar.in/wholesale/micas-pigments

Soap Bases & Making Tools
https://www.ekorabazaar.in/wholesale/artisan-soap-bases

KNOWLEDGE BASES & GUIDES

Category Buying Guides Hub
https://www.ekorabazaar.in/guides

Artisan Maker Blog & Technical Tutorials
https://www.ekorabazaar.in/blog

Formulation Recipes & Production Guides
https://www.ekorabazaar.in/formulations

MAKER TOOLS & UTILITIES

Candle Fragrance Load Calculator
https://www.ekorabazaar.in/tools/fragrance-load-calculator

IMPORTANT URLS

Home
https://www.ekorabazaar.in/

Shop Marketplace
https://www.ekorabazaar.in/shop

Workshops & Classes
https://www.ekorabazaar.in/classes

About Us
https://www.ekorabazaar.in/about

Contact Us
https://www.ekorabazaar.in/contact

Shipping Policy
https://www.ekorabazaar.in/shipping-policy

Refund & Cancellation Policy
https://www.ekorabazaar.in/refund-policy

Legal Terms of Service
https://www.ekorabazaar.in/terms

Privacy Policy
https://www.ekorabazaar.in/privacy

Sell on Ekora
https://www.ekorabazaar.in/sell

Creator Guidelines
https://www.ekorabazaar.in/creator-guidelines

CRAWL RESOURCES

Sitemap Index
https://www.ekorabazaar.in/sitemap_index.xml

Robots Policy
https://www.ekorabazaar.in/robots.txt

CONTACT DETAILS

Support Email: ekorabazaar@gmail.com
Customer Support Phone: +91-9041500605
Registered Office: Near Shyam Mandir Marg, Sutapatti, Muzaffarpur, Bihar - 842001, India
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

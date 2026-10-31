export const revalidate = 86400;

export async function GET() {
  const content = `# Ekora Bazaar
> India's premier B2B marketplace and wholesale raw materials sourcing hub for creative studios, candle artisans, cosmetic formulators, and independent makers.

Website: https://www.ekorabazaar.in
Legal Entity: Ekora Bazaar Pvt Ltd
Founders: Kumar Aryan & Prabhleen Kaur
Headquarters: Near Shyam Mandir Marg, Sutapatti, Muzaffarpur, Bihar - 842001, India
Support Email: ekorabazaar@gmail.com
Customer Support Phone: +91-9041500605
Founded: 2026
License: Public
Version: 1.2
Last-Updated: 2026-10-31

## Company Summary & Entity Identity
Ekora Bazaar is a B2B marketplace built for independent artisans, craft studios, and creative entrepreneurs across India. It provides direct B2B sourcing on wholesale raw materials—including candle waxes, IFRA-certified fragrance oils, precision silicone moulds, cold-pressed plant butters, cosmetic actives, and packaging supplies. Every commercial raw material order is fulfilled with batch lot traceability, valid GST tax invoices with Input Tax Credit (ITC), and professional technical documentation on request.

## Core Sourcing & Business Facts
- Flat Shipping: Standard flat delivery charge of ₹90 per order across India, regardless of item count or weight.
- Volume Pricing & MOQ: Tiered volume wholesale discounts are available with Minimum Order Quantities (MOQ) specified directly on product listings with no hidden quote gating.
- Return Policy: Standard wholesale and chemical/raw-material orders do not support returns or exchanges once dispatched to ensure batch purity. Transit damage claims must be reported within 48 hours accompanied by an unboxing video.
- Invoicing: GST tax invoice with 18% Input Tax Credit (ITC) compliance provided on every order.
- Documentation: Batch specification sheets, Certificates of Analysis (COA), and Technical Data Sheets (TDS) available on commercial request.

## Wholesale Sourcing Categories
- [Candle Waxes & Additives](https://www.ekorabazaar.in/wholesale/candle-waxes-additives): Bulk soy wax flakes, paraffin slabs, beeswax, vybar, and stearic acid.
- [Fragrance Oils](https://www.ekorabazaar.in/wholesale/fragrance-oils): High-flashpoint concentrated fragrance oils for candles, soaps, and diffusers.
- [Pure Essential Oils](https://www.ekorabazaar.in/wholesale/essential-oils): Pure steam-distilled essential oils for aromatherapy and natural formulation.
- [Precision Silicone Moulds](https://www.ekorabazaar.in/wholesale/general-silicone-moulds): Heat-resistant silicone moulds for candle pillars, soap bars, and resin casting.
- [Eco-Resin & Casting Moulds](https://www.ekorabazaar.in/wholesale/eco-resin-stone-moulds): Heavy-duty silicone moulds for Jesmonite, concrete, and eco-resin decor.
- [Raw Butters & Carrier Oils](https://www.ekorabazaar.in/wholesale/raw-butters-carrier-oils): Cold-pressed carrier oils, shea butter, cocoa butter, and cosmetic emollients.
- [Candle Jars & Containers](https://www.ekorabazaar.in/wholesale/candle-jars-containers): Amber jars, frosted vessels, metal tins, and diffuser bottles.
- [Micas & Pigments](https://www.ekorabazaar.in/wholesale/micas-pigments): Cosmetic-grade mica powders, candle dyes, and concrete colorants.
- [Artisan Soap Bases](https://www.ekorabazaar.in/wholesale/artisan-soap-bases): Melt & pour soap bases (goat milk, aloe vera, transparent, shea).
- [Cosmetic Preservatives & Chemicals](https://www.ekorabazaar.in/wholesale/cosmetic-preservatives-chemicals): Cosmetic actives, broad-spectrum preservatives, and emulsifiers.

## Knowledge Bases & Formulation Guides
- [Sourcing Guides Hub](https://www.ekorabazaar.in/guides): Comprehensive buying guides on testing, grading, and sourcing craft raw materials.
- [Formulations Library](https://www.ekorabazaar.in/formulations): Lab-tested formulation recipes, phase percentages, and production procedures for makers.
- [Artisan Maker Blog](https://www.ekorabazaar.in/blog): In-depth technical tutorials covering fragrance loads, burn testing, soap saponification, and mould care.
- [Candle Fragrance Load Calculator](https://www.ekorabazaar.in/tools/fragrance-load-calculator): Interactive tool to calculate exact grams of wax and fragrance oil for any vessel size or batch.

## Key Public URLs
- [Home](https://www.ekorabazaar.in/): Homepage with curated formulation essentials and discipline directory.
- [Shop Marketplace](https://www.ekorabazaar.in/shop): Searchable B2B catalog with department and category filtering.
- [Workshops & Classes](https://www.ekorabazaar.in/classes): Discovery kits and masterclasses for creative makers.
- [About Us](https://www.ekorabazaar.in/about): Mission, leadership team, and corporate information.
- [Contact Support](https://www.ekorabazaar.in/contact): Support contact details, email, and WhatsApp chat.
- [Shipping Policy](https://www.ekorabazaar.in/shipping-policy): Details on ₹90 flat shipping and 24-48h dispatch.
- [Refund Policy](https://www.ekorabazaar.in/refund-policy): B2B raw materials return terms and damage claims.
- [Terms of Service](https://www.ekorabazaar.in/terms): Platform usage and commercial purchasing terms.
- [Privacy Policy](https://www.ekorabazaar.in/privacy): Data handling and privacy compliance.
- [Sell on Ekora](https://www.ekorabazaar.in/sell): Supplier registration and seller marketplace onboarding.
- [Creator Guidelines](https://www.ekorabazaar.in/creator-guidelines): Standards and requirements for verified marketplace creators.
- [XML Sitemap Index](https://www.ekorabazaar.in/sitemap_index.xml): Complete machine-readable XML sitemap index.
- [Robots Policy](https://www.ekorabazaar.in/robots.txt): Search crawler and AI bot access policies.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

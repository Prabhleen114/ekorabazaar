export const revalidate = 86400;

export async function GET() {
  const content = `# Ekora Bazaar

> India's premier creator commerce platform and wholesale raw materials marketplace.

Ekora Bazaar connects independent creators, artisans, and craftspeople with buyers across India, while providing direct wholesale pricing on craft supplies including soy wax, resin, candle jars, fragrance oils, silicone molds, and packaging.

## Primary Categories

- [Resin Art](https://www.ekorabazaar.in/sell/categories): Custom resin trays, coasters, and preserved items
- [Home Decor](https://www.ekorabazaar.in/sell/categories): Wall art, macrame, and decorative interior pieces
- [Candles](https://www.ekorabazaar.in/sell/categories): Soy candles, beeswax pillars, and scented melts
- [Crochet](https://www.ekorabazaar.in/sell/categories): Amigurumi toys, wearables, and cozy accessories
- [Pottery](https://www.ekorabazaar.in/sell/categories): Hand-thrown ceramic mugs, bowls, and vases
- [Jewelry](https://www.ekorabazaar.in/sell/categories): Polymer clay earrings, beaded necklaces, and silver
- [Paintings](https://www.ekorabazaar.in/sell/categories): Original canvas, watercolor, and digital art prints
- [Custom Gifts](https://www.ekorabazaar.in/sell/categories): Personalized hampers and made-to-order gifts

## Important URLs

- [Home](https://www.ekorabazaar.in/): Main homepage and creator discovery
- [Shop Marketplace](https://www.ekorabazaar.in/shop): Explore handcrafted products and wholesale raw materials
- [Workshops & Classes](https://www.ekorabazaar.in/classes): Learn crafts and skills from expert artisans
- [Sell on Ekora](https://www.ekorabazaar.in/sell): Apply to become a verified seller on Ekora Bazaar
- [How It Works](https://www.ekorabazaar.in/sell/how-it-works): Storefront setup, zero DMs checkout, and fulfillment flow
- [Why Ekora](https://www.ekorabazaar.in/sell/why-ekora): Our mission to build commerce infrastructure for independent creators
- [Creator Platform](https://www.ekorabazaar.in/sell/platform): Automated Instagram sync, sample kits, and wholesale-ready flows
- [Frequently Asked Questions](https://www.ekorabazaar.in/sell/faq): Answers for creators and buyers
- [Creator Guidelines](https://www.ekorabazaar.in/creator-guidelines): Selling standards and catalog requirements

## Contact & Support

- Email: techekora@gmail.com
- Phone / WhatsApp: +91 7783053603
- Address: Near Shyam Mandir Marg, Sutapatti, Muzaffarpur, Bihar - 842001
- WhatsApp Direct: https://wa.me/917783053603

## Legal Policies

- [Privacy Policy](https://www.ekorabazaar.in/privacy): Information collection and protection terms
- [Terms of Service](https://www.ekorabazaar.in/terms): Terms and conditions for buyers and creators
- [Refund & Cancellation Policy](https://www.ekorabazaar.in/refund-policy): Refund and replacement guidelines

## Crawl & Sitemap Resources

- [Sitemap](https://www.ekorabazaar.in/sitemap.xml): Complete XML sitemap of all routes and products
- [Robots.txt](https://www.ekorabazaar.in/robots.txt): Crawler rules and sitemap reference
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

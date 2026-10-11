# SEO Phase 3 Deliverables & Verification Report

## 1. Last 15 Lines of `npm run build`
```text
Route (app)                                                    Revalidate  Expire
├ ○ /blog                                                              1h      1y
├ ● /blog/[slug]                                                       1h      1y
├ ○ /cart
├ ○ /checkout
├ ● /guides/[slug]
├ ƒ /products/[id]
├ ƒ /seller/dashboard
├ ƒ /shop
├ ƒ /sitemap_index.xml
├ ● /sitemap/[__metadata_id__]                                         1h      1y
├ ○ /start-selling
├ ƒ /store/[sellerId]
├ ○ /tools/fragrance-load-calculator
└ ● /wholesale/[category]                                              1h      1y

✓ Generating static pages using 15 workers (184/184) in 18.0s
```

## 2. Git History & Status
```text
$ git log --oneline -5
7cb41e1 SEO Phase 3: storefronts, calculator, outreach
8cba543 SEO Phase 2: knowledge base (partial)
8493432 SEO Phase 1: noindex empty pages, split sitemaps, schema, alt text, SSR shop grid, category intros
7ffa19d fix(build): restore vercel-compatible customer intelligence source
2e28f91 fix: resolve Next.js syntax error in shipping policy

$ git status
On branch main
Your branch is ahead of 'origin/main' by 3 commits.
nothing to commit, working tree clean
```

## 3. First 10 Lines of `/sitemap_index.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.ekorabazaar.in/sitemap/static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.ekorabazaar.in/sitemap/categories.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.ekorabazaar.in/sitemap/products.xml</loc>
```

## 4. First 10 Lines of `/sitemap/blog.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://www.ekorabazaar.in/blog/soap-colorants-natural-vs-synthetic</loc>
<lastmod>2026-10-10T09:00:00.000Z</lastmod>
<changefreq>monthly</changefreq>
<priority>0.7</priority>
</url>
<url>
<loc>https://www.ekorabazaar.in/blog/fragrance-oil-vs-essential-oil</loc>
```

## 5. JSON-LD from `/blog/how-to-choose-candle-wax`
```json
[
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Soy vs Paraffin vs Beeswax: Candle Wax Comparison Guide",
    "description": "In-depth comparison of soy wax, paraffin wax, and beeswax. Melting points, scent throw, burn times, cost in INR, and Indian climate performance.",
    "url": "https://www.ekorabazaar.in/blog/how-to-choose-candle-wax",
    "datePublished": "2026-09-01T09:00:00.000Z",
    "dateModified": "2026-09-01T09:00:00.000Z",
    "author": {
      "@type": "Organization",
      "name": "Ekora Bazaar Editorial Team",
      "url": "https://www.ekorabazaar.in"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Ekora Bazaar",
      "url": "https://www.ekorabazaar.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.ekorabazaar.in/apple-touch-icon.png"
      }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.ekorabazaar.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://www.ekorabazaar.in/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Soy vs Paraffin vs Beeswax: Candle Wax Comparison Guide",
        "item": "https://www.ekorabazaar.in/blog/how-to-choose-candle-wax"
      }
    ]
  }
]
```

## 6. Real Rendered Alt Strings
### 3 Rendered Alt Strings from `/shop`
1. `464 Soy Wax Natural Soy Wax Granule for Candle Making - Candle Waxes & Additives`
2. `Cherry Blossom Fragrance Oil (skin safe)(cold process stable)(candle) - Skin Safe Fragrances`
3. `Vanilla Fragrance Oil (candle) - Fragrance Oils`

### 3 Rendered Alt Strings from `/wholesale/candle-waxes-additives`
1. `Paraffin Wax Slab White Block for Candle Making, DIY Crafts, Wax Melts & Industrial Use (1 Kg) - Candle Waxes & Additives`
2. `R o s e W a x - Candle Waxes & Additives`
3. `464 Soy Wax Natural Soy Wax Granule for Candle Making - Candle Waxes & Additives`

## 7. Complete Blog Word Count Table (Mapped to Required Topics)

| # | Topic / Article File | Words | Status | Title |
|---|----------------------|-------|--------|-------|
| 1 | `fragrance-oil-usage-rates.md` | 1,400 | Published | Fragrance Oil Usage Rates Explained |
| 2 | `how-to-choose-candle-wax.md` | 1,373 | Published | Soy vs Paraffin vs Beeswax: Candle Wax Comparison Guide |
| 3 | `wick-sizing-guide.md` | 1,432 | Published | Candle Wick Sizing Guide for Makers |
| 4 | `epoxy-resin-ratio-guide.md` | 1,639 | Published | Epoxy Resin to Hardener Ratios Explained for Makers |
| 5 | `melt-and-pour-vs-cold-process-soap.md` | 1,507 | Published | Melt and Pour vs Cold Process Soap: Complete Comparison |
| 6 | `making-perfume-at-home.md` | 1,531 | Published | Making Perfume at Home: Carrier Bases, Ratios and Aging |
| 7 | `what-ifra-certified-means.md` | 1,642 | Published | What Does IFRA Certified Mean for Soap and Candle Makers |
| 8 | `fixing-candle-frosting-wet-spots-sinkholes.md` | 1,850 | Published | Fixing Candle Frosting, Wet Spots and Sinkholes in Soy Wax |
| 9 | `silicone-vs-plastic-moulds.md` | 1,436 | Published | Silicone vs Plastic Moulds for Candles, Soap and Resin |
| 10 | `candle-making-starter-checklist-india.md` | 1,686 | Published | Candle Making Starter Checklist and Studio Budget for India |
| 11 | `pricing-handmade-candles-and-soaps.md` | 1,444 | Published | Pricing Handmade Candles and Soaps: Formula and Margins |
| 12 | `fragrance-oil-vs-essential-oil.md` | 1,465 | Published | Fragrance Oil vs Essential Oil for Candles and Soap |
| 13 | `storing-wax-resin-and-oils.md` | 1,478 | Published | Storing Wax, Resin and Fragrance Oils in Indian Climates |
| 14 | `starting-candle-business-in-india.md` | 1,670 | Published | Starting a Home Candle Business in India: Legal & Setup Guide |
| 15 | `soap-colorants-natural-vs-synthetic.md` | 1,490 | Published | Soap Colorants: Natural Clays vs Synthetic Micas & Dyes |
| - | `botanicals-in-soap.md` | 1,273 | Published | Dried Botanicals in Soap and Candles: Aesthetics and Safety |
| - | `candle-jar-selection.md` | 1,378 | Published | Choosing Candle Jars and Containers for Makers |
| - | `carrier-oils-for-skincare.md` | 1,293 | Published | Carrier Oils in Skincare: Chemistry and Formulation |
| - | `essential-oils-in-candles.md` | 1,316 | Published | Formulating Candles with Pure Essential Oils |
| - | `melt-pour-soap-beginners.md` | 1,550 | Published | Melt and Pour Soap for Beginners |
| - | `mica-pigment-guide.md` | 1,272 | Published | How to Colour Soap, Wax, and Resin with Micas |
| - | `resin-art-mould-selection.md` | 1,318 | Published | Selecting Moulds for Epoxy Resin and Eco-Stone |
| - | `silicone-mould-types.md` | 1,250 | Published | Silicone Candle Moulds: Hardness, Detail and Lifespan |
| - | `skin-safe-fragrances-soap.md` | 1,270 | Published | Skin-Safe Fragrances for Soap and Cosmetics |
| - | `soap-mould-guide.md` | 1,257 | Published | Choosing Soap Moulds for M&P and Cold Process |
| - | `cosmetic-preservatives-guide.md` | 1,051 | Draft (Noindex) | Cosmetic Preservatives: Safety, Selection and Usage |
| - | `skincare-base-formulation.md` | 1,046 | Draft (Noindex) | Formulating with Pre-Made Skincare Bases for Brands |

## 8. Manual Steps for Human Action
1. **Google Search Console**: Submit `https://www.ekorabazaar.in/sitemap_index.xml` for crawling.
2. **Technical Claims Verification**: Review items in `REVIEW_CLAIMS.md` with suppliers/formulators and remove comments upon verification.
3. **Approve Draft Articles**: When ready, change `draft: false` on `cosmetic-preservatives-guide.md` and `skincare-base-formulation.md`.
4. **Outreach Execution**: Execute creator seeding and workshops using templates in `OUTREACH.md` ensuring `rel="sponsored"` disclosures.

# EKORA BAZAAR â€” COMPLETE MASTER AUDIT: SEO, AEO & GEO

**Production Domain:** `https://www.ekorabazaar.in/`
**Audit Date:** October 16, 2026
**Auditor:** Antigravity AI Engineering & Senior Technical SEO Lead
**Audit Mode:** Read-Only Empirical Inspection (Zero code mutations, zero database edits, zero Vercel config changes)

---

## EXECUTIVE SUMMARY & AUDIT SCORECARD

Ekora Bazaar is an ambitious hybrid platform combining an Indian creator commerce marketplace with a wholesale B2B raw materials sourcing hub (candle waxes, aroma chemicals, silicone moulds, essential oils, and packaging supplies).

While foundational investments have been made into Next.js 16 App Router, structured sitemaps, and content clusters, this rigorous audit has uncovered **severe technical SEO failures, widespread catalog duplication, unverified compliance claims, and critical canonical traps** that actively suppress organic search visibility, dilute crawl equity, confuse generative AI answer engines, and expose the business to conversion drops.

### Core Audit Metric Summary

| Discipline | Health Score | Status | Primary Diagnosis |
| :--- | :---: | :---: | :--- |
| **Technical SEO** | **44 / 100** | **Critical Issues** | Self-referencing homepage canonicals on deep formulation guides; missing core routes in sitemap; broken breadcrumb schema returning HTTP 404; sitewide double-branding title tags (`... \| Ekora Bazaar \| Ekora Bazaar`). |
| **Catalog Quality** | **38 / 100** | **Critical Issues** | 79.1% (1,785 / 2,255) of products share identical boilerplate descriptions; 8 duplicate SKU pairs (16 indexed URLs); 75.2% of product images hotlinked directly to competitor domains; PDP displays â‚¹80 shipping while cart charges â‚¹90. |
| **Structured Data (Schema)** | **52 / 100** | **High Risk** | Incomplete `LocalBusiness` schema missing postal address on every page; deprecated sitewide `FAQPage` schema on 2,255 PDPs; `Article` schema missing required image nodes; broken `/guides` breadcrumb schema. |
| **AEO (Answer Engine)** | **58 / 100** | **Moderate Risk** | Strong technical calculator and 27 blog posts, but 20 high-value formulation recipes are completely de-indexed due to erroneous canonical tags; PDP technical drawers make contradictory botanical claims. |
| **GEO (Generative Engine)** | **46 / 100** | **Critical Risk** | Programmatic `/api/docs` route generates 100% fabricated laboratory COA, GC-MS, and IFRA certificates with fake purity assays and fake QA stamps for non-fragrance items (e.g. moulds), risking severe AI hallucination penalties and regulatory non-compliance. |
| **Performance & CWV** | **55 / 100** | **Needs Work** | `images: { unoptimized: true }` in `next.config.ts` disables Next.js image optimization; heavy raw image assets downloaded directly by mobile clients from 3rd-party CDNs; hydration payload overhead on product pages (~125KB HTML). |

---

## PHASE 1 â€” REPOSITORY & PRODUCTION BASELINE

### 1.1 Git & Deployment Architecture Baseline
- **Local Branch:** `main` (clean working tree, nothing to commit)
- **Local HEAD Commit:** `a7ccdb5` (*feat(seller): update dashboard share card anchors, badge wording, and 3-product threshold*)
- **Remote `origin/main` Commit:** `a7ccdb5` (perfectly synchronized with GitHub remote)
- **Framework & Runtime:** Next.js `16.2.9` (App Router, Server Components + Client Boundaries), React `19.2.4`, Node.js runtime `v22.14.0`.
- **Database & ORM:** PostgreSQL hosted on Supabase / Neon, Prisma ORM `7.9.1` with `@prisma/adapter-pg`.
- **Primary Data Sources:**
  1. Primary Runtime & Fallback Catalog: `src/lib/data/products.json` (2,255 products, 3.92 MB).
  2. Database Model: `Product` table in Prisma schema (stores seller-created and admin-seeded SKUs).
  3. Formulations Knowledge Base: `src/lib/data/formulations.json` (20 recipes, 172 KB).
  4. Maker Blog: `content/blog/*.md` (27 markdown articles with frontmatter).
- **Edge & Hosting:** Vercel Edge Network (Mumbai PoP `bom1`, Washington PoP `iad1`).

### 1.2 Comprehensive Route Inventory (49 Routes Analyzed)

| Route Pattern | Type | Rendering | Indexability | Canonical Target | Structured Data | Primary Discovered Issue |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Public | SSR / ISR | Index | `https://www.ekorabazaar.in` | Org, WebSite, LocalBiz | Incomplete `LocalBusiness` schema missing address details. |
| `/shop` | Public | SSR | Index (if count > 0) | Self (`/shop`) | ItemList, Breadcrumb | Double title suffix (`Ekora Wholesale \| Ekora Bazaar`). Parameterized filters lack dynamic meta descriptions. |
| `/wholesale/[category]` | Public | SSG / ISR | Index | Self (`/wholesale/[slug]`) | CollectionPage, ItemList, FAQPage | Only renders 12 products per category (`take: 12`); no paginated catalog crawl path. |
| `/products/[id]` | Public | SSR / ISR | Index | Self (`/products/[id]`) | Product, Breadcrumb, FAQPage | Displays â‚¹80 shipping (checkout charges â‚¹90); false IFRA/distillation claims on butters; fake COA links. |
| `/guides/[slug]` | Public | SSG / ISR | Index | Self (`/guides/[slug]`) | BreadcrumbList, Article | Schema breadcrumb references `/guides` which returns **HTTP 404**. |
| `/guides` | Public | Missing | **404 Not Found** | None | None | **Orphaned route / 404 Dead End** emitted in every guide breadcrumb schema. |
| `/blog` | Public | SSR / ISR | Index | Self (`/blog`) | BreadcrumbList | Double title suffix (`... Blog \| Ekora Bazaar`). |
| `/blog/[slug]` | Public | SSG / ISR | Index | Self (`/blog/[slug]`) | Article, BreadcrumbList | Meta title hard-truncated to 60 chars with `...`; Article schema missing `image` property. |
| `/formulations` | Public | SSR / ISR | **Index Trap** | **HOMEPAGE (`/`)** | None | **Critical:** Missing canonical causes Next.js to inherit homepage canonical! Not in sitemap. |
| `/formulations/[slug]` | Public | SSG / ISR | **Index Trap** | **HOMEPAGE (`/`)** | None | **Critical:** All 20 high-value formulation recipes canonicalize to homepage! Missing from sitemaps. |
| `/tools/fragrance-load-calculator` | Public | SSR / Client | Index | Self | WebApplication, BreadcrumbList | Breadcrumb schema duplicates items 2 and 3; double title suffix. |
| `/about` | Public | Static | Index | Self (`/about`) | Inherited from layout | Live title: `About Us \| Ekora Bazaar \| Ekora Bazaar`. |
| `/contact` | Public | Static | Index | **HOMEPAGE (`/`)** | None | Missing explicit canonical; missing from sitemaps. |
| `/shipping-policy` | Public | Static | Index | **HOMEPAGE (`/`)** | None | Missing explicit canonical; missing from sitemaps. |
| `/refund-policy` | Public | Static | Index | **HOMEPAGE (`/`)** | None | Missing explicit canonical; contradicts PDP FAQ return window (48 hours vs 7 days). |
| `/terms` | Public | Static | Index | **HOMEPAGE (`/`)** | None | Missing explicit canonical; thin content (34 lines), missing governing law/entity. |
| `/privacy` | Public | Static | Index | **HOMEPAGE (`/`)** | None | Missing explicit canonical. |
| `/creator-guidelines` | Public | Static | Index | Self | None | Double title suffix. |
| `/classes` | Public | Static | Index | Self | None | Double title suffix. |
| `/store/[sellerId]` | Public | SSR / ISR | Conditional (>=3 items) | Self (`/store/[id]`) | Store | Double title suffix. |
| `/sell` | Landing | Static | Index | Self (`/sell`) | None | Double title suffix. |
| `/sell/how-it-works` | Landing | Static | Index | Self | None | Double title suffix. |
| `/sell/categories` | Landing | Static | Index | Self | None | Used inappropriately in `llms.txt` as primary buyer category targets. |
| `/sell/why-ekora` | Landing | Static | Index | **HOMEPAGE (`/`)** | None | Missing explicit canonical. |
| `/sell/platform` | Landing | Static | Index | **HOMEPAGE (`/`)** | None | Missing explicit canonical. |
| `/sell/faq` | Landing | Static | Index | Self | None | Double title suffix. |
| `/start-selling` | Form | Client | Noindex (in robots) | Self | None | Disallowed in `robots.txt`. |
| `/cart` | Private | Client | Noindex | Inherited | None | Correctly set `robots: { index: false }` in layout. |
| `/checkout` | Private | Client | Noindex | Inherited | None | Correctly set `robots: { index: false }` in layout. |
| `/account` | Private | Client | Noindex (in robots) | Inherited | None | Disallowed in `robots.txt`. |
| `/account/orders` | Private | Client | Noindex (in robots) | Inherited | None | Disallowed in `robots.txt`. |
| `/login` | Private | Client | Noindex (in robots) | Inherited | None | Disallowed in `robots.txt`. |
| `/signup` | Private | Client | **Indexable Leak** | **HOMEPAGE (`/`)** | None | **Allowed in robots.txt**; missing noindex tag; inherits homepage canonical. |
| `/admin/*` (7 routes) | Private | Server / Auth | Noindex (in robots) | N/A | None | Redirects to `/` if unauthorized. Disallowed in `robots.txt`. |
| `/seller/dashboard/*` (5 routes)| Private | Server / Auth | Noindex (in robots) | N/A | None | Redirects to `/` if unauthorized. Disallowed in `robots.txt`. |
| `/api/*` (18 routes) | Backend | API Routes | Noindex (in robots) | N/A | None | Disallowed in `robots.txt`. Note: `/api/docs` sets `X-Robots-Tag: index, follow` in conflict. |

---

## PHASE 2 â€” LIVE TECHNICAL SEO AUDIT

Live empirical verification was conducted directly against `https://www.ekorabazaar.in/`.

### 2.1 Crawling, Sitemaps & Indexation Architecture
- **`/robots.txt` Status (HTTP 200 OK):**
  - Host: `https://www.ekorabazaar.in/robots.txt`
  - Correctly points to sitemap index: `Sitemap: https://www.ekorabazaar.in/sitemap_index.xml`.
  - Disallows: `/api/`, `/seller/dashboard/`, `/admin/`, `/start-selling`, `/login`, `/account/`, `/checkout/`, `/cart/`.
  - **Leak:** `/signup` is NOT disallowed in `robots.txt`, despite `/login` being disallowed.
- **Sitemap Index & Sub-Sitemaps:**
  - `https://www.ekorabazaar.in/sitemap.xml` returns **HTTP 308 Permanent Redirect** to `/sitemap_index.xml`. (Clean redirect configured in `next.config.ts`).
  - `https://www.ekorabazaar.in/sitemap_index.xml` returns **HTTP 200 OK** (application/xml).
  - Contains 6 dynamic sub-sitemaps generated by Next.js `generateSitemaps()`:
    1. `/sitemap/static.xml` (HTTP 200, 2,021 bytes)
    2. `/sitemap/categories.xml` (HTTP 200, 4,911 bytes)
    3. `/sitemap/products.xml` (HTTP 200, 278,819 bytes â€” full catalog index)
    4. `/sitemap/guides.xml` (HTTP 200, 4,849 bytes)
    5. `/sitemap/blog.xml` (HTTP 200, 4,734 bytes)
    6. `/sitemap/stores.xml` (HTTP 200, 458 bytes)
- **Critical Omissions in Sitemaps:**
  - `/formulations` and all 20 `/formulations/[slug]` sub-pages are **completely absent from all sitemaps**.
  - `/contact` is **missing from `static.xml`**.
  - `/shipping-policy` is **missing from `static.xml`**.
  - `/seller-agreement` is **missing from `static.xml`**.

### 2.2 Canonical Inheritance Bug (Critical P0)
Next.js App Router metadata resolution merges parent layout alternates with page metadata. In `src/app/layout.tsx`:
```typescript
alternates: {
  canonical: "https://www.ekorabazaar.in",
  languages: { "en-IN": "https://www.ekorabazaar.in" }
}
```
Whenever a leaf page defines `metadata = { title: "..." }` without specifying `alternates: { canonical: "..." }`, Next.js defaults the page's canonical tag to `https://www.ekorabazaar.in`.

**Live Production Proof (Empirically Verified):**
- URL: `https://www.ekorabazaar.in/formulations/tranexamic-acid-serum-spot-correcting-serum`
- Rendered Tag: `<link rel="canonical" href="https://www.ekorabazaar.in"/>`
- Impact: Search crawlers treat these high-value organic formulations as duplicate copies of the homepage and discard them from search indexation.
- **Affected Routes:**
  - `/formulations`
  - All 20 `/formulations/[slug]` routes
  - `/contact`
  - `/privacy`
  - `/refund-policy`
  - `/terms`
  - `/shipping-policy`
  - `/seller-agreement`
  - `/signup`

### 2.3 Double Brand Suffix Duplication Bug
In `src/app/layout.tsx`, the title template is configured as:
```typescript
title: {
  default: "Ekora Bazaar â€” India's First Creator Commerce Platform",
  template: "%s | Ekora Bazaar",
}
```
When downstream pages hardcode `| Ekora Bazaar` in their title string, Next.js blindly appends the template suffix.

**Live Production Proof (Empirically Verified):**
- `/about`: `<title>About Us | Ekora Bazaar | Ekora Bazaar</title>`
- `/blog`: `<title>Craft Maker Knowledge Base | Ekora Bazaar Blog | Ekora Bazaar</title>`
- `/tools/fragrance-load-calculator`: `<title>Candle Fragrance Load Calculator | Ekora Bazaar | Ekora Bazaar</title>`
- `/formulations/[slug]`: `<title>Tranexamic Acid Serum: Lightweight Spot-Correcting Formula (DIY Guide) | Ekora Formulations | Ekora Bazaar</title>`
- `/classes`: `<title>Luxury Candle-Making Classes | Ekora Bazaar | Ekora Bazaar</title>`
- `/privacy`: `<title>Privacy Policy | Ekora Bazaar | Ekora Bazaar</title>`
- `/refund-policy`: `<title>Refund Policy | Ekora Bazaar | Ekora Bazaar</title>`
- `/terms`: `<title>Terms of Service | Ekora Bazaar | Ekora Bazaar</title>`
- `/store/[sellerId]`: `<title>[Seller Brand] Wholesale Storefront | Ekora Bazaar | Ekora Bazaar</title>`

### 2.4 Arbitrary Blog Meta Truncation
In `src/app/blog/[slug]/page.tsx` lines 23â€“28:
```typescript
const title = frontmatter.title.length > 60 ? frontmatter.title.slice(0, 57) + "..." : frontmatter.title;
const description = frontmatter.description.length > 155 ? frontmatter.description.slice(0, 152) + "..." : frontmatter.description;
```
This hardcoded slice indiscriminately chops words mid-sentence (e.g. *"How to Fix Candle Frosting, Wet Spots, and Sinkholes in So... | Ekora Bazaar"*), degrading SERP click-through rates.

### 2.5 Image Optimization Disabled (`unoptimized: true`)
In `next.config.ts` line 6:
```typescript
images: {
  unoptimized: true,
  ...
}
```
Next.js built-in Image Optimization API is globally disabled. The site does not automatically generate WebP/AVIF versions, does not serve responsive `srcset` resolutions based on client viewport, and delivers raw uncompressed files directly to mobile devices.

---

## PHASE 3 â€” PRODUCT CATALOG SEO & DATA QUALITY AUDIT

Programmatic analysis of all **2,255 SKUs** in `src/lib/data/products.json` revealed serious data quality issues.

### 3.1 Catalog Breakdown & Issue Quantities

| Issue Description | Affected Products | Percentage | Severity | Business Impact |
| :--- | :---: | :---: | :---: | :--- |
| **Generic Boilerplate Description** | **1,785** | **79.1%** | **High** | Search engines suppress near-identical pages under doorway/thin-content filters. |
| **Hotlinked Competitor Images** | **1,695** | **75.2%** | **Critical** | Images served from `jindeal.com` (1,470) & `matinimpex.com` (225). Brittle dependency, zero Google Image SEO for Ekora. |
| **Duplicate SKU Records** | **16 (8 pairs)** | **0.7%** | **High** | Internal index cannibalization, split backlinks, duplicate product URLs. |
| **Placeholder / OG-Image Used as Product Image** | **64** | **2.8%** | **High** | Poor buyer conversion; rejected by Google Merchant Center product feed. |
| **Zero-Price / Unpriced Products** | **41** | **1.8%** | **Medium** | Confuses users; shows â‚¹0 unless explicitly handled by quote CTA. |
| **Duplicate Image URLs Shared Across SKUs** | **201** | **8.9%** | **Medium** | Distinct products displaying identical imagery degrades user trust. |
| **Unsubstantiated "Batch-Tested" Claims** | **1,788** | **79.3%** | **Critical** | Boilerplate claims "batch-tested reliability" even on silicone moulds and packaging mailers. |

### 3.2 Duplicate Product Pair Inventory

The audit isolated 8 exact duplicate pairs where two distinct product IDs represent the same item with identical images, descriptions, and categories:

1. **Mango Butter:** ID `375` & ID `399` (`/products/375` & `/products/399`) â€” Both live in sitemap!
2. **464 Soy Wax Natural Granule:** ID `854` & ID `2383`
3. **Soy Butter Wax:** ID `857` & ID `2385`
4. **Soy Wax White Chunk AA+:** ID `862` & ID `2390`
5. **Natural Coconut Wax:** ID `932` & ID `2388`
6. **Bees Wax Natural Yellow:** ID `1262` & ID `2401`
7. **100% Natural Pure Beeswax Pellets White:** ID `1283` & ID `2399`
8. **Raw Shea Butter (Organic Raw) from Africa:** ID `1285` & ID `2403`

*Root Cause:* Batch re-importing in the ID 2370â€“2410 range duplicated legacy records without deduplication against existing SKU IDs.

### 3.3 Mango Butter vs Cocoa Butter Investigation
The audit inspected the publicly surfaced issue where Cocoa Butter text was mistakenly attached to Mango Butter:
- In `src/lib/data/products.json`, ID `375` and `399` ("Mango Butter") and ID `2402` ("Cocoa Butter Food Grade") share an identical copy-pasted sentence structure:
  > *"Premium natural [Mango Butter / Cocoa Butter] for skincare, soap making, cosmetics, lotions, creams, lip balms, body butters, and personal care formulations. Rich in moisturizing fatty acids and skin-conditioning properties."*
- In `src/lib/search.ts` line 29:
  ```typescript
  ['butter', 'shea butter', 'cocoa butter', 'mango butter']
  ```
  Because this is declared as a **bidirectional synonym group**, searching for "Mango Butter" automatically injects "cocoa butter" into query expansion tokens.
- **PDP Factual Contradiction:**
  On the live Mango Butter page (`/products/375`), the technical profile accordion asserts:
  - *"Optimal shelf life is 24 months from batch distillation date."* (Mango butter is cold-pressed/solvent-extracted from seeds, **never distilled**).
  - *"Compliance: IFRA & ISO Calibrated."* (IFRA governs **fragrance safety limits**, not cosmetic raw vegetable butters).

### 3.4 Shipping Cost Contradiction (Direct Live Conflict)
A direct factual contradiction exists between what the buyer sees on the product page versus what happens in checkout:
- **Product Page (`PricingWidget.tsx` Line 551):**
  Displays: **`Standard Flat Shipping: â‚¹80 across India`** (with a green truck icon).
- **Cart Page (`cart/page.tsx` Line 235):**
  Displays: **`Delivery: â‚¹90`** (derived from `TEMP_FLAT_SHIPPING_CHARGE = 90`).
- **Checkout Page (`checkout/page.tsx` Line 394):**
  Displays: **`Delivery: â‚¹90`**.
- **Shipping Policy (`shipping-policy/page.tsx` Line 25):**
  States: **`flat delivery charge of â‚¹90 per order`**.
- **Product JSON-LD Schema (`src/lib/seo.ts` Line 107):**
  Outputs: `shippingRate: { value: 90, currency: "INR" }`.
- **Cart Telemetry (`cart/page.tsx` Lines 62 & 98):**
  Tracks `amount_to_free_shipping: (200000 - total) / 100`, referencing a phantom **â‚¹2,000 free shipping threshold** that is neither advertised nor active in business rules.

*Impact:* Bait-and-switch friction. A customer told shipping is â‚¹80 on the PDP arrives in checkout to find a â‚¹90 charge, increasing checkout abandonment.

---

## PHASE 4 â€” STRUCTURED DATA & ENTITY SEO AUDIT

The JSON-LD emitted by production pages was extracted and validated against Google Search Central documentation and Schema.org standards.

### 4.1 Schema Evaluation Findings

| Schema Type | Location | Status | Diagnostic Finding |
| :--- | :--- | :---: | :--- |
| **Organization** | `layout.tsx` (Root) | **Valid with Warnings** | Emits `sameAs` links for Instagram, Facebook, LinkedIn. References logo `/apple-touch-icon.png`. Missing official phone, tax ID (GSTIN), and corporate registration. |
| **WebSite** | `layout.tsx` (Root) | **Valid** | Emits `SearchAction` targeting `/shop?q={search_term_string}`. |
| **LocalBusiness** | `layout.tsx` (Root) | **Invalid / Broken** | Injected on **every single page** sitewide. Missing `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `telephone`. Invalid for Google Local Pack eligibility; triggers Rich Results warnings. |
| **Product** | `/products/[id]` | **Partially Valid** | Single `Offer` at base price with `shippingDetails` (â‚¹90) and `MerchantReturnPolicy`. **Warning:** Brand name is hardcoded to "Ekora Bazaar" for all products regardless of actual manufacturer/supplier. Missing GTIN/MPN when available. |
| **FAQPage** | `/products/[id]` & `/wholesale/[cat]` | **Deprecated / Inadvisable** | Google's August 2023 update restricted FAQ rich snippets strictly to authoritative government and healthcare sites. Injecting templated FAQPage schemas across 2,255 e-commerce PDPs bloats DOM and risks spammy markup flags. |
| **BreadcrumbList** | `/products/[id]` | **Valid** | Clean hierarchy: Home â†’ Shop â†’ Product Name. |
| **BreadcrumbList** | `/guides/[slug]` | **Broken (404)** | Position 2 points to `https://www.ekorabazaar.in/guides`, which returns **HTTP 404 Not Found**. |
| **Article** | `/blog/[slug]` | **Warning (Missing Field)** | Missing `image` property. Google documentation requires `image` for Article rich snippet and Google Discover eligibility. |
| **ItemList** | `/shop` & `/wholesale/[cat]` | **Valid** | Correctly maps product cards to ListItems. |

---

## PHASE 5 â€” AEO: ANSWER-ENGINE OPTIMIZATION AUDIT

Answer engines (Perplexity, Google AI Overviews, SearchGPT, Claude Search) look for direct, concise definitions, tabular specifications, clear dosage guidelines, and structured Q&As.

### 5.1 Strengths Identified
1. **Interactive Utilities:** The **Candle Fragrance Load Calculator** (`/tools/fragrance-load-calculator`) is a high-value AEO asset that calculates exact wax and fragrance weights in grams for soy, paraffin, and coconut waxes based on desired load percentages.
2. **Deep Technical Guides:** Articles like `how-to-choose-candle-wax.md` (9,649 bytes), `fixing-candle-frosting-wet-spots-sinkholes.md` (12,521 bytes), and `epoxy-resin-ratio-guide.md` (10,936 bytes) provide genuine formulation advice and troubleshooting tables.

### 5.2 Critical AEO Deficits
1. **The 20 Orphaned Formulations:**
   The DIY formulation guides in `src/app/formulations/` contain exact recipes for high-intent queries:
   - *Tranexamic Acid Serum Spot-Correcting Formula*
   - *Redensyl + Anagain Hair Growth Serum*
   - *Hydrating Niacinamide Toner*
   - *Brightening Arbutin Serum*
   - *Hydrating Vitamin C Serum*

   **Failure:** Because every one of these pages canonicalizes to the homepage, answer engines cannot index or cite these specific URLs as authoritative answer sources.
2. **Lack of Inverted-Pyramid Summary Boxes on PDPs:**
   Product detail pages bury core technical answers (e.g. melting point, fragrance flash point, recommended pour temperature) inside client-side JavaScript tabs or collapsed details rather than an immediate 40â€“60 word crawlable summary at the top of the description.

---

## PHASE 6 â€” GEO: GENERATIVE-ENGINE OPTIMIZATION AUDIT

GEO evaluates how clearly AI systems understand Ekora Bazaar as a distinct, reliable corporate entity.

### 6.1 Programmatic Fake Laboratory Documents (Critical P0 Risk)
Under `src/app/api/docs/[slug]/[type]/route.ts`, Ekora generates dynamic HTML "PDF" documents for COA, TDS, MSDS, and IFRA:
- **Authority Claimed:** *"Authorized Testing Authority: Ekora Central QA & Formulation Laboratory (New Delhi, India)"*.
- **Standard Claimed:** *"ISO 9001:2015 Verified"*, *"Ekora QA Approved Batch Certified"*.
- **Fabricated Data:** Hardcodes exact test numbers for every item:
  - Purity / Assay: `99.68% PASSED`
  - Heavy Metal Screening: `< 0.8 ppm (Undetectable) PASSED`
  - Microbiological Bio-Burden: `< 10 CFU/g PASSED`
  - Moisture Content: `0.14% PASSED`
- **Robots Header:** Route returns `"X-Robots-Tag": "index, follow"`.

**Severe Business & Legal Risk:**
1. AI search models cross-reference laboratory names. There is no accredited "Ekora Central QA & Formulation Laboratory" in New Delhi.
2. Generating a chemical assay claiming 99.68% active content on a **silicone cake mould** or **corrugated shipping box** is transparently fabricated, destroying domain trust in AI knowledge graphs.
3. In India, manufacturing false laboratory certificates violates the **Consumer Protection Act, 2019** (Misleading Advertisements) and cosmetic labeling regulations under the **Drugs and Cosmetics Act**.

### 6.2 `/llms.txt` Live Audit
- **Status:** HTTP 200 OK (`https://www.ekorabazaar.in/llms.txt`).
- **Defects Discovered:**
  1. Primary Categories section (lines 42â€“65) links *Resin Art, Home Decor, Candles, Crochet, Pottery, Jewelry, Paintings* to `https://www.ekorabazaar.in/sell/categories` instead of consumer shopping or wholesale category routes.
  2. The Sitemap line (line 156) references `https://www.ekorabazaar.in/sitemap.xml` instead of `/sitemap_index.xml`.
  3. Omits all 27 knowledge base articles, all 20 formulations, and the fragrance load calculator tool.

### 6.3 Entity Consistency Across Policies
- **Legal Entity:** Stated as `Ekora Bazaar Pvt Ltd` on `/about` and `/contact`, but simply `Ekora Bazaar` on `/terms` and `/privacy`.
- **Address:** `Near Shyam Mandir Marg, Sutapatti, Muzaffarpur, Bihar - 842001, India`. Present in About and Contact, but missing in `LocalBusiness` schema and footer.
- **Return Window Contradiction:**
  - `/refund-policy` says: Contact within **48 hours** with unboxing video.
  - `/lib/faqs.ts` (PDP FAQs) says: Free replacement within **7 days**.

---

## PHASE 7 â€” CONTENT STRATEGY & TOPICAL CLUSTERS

### 7.1 Current Content Inventory
The blog repository (`content/blog/`) houses 27 markdown articles. The editorial quality of the writing is strong, targeting real maker friction points.

### 7.2 Identified Topic Gaps (Opportunity Map)

| Category Hub | Existing Article Coverage | High-Priority Content Gap | Target Intent / Search Query |
| :--- | :--- | :--- | :--- |
| **Candle Making** | Wax types, frosting fixes, wick sizing, jars | **Soy Wax vs Paraffin Melt Pool Comparison** | *"464 soy wax vs paraffin fragrance throw India"* |
| **Candle Making** | None | **Commercial Wax Sourcing: 25kg Sacks vs Cases** | *"wholesale soy wax 25kg price India"* |
| **Soap Making** | MP vs CP, colorants, botanicals, moulds | **Lye (NaOH) Safety & Sourcing Guide** | *"where to buy sodium hydroxide for soap making India"* |
| **Fragrance Chemistry**| Fragrance vs Essential, IFRA definition | **Flash Point Chart for Top 50 Fragrance Oils** | *"candle fragrance oil flash point temperature chart"* |
| **Packaging & Shipping**| None | **Transit Packaging Guide for Glass Candle Jars** | *"how to pack glass candle containers for courier courier safety"* |
| **Resin Craft** | Ratios, mould selection | **Bubble Elimination in Deep Pour Epoxy Resin** | *"how to get bubble free epoxy resin finish without vacuum chamber"* |

---

## PHASE 8 â€” GOOGLE SEARCH CONSOLE & ANALYTICS AUDIT

### 8.1 Tracking Implementation Review
- **GA4 Measurement ID:** `G-YTRDDR6JBB` loaded in `src/app/layout.tsx` via `@next/third-parties/google`.
- **Session Intelligence:** Microsoft Clarity ID `xl8241neb6` loaded conditionally in production.
- **Internal Event Stream:** Proprietary `/api/events` telemetry ingests session engagement and scroll depth.

### 8.2 Ecommerce Funnel Tracking Gaps
1. **Purchase Event Drop Risk (Race Condition):**
   In `src/app/checkout/page.tsx` lines 195â€“216:
   ```typescript
   onSuccess: (data) => {
     import('@next/third-parties/google').then(({ sendGAEvent }) => {
       sendGAEvent('event', 'purchase', { transaction_id: data.orderId, ... });
     });
     paymentCompletedRef.current = true;
     trackEvent("purchase", { ... });
     router.push('/account/orders'); // <-- Fires immediately!
   }
   ```
   Calling `router.push` immediately after initiating the dynamic import means page navigation often tears down the execution context before the `purchase` event beacon is dispatched, resulting in under-reported conversions in GA4.
2. **Missing Search Console Verification Tag:**
   No `google-site-verification` meta tag or verification HTML file exists in the codebase. Verification relies entirely on DNS or GA4 account linkage.

### 8.3 Data & Exports Needed from Site Owner
To validate historical ranking shifts, crawl errors, and conversion rates, the owner must provide:
1. **Google Search Console Export:**
   - Pages report: Indexed vs. Not Indexed breakdown (specifically looking for "Duplicate without user-selected canonical" and "Crawled - currently not indexed").
   - Search Performance report (Last 3 months): Clicks, Impressions, CTR, Average Position by Query and Page.
2. **Google Analytics 4 Export:**
   - Monetization â†’ Ecommerce Purchases report (comparing GA4 recorded transactions with backend Razorpay capture counts to measure the tracking drop rate).
   - Traffic Acquisition report (Organic Search session volume, engagement rate, bounce rate).
3. **Google Merchant Center:** Status of product feed if shopping ads or free listings are active.

---

## PHASE 9 â€” COMPETITOR & SEARCH INTENT BENCHMARK

Analysis of the top Indian B2B craft supply and raw material competitors:

| Competitor | Primary Strengths | Ekora Bazaar Advantage | Ekora Vulnerability |
| :--- | :--- | :--- | :--- |
| **Soapy Twist** (`soapytwist.com`) | Established domain authority; authentic COAs and IFRA certificates for download; robust soap bases catalog. | Ekora's multi-tier wholesale pricing widget and modern editorial UI. | Ekora currently hotlinks some images from Soapy Twist and lacks genuine batch documentation. |
| **Candle Supplies India** (`candlesuppliesindia.com`) | Dominates candle making search terms; clear packaging; dedicated wick and wax guides. | Ekora's interactive Fragrance Load Calculator and broader cross-craft catalog. | Competitor has unique product descriptions for every wax SKU, whereas Ekora has 79% boilerplate copy. |
| **VedaOils** (`vedaoils.com`) | Huge volume pricing tiers (1kg to 180kg drums); strong industrial B2B presence; deep backlink profile. | Ekora's low MOQ (1 unit with wholesale volume discounts) friendly to home creators. | VedaOils ranks for high-intent head terms ("wholesale soy wax India", "essential oil bulk manufacturer"). |
| **Jindeal / Matin Impex** | Raw importer/distributor catalog depth. | Ekora provides modern e-commerce checkout and instant card/UPI payments. | **Severe:** Ekora hotlinks 1,470 images from Jindeal and 225 from Matin Impex, leaving Ekora dependent on competitor servers. |

---

## PHASE 10 â€” SEARCH & COMMERCE SAFETY VERIFICATION

Before designing the implementation roadmap, all business-critical invariants were evaluated to ensure zero regressions:

1. **PostgreSQL Search & Synonyms:**
   The search engine in `src/lib/search.ts` relies on `SYNONYM_GROUPS` and trigram similarity. Fixing the Mango Butter/Cocoa Butter synonym overlap must be done cleanly in `search.ts` without affecting valid fragrance or material synonyms.
2. **Product ID & Route Stability:**
   Product detail pages are keyed by `/products/[id]`. **Existing numeric IDs (e.g. `375`, `399`, `2383`) must remain unchanged** to preserve external bookmarks, indexed URLs, and database foreign keys in `OrderItem` and `CartItem`.
3. **Authoritative Shipping Charge:**
   The authoritative production rule is **â‚¹90 flat shipping per order** (`TEMP_FLAT_SHIPPING_CHARGE = 90`). The fix is strictly to update the frontend display in `PricingWidget.tsx` (which incorrectly shows â‚¹80) to show â‚¹90, eliminating customer confusion without altering billing logic.
4. **Checkout & Payment Security:**
   Razorpay order creation, HMAC signature verification, and cart state are functioning. No changes should touch payment gateway handlers.

---

## PHASE 11 â€” PRIORITIZED FINDINGS MASTER TABLE

### Priority Definitions
- **P0 (Critical):** Core indexation failure, incorrect canonicals, active 404s in schema, deceptive compliance claims, or customer-facing pricing/shipping discrepancies.
- **P1 (High):** Major catalog quality issues, 3rd-party image dependencies, double title branding, and missing rich result properties.
- **P2 (Medium):** AEO content enhancements, entity consistency across legal pages, and internal linking gaps.
- **P3 (Low):** Minor code cleanups, non-critical telemetry refinements, and progressive optimizations.

| Issue ID | Category | Severity | Confidence | Affected File / URL / Component | Evidence & Diagnostic Summary | Recommended Fix | Effort |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **ISS-01** | Technical SEO | **P0** | Confirmed | `src/app/formulations/[slug]/page.tsx`, `formulations/page.tsx`, `contact/page.tsx`, legal pages | Next.js layout canonical inheritance causes all 20 formulation articles and static pages to emit `<link rel="canonical" href="https://www.ekorabazaar.in"/>`. | Add explicit `alternates: { canonical: ... }` to every page's `generateMetadata` / `metadata`. | **S** |
| **ISS-02** | Technical SEO | **P0** | Confirmed | `src/app/guides/[slug]/page.tsx` | BreadcrumbList schema links Position 2 to `https://www.ekorabazaar.in/guides`, which returns **HTTP 404 Not Found**. | Create `/guides/page.tsx` guide directory hub or adjust breadcrumb schema to link to `/shop`. | **S** |
| **ISS-03** | Technical SEO | **P0** | Confirmed | `src/app/sitemap.ts` | `/formulations`, all 20 `/formulations/[slug]`, `/contact`, `/shipping-policy`, and `/seller-agreement` are missing from sitemaps. | Add formulations generator and missing static routes to `sitemap.ts`. | **S** |
| **ISS-04** | GEO / Trust | **P0** | Confirmed | `src/app/api/docs/[slug]/[type]/route.ts`, `TechnicalDocsSection.tsx` | Programmatic endpoint fabricates fake COA, TDS, MSDS & IFRA lab reports with fake 99.68% assays & fake QA stamps for all 2,255 SKUs (even moulds). | Remove fabricated test results. Replace with genuine spec sheets or supplier-provided documents only for eligible materials. Disallow route. | **M** |
| **ISS-05** | Catalog / UX | **P0** | Confirmed | `src/components/PricingWidget.tsx` (L551) vs `pricing.ts`, cart, checkout | Product page displays "Standard Flat Shipping: â‚¹80 across India", but cart and checkout charge â‚¹90. | Update `PricingWidget.tsx` line 551 to display **â‚¹90** flat shipping, matching policy and checkout. | **S** |
| **ISS-06** | Catalog SEO | **P1** | Confirmed | `src/lib/data/products.json` | 8 duplicate SKU pairs (16 products) indexed concurrently (e.g. Mango Butter 375 & 399, 464 Soy Wax 854 & 2383). | Deprecate duplicate secondary IDs with 301 permanent redirects to primary canonical IDs. | **M** |
| **ISS-07** | Technical SEO | **P1** | Confirmed | Sitewide (`about`, `blog`, `classes`, `store`, `tools`, `privacy`, etc.) | Layout template `"%s \| Ekora Bazaar"` causes double branding (`... \| Ekora Bazaar \| Ekora Bazaar`) on live site. | Remove hardcoded `\| Ekora Bazaar` from page title strings across all page/layout files. | **M** |
| **ISS-08** | Catalog Quality| **P1** | Confirmed | `src/lib/data/products.json` | 1,785 products (79.1% of catalog) share identical boilerplate description ("Premium quality [X] sourced directly..."). | Deploy structured category-specific attribute templates (material, dimensions, temperature rating, MOQ). | **L** |
| **ISS-09** | Performance | **P1** | Confirmed | `next.config.ts` (L6), `products.json` | `unoptimized: true` disables Next.js image optimization; 1,695 images hotlinked to competitor CDNs (`jindeal.com`, `matinimpex.com`). | Enable image optimization; build migration script to download and host assets on Ekora's Supabase/Vercel Blob storage. | **L** |
| **ISS-10** | Structured Data| **P1** | Confirmed | `src/app/layout.tsx` | Incomplete `LocalBusiness` schema missing postal address and telephone is emitted on every page sitewide. | Populate complete address details (`streetAddress`, `postalCode`, `telephone`) and restrict to Homepage/About/Contact. | **S** |
| **ISS-11** | Structured Data| **P1** | Confirmed | `src/app/blog/[slug]/page.tsx` | `Article` schema missing required `image` property, preventing Article rich results and Google Discover indexing. | Add article featured image URL to `articleSchema` in `BlogArticlePage`. | **S** |
| **ISS-12** | Structured Data| **P2** | Confirmed | `src/lib/seo.ts` (L174), PDPs, category pages | Templated `FAQPage` schema on 2,255 PDPs despite Google's 2023 deprecation of FAQ rich results for commercial websites. | Remove `FAQPage` schema from PDPs to reduce DOM bloat and prevent spam markup warnings. Preserve visible FAQs. | **S** |
| **ISS-13** | GEO / AEO | **P2** | Confirmed | `src/app/llms.txt/route.ts` | Primary Categories in `llms.txt` link to `/sell/categories`; blog, formulations, and calculator are missing. | Update `llms.txt` with direct wholesale buyer URLs (`/wholesale/...`), link 27 blog posts, 20 formulations, and tools. | **S** |
| **ISS-14** | Technical SEO | **P2** | Confirmed | `src/app/blog/[slug]/page.tsx` | Blog titles hard-truncated to 60 characters with `...`, slicing words mid-sentence. | Remove arbitrary substring slice; allow natural full descriptive titles up to 70 characters without truncation ellipses. | **S** |
| **ISS-15** | Catalog / AEO | **P2** | Confirmed | `src/app/products/[id]/page.tsx` (L342, L428), `search.ts` (L29) | Mango butter page claims "batch distillation date" and "IFRA calibrated"; bidirectional synonym maps mango butter to cocoa butter. | Separate mango and cocoa butter in synonym groups; remove distillation/IFRA text from raw butter product pages. | **S** |
| **ISS-16** | Analytics | **P2** | Confirmed | `src/app/checkout/page.tsx` (L196) | Dynamic import of GA4 `purchase` event followed immediately by `router.push` creates a race condition dropping conversion hits. | Await `sendGAEvent` dispatch before navigation, or use synchronous beacon fallback. | **S** |
| **ISS-17** | Technical SEO | **P2** | Confirmed | `src/app/robots.ts`, `src/app/signup/page.tsx` | `/signup` is not disallowed in `robots.txt` and lacks `robots: { index: false }`, leaking empty auth page into index. | Add `/signup` to `robots.ts` disallow list and add noindex metadata to signup layout. | **S** |
| **ISS-18** | Legal / Entity | **P2** | Confirmed | `src/app/terms/page.tsx`, `refund-policy/page.tsx` | Terms of service is thin (34 lines) and lacks company legal name/governing law; refund policy (48h) contradicts PDP FAQ (7d). | Reconcile return policy windows and add corporate entity details, jurisdiction, and GSTIN to terms page. | **M** |

---

## CONCLUSION OF AUDIT

The technical audit establishes that Ekora Bazaar's core product catalog and educational content are currently hampered by **self-inflicted technical configuration errors**:
1. High-value DIY formulation recipes are de-indexed because they point canonical tags to the homepage.
2. The site's titles display embarrassing double branding (`... | Ekora Bazaar | Ekora Bazaar`).
3. Product pages advertise â‚¹80 flat shipping while charging â‚¹90 at checkout.
4. Over 75% of product images rely on competitor servers and bypass Next.js image optimization.
5. Factual and compliance claims (fabricated COAs, IFRA certifications on butters) present acute GEO and regulatory risks.

All 18 findings are backed by empirical codebase and live network evidence. The companion implementation roadmap (`docs/SEO_AEO_GEO_IMPLEMENTATION_ROADMAP.md`) outlines the precise, phased execution strategy to remediate these issues systematically.

# EKORA BAZAAR â€” SEO, AEO & GEO IMPLEMENTATION ROADMAP

**Production Domain:** `https://www.ekorabazaar.in/`
**Document Version:** 1.0 (Audit Baseline Post-Verification)
**Strategy:** Phased, Test-Driven Execution (One controlled phase at a time with strict regression safeguards)

---

## ROADMAP OVERVIEW & OPERATIONAL PRINCIPLES

This roadmap translates the findings from `docs/SEO_AEO_GEO_MASTER_AUDIT.md` into actionable engineering and editorial work packages.

### Operational Rules
1. **Safety First:** No changes to existing PostgreSQL fuzzy search algorithms, product numeric IDs (`375`, `399`, etc.), or Razorpay payment handlers.
2. **Deterministic Shipping Rule:** The authoritative business rule is **â‚¹90 flat shipping** (`TEMP_FLAT_SHIPPING_CHARGE = 90`). UI copy must align to â‚¹90; checkout logic must not be altered.
3. **Sequential Phase Delivery:** Each phase must be fully implemented, locally tested, deployed to staging/preview, and validated against acceptance criteria before initiating the subsequent phase.
4. **Zero Unsubstantiated Claims:** Remove fabricated laboratory assay values; never replace placeholders with random unverified images.

---

## PHASE 1 â€” CRITICAL TECHNICAL & CATALOG FIXES (P0)

*Goal: Eliminate indexation blocks, resolve duplicate product URLs, fix broken schema endpoints, and remove checkout-abandonment shipping discrepancies.*

---

### Task 1.1: Fix Canonical Inheritance Trap on Formulations and Core Pages
- **Priority:** P0 (Critical)
- **Files Involved:**
  - `src/app/formulations/page.tsx`
  - `src/app/formulations/[slug]/page.tsx`
  - `src/app/contact/page.tsx`
  - `src/app/privacy/page.tsx`
  - `src/app/terms/page.tsx`
  - `src/app/refund-policy/page.tsx`
  - `src/app/shipping-policy/page.tsx`
  - `src/app/seller-agreement/page.tsx`
  - `src/app/sell/why-ekora/page.tsx`
  - `src/app/sell/platform/page.tsx`
- **Expected Benefit:** Restores independent indexation for all 20 high-value formulation recipes and static informational routes; stops Google from treating them as duplicates of the homepage.
- **Risk of Regression:** None.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Every route explicitly outputs its own canonical URL in `alternates: { canonical: ... }`.
  - For example, `/formulations/[slug]` renders `<link rel="canonical" href="https://www.ekorabazaar.in/formulations/[slug]"/>`.
- **Validation Commands:**
  ```powershell
  curl.exe -sL https://www.ekorabazaar.in/formulations/tranexamic-acid-serum-spot-correcting-serum | Select-String -Pattern "canonical"
  # Must output: href="https://www.ekorabazaar.in/formulations/tranexamic-acid-serum-spot-correcting-serum"
  ```
- **Rollback Consideration:** Revert metadata alternates block in the affected page file.

---

### Task 1.2: Reconcile Product Page Shipping Display (â‚¹80 â†’ â‚¹90)
- **Priority:** P0 (Critical)
- **Files Involved:**
  - `src/components/PricingWidget.tsx` (Line 551)
- **Expected Benefit:** Eliminates customer friction and bait-and-switch abandonment where product pages promised â‚¹80 delivery but checkout billed â‚¹90.
- **Risk of Regression:** Zero risk to backend calculations.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Line 551 of `PricingWidget.tsx` is updated from `?80` to `â‚¹90` (or `TEMP_FLAT_SHIPPING_CHARGE`).
  - The green truck shipping badge reads: *"Standard Flat Shipping: â‚¹90 across India"*.
- **Validation Commands:**
  - Inspect `/products/375` and confirm visible copy displays â‚¹90. Verify cart and checkout continue to bill â‚¹90.
- **Rollback Consideration:** Git revert commit for `PricingWidget.tsx`.

---

### Task 1.3: Fix Broken `/guides` Breadcrumb Schema (404 Resolution)
- **Priority:** P0 (Critical)
- **Files Involved:**
  - `src/app/guides/page.tsx` (Create new guide directory hub)
  - `src/app/guides/[slug]/page.tsx` (Align visible breadcrumbs with JSON-LD breadcrumbs)
- **Expected Benefit:** Eliminates Google Search Console crawl errors on `https://www.ekorabazaar.in/guides` and provides a clean category sourcing guide directory.
- **Risk of Regression:** Low.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - `https://www.ekorabazaar.in/guides` returns HTTP 200 OK and displays a grid of all category buying guides.
  - BreadcrumbList schema on `/guides/[slug]` points to a valid 200 OK destination.
- **Validation Commands:**
  ```powershell
  curl.exe -sI https://www.ekorabazaar.in/guides
  # Must return HTTP 200 OK (currently returns HTTP 404).
  ```
- **Rollback Consideration:** Revert schema link to `/shop` if page hub is deferred.

---

### Task 1.4: Update Sitemap Index to Include Missing Core Routes
- **Priority:** P0 (Critical)
- **Files Involved:**
  - `src/app/sitemap.ts`
  - `src/app/sitemap_index.xml/route.ts`
- **Expected Benefit:** Submits all 20 formulation articles, contact, shipping policy, and seller agreements to Google and Bing sitemap crawlers.
- **Risk of Regression:** Low.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Add `{ id: 'formulations' }` to `generateSitemaps()`.
  - Add `/formulations` and all 20 formulation slugs to the sitemap generator.
  - Add `/contact`, `/shipping-policy`, `/seller-agreement` to `staticRoutes` in `sitemap.ts`.
  - Add `/sitemap/formulations.xml` to `sitemap_index.xml/route.ts`.
- **Validation Commands:**
  ```powershell
  curl.exe -s https://www.ekorabazaar.in/sitemap/formulations.xml
  # Must return valid XML sitemap with 21 URLs.
  ```
- **Rollback Consideration:** Remove `formulations` entry from `generateSitemaps`.

---

### Task 1.5: Fix Sitewide Double-Branding Title Duplication
- **Priority:** P1 (High)
- **Files Involved:**
  - `src/app/about/page.tsx`
  - `src/app/blog/page.tsx`
  - `src/app/classes/page.tsx`
  - `src/app/creator-guidelines/page.tsx`
  - `src/app/privacy/page.tsx`
  - `src/app/refund-policy/page.tsx`
  - `src/app/terms/page.tsx`
  - `src/app/tools/fragrance-load-calculator/page.tsx`
  - `src/app/store/[sellerId]/page.tsx`
  - `src/app/cart/layout.tsx`
  - `src/app/checkout/layout.tsx`
- **Expected Benefit:** Cleans up SERP snippet titles; prevents truncated and repetitive brand text in search results.
- **Risk of Regression:** None.
- **Dependencies:** Layout title template `"%s | Ekora Bazaar"` in `src/app/layout.tsx`.
- **Acceptance Criteria:**
  - Remove trailing `| Ekora Bazaar` from page title strings.
  - Example: `title: "About Us"` renders as `<title>About Us | Ekora Bazaar</title>`.
- **Validation Commands:**
  ```powershell
  curl.exe -sL https://www.ekorabazaar.in/about | Select-String -Pattern "<title>(.*?)</title>"
  # Must output: <title>About Us | Ekora Bazaar</title> (not ... | Ekora Bazaar | Ekora Bazaar).
  ```
- **Rollback Consideration:** Revert title string edits.

---

### Task 1.6: Deduplicate 8 Duplicate SKU Pairs (16 Products)
- **Priority:** P1 (High)
- **Files Involved:**
  - `src/lib/data/products.json`
  - `next.config.ts` (Redirects block)
- **Expected Benefit:** Consolidates internal ranking signals into the primary canonical SKU and removes duplicate URLs from sitemaps.
- **Risk of Regression:** Medium (Must ensure active orders/carts with secondary IDs are gracefully handled).
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Establish canonical IDs:
    - Mango Butter: Keep `375`, 301 redirect `399` â†’ `375`.
    - 464 Soy Wax: Keep `854`, 301 redirect `2383` â†’ `854`.
    - Soy Butter Wax: Keep `857`, 301 redirect `2385` â†’ `857`.
    - Soy Wax White Chunk: Keep `862`, 301 redirect `2390` â†’ `862`.
    - Natural Coconut Wax: Keep `932`, 301 redirect `2388` â†’ `932`.
    - Bees Wax Yellow: Keep `1262`, 301 redirect `2401` â†’ `1262`.
    - Beeswax Pellets White: Keep `1283`, 301 redirect `2399` â†’ `1283`.
    - Raw Shea Butter: Keep `1285`, 301 redirect `2403` â†’ `1285`.
  - Add 301 permanent redirects in `next.config.ts` for the deprecated IDs.
  - Remove deprecated IDs from `src/lib/data/products.json`.
- **Validation Commands:**
  ```powershell
  curl.exe -sI https://www.ekorabazaar.in/products/399
  # Must return HTTP 301/308 redirect to /products/375.
  ```
- **Rollback Consideration:** Remove redirect rule and re-insert deprecated record into `products.json`.

---

## PHASE 2 â€” PRODUCT & CATEGORY PAGE QUALITY (P1)

*Goal: Migrate hotlinked competitor images, eliminate fabricated lab certificates, and enrich boilerplate descriptions.*

---

### Task 2.1: Decommission Fabricated Lab Reports & Fake COA Generator
- **Priority:** P0 / P1 (Legal, Trust & GEO Compliance)
- **Files Involved:**
  - `src/app/api/docs/[slug]/[type]/route.ts`
  - `src/components/TechnicalDocsSection.tsx`
  - `src/app/products/[id]/page.tsx`
- **Expected Benefit:** Protects Ekora from severe search engine deceptive content penalties, eliminates AI hallucination loops, and complies with Indian consumer protection regulations.
- **Risk of Regression:** Low.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Block indexing of programmatic docs route: set `X-Robots-Tag: noindex, nofollow` in `route.ts`.
  - Remove hardcoded claims of "Ekora Central QA Laboratory (New Delhi)" and fake 99.68% assays.
  - If authentic manufacturer documentation is unavailable for a SKU, `TechnicalDocsSection` must render a compliant notice: *"Batch documentation available on commercial bulk request (MOQ applies)"* instead of generating fictitious PDF data.
- **Validation Commands:**
  ```powershell
  curl.exe -sI https://www.ekorabazaar.in/api/docs/375/coa
  # Must return X-Robots-Tag: noindex, nofollow.
  ```
- **Rollback Consideration:** Revert route headers.

---

### Task 2.2: Migrate Hotlinked Competitor Images to Ekora Storage
- **Priority:** P1 (High)
- **Files Involved:**
  - `src/lib/data/products.json`
  - `next.config.ts` (Remote patterns)
  - `scripts/migrate-product-images.ts` (One-off ingestion script)
- **Expected Benefit:** Eliminates reliance on `jindeal.com` (1,470 images) and `matinimpex.com` (225 images); protects against mass 404 image breakage; enables Google Image Search rankings for Ekora.
- **Risk of Regression:** Medium (Requires automated batch download and upload to Supabase Storage / Vercel Blob).
- **Dependencies:** Active cloud storage bucket with public CDN delivery.
- **Acceptance Criteria:**
  - Ingestion script downloads each remote image, checks validity, optimizes to WebP, and uploads to Ekora's CDN bucket (`https://assets.ekorabazaar.in/products/...` or `/images/products/...`).
  - Update `src/lib/data/products.json` image paths.
  - Remove `jindeal.com` and `matinimpex.com` from `remotePatterns` in `next.config.ts`.
- **Validation Commands:**
  ```powershell
  # Check image host distribution in products.json
  node -e "const p = JSON.parse(require('fs').readFileSync('src/lib/data/products.json')); console.log(p.filter(x => (x.image||'').includes('jindeal.com')).length);"
  # Must equal 0.
  ```
- **Rollback Consideration:** Keep `products_backup.json` to restore remote URLs if storage migration fails.

---

### Task 2.3: Enable Next.js Image Optimization
- **Priority:** P1 (High - Performance & Core Web Vitals)
- **Files Involved:**
  - `next.config.ts`
- **Expected Benefit:** Automatically compresses and serves responsive AVIF/WebP images sized to the client viewport, reducing Largest Contentful Paint (LCP) from >3.5s to <1.8s on mobile.
- **Risk of Regression:** Low (Monitor Vercel image optimization usage limits).
- **Dependencies:** Task 2.2 completed (Next.js image optimizer functions best with local or whitelisted first-party assets).
- **Acceptance Criteria:**
  - Remove `unoptimized: true` from `next.config.ts`.
  - Specify device sizes and image formats: `formats: ['image/avif', 'image/webp']`.
- **Validation Commands:**
  - Inspect rendered PDP `img` element in network tab; verify `_next/image` format is `webp` or `avif` with correct `srcset`.
- **Rollback Consideration:** Re-enable `unoptimized: true` if edge transformation limits are approached.

---

### Task 2.4: Enrich Boilerplate Descriptions for Core Craft Categories
- **Priority:** P1 (High)
- **Files Involved:**
  - `src/lib/data/products.json`
  - Category intro templates (`src/components/CategoryIntro.tsx`)
- **Expected Benefit:** Clears thin-content filters across 1,785 SKUs; improves ranking relevance for long-tail material queries.
- **Risk of Regression:** None.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Prioritize top 5 categories by search volume:
    1. Candle Waxes & Additives (31 products)
    2. Essential Oils (93 products)
    3. Raw Butters & Carrier Oils (26 products)
    4. Fragrance Oils (242 products)
    5. Eco-Resin & Silicone Moulds (570 products)
  - Replace the generic boilerplate sentence (*"Premium quality [X] sourced directly for creators..."*) with structured attributes:
    - Botanical Name / Chemical Grade / Elastomer Grade
    - Melting Point / Flash Point / Shore Hardness
    - Recommended Application & Dosage Rate
    - Storage & Shelf Life Guidelines
- **Validation Commands:**
  - Verify description length is >= 60 words of unique, informative text.
- **Rollback Consideration:** Restore previous description strings from backup.

---

### Task 2.5: Fix Butter Factual Errors on Product Pages & Synonyms
- **Priority:** P1 (High)
- **Files Involved:**
  - `src/lib/data/products.json` (ID 375 Mango Butter)
  - `src/lib/search.ts` (Line 29)
  - `src/app/products/[id]/page.tsx` (Drawer copy)
- **Expected Benefit:** Resolves publicly flagged Mango Butter inaccuracies; prevents search confusion between cocoa butter and mango butter.
- **Risk of Regression:** Low.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Update `src/lib/search.ts` line 29: Split `SYNONYM_GROUPS` so that `['shea butter', 'mango butter', 'cocoa butter']` are NOT lumped into a single bidirectional synonym cluster. Users searching for "mango butter" should not receive cocoa butter results as primary matches.
  - On `/products/375`, update technical drawer copy: replace *"from batch distillation date"* with *"from cold-press extraction date"*; replace *"IFRA & ISO Calibrated"* with *"Cosmetic Grade & ISO Calibrated"*.
- **Validation Commands:**
  - Search "mango butter" in `/shop?q=mango+butter`; verify Mango Butter is top-ranked without cocoa butter injection.
- **Rollback Consideration:** Git revert commit in `search.ts`.

---

## PHASE 3 â€” STRUCTURED DATA & ENTITY CONSISTENCY (P2)

*Goal: Elevate schema markup to full Schema.org / Google compliance and eliminate validation warnings.*

---

### Task 3.1: Complete `LocalBusiness` Schema and Restrict Scope
- **Priority:** P1 (High)
- **Files Involved:**
  - `src/app/layout.tsx`
  - `src/app/about/page.tsx`
  - `src/app/contact/page.tsx`
- **Expected Benefit:** Eliminates Google Rich Results warnings; establishes valid local and national business entity graph.
- **Risk of Regression:** None.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Remove `LocalBusiness` schema injection from `src/app/layout.tsx` (it should not run on product pages, blog posts, or cart).
  - Inject complete `LocalBusiness` schema only on `/about` and `/contact`:
    - `streetAddress: "Near Shyam Mandir Marg, Sutapatti"`
    - `addressLocality: "Muzaffarpur"`
    - `addressRegion: "Bihar"`
    - `postalCode: "842001"`
    - `addressCountry: "IN"`
    - `telephone: "+91-9041500605"`
    - `priceRange: "â‚¹â‚¹"`
- **Validation Commands:**
  - Run Schema Markup Validator / Google Rich Results Test on `/contact` and `/about`. Verify zero errors.
- **Rollback Consideration:** Restore previous schema in layout.

---

### Task 3.2: Add Missing `image` Property to Blog `Article` Schema
- **Priority:** P1 (High)
- **Files Involved:**
  - `src/app/blog/[slug]/page.tsx`
- **Expected Benefit:** Qualifies all 27 knowledge base articles for Google Discover feeds and Article rich snippets.
- **Risk of Regression:** None.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - In `src/app/blog/[slug]/page.tsx`, add `image: [frontmatter.featuredImage || `${BASE_URL}/og-image.jpg`]` to `articleSchema`.
- **Validation Commands:**
  - Validate any blog article on Schema Markup Validator. Verify `Article` object contains valid `image` URL.
- **Rollback Consideration:** Revert schema object.

---

### Task 3.3: Remove Deprecated `FAQPage` Schema from 2,255 PDPs
- **Priority:** P2 (Medium)
- **Files Involved:**
  - `src/app/products/[id]/page.tsx` (Lines 195â€“196, 213â€“216)
- **Expected Benefit:** Cleans up DOM payload; avoids Google's 2023 deprecated FAQ rich snippet clutter and potential algorithmic spam flags.
- **Risk of Regression:** None (Visible FAQs remain 100% intact on the page for human buyers and AEO crawlers).
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Remove `generateFaqSchema` JSON-LD `<script>` tag from `products/[id]/page.tsx`.
  - Retain visible `<ProductFaqSection />` component.
- **Validation Commands:**
  - Check rendered source on `/products/375`. Verify visible FAQ accordion renders; verify FAQPage JSON-LD is removed.
- **Rollback Consideration:** Re-add `generateFaqSchema` script tag.

---

### Task 3.4: Fix Breadcrumb Schema Duplication in Fragrance Calculator
- **Priority:** P2 (Medium)
- **Files Involved:**
  - `src/app/tools/fragrance-load-calculator/page.tsx`
- **Expected Benefit:** Resolves invalid breadcrumb hierarchy where items 2 and 3 pointed to the exact same URL.
- **Risk of Regression:** None.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Item 1: Home (`/`)
  - Item 2: Maker Tools (`/tools` or `/shop`)
  - Item 3: Fragrance Load Calculator (`/tools/fragrance-load-calculator`)
- **Validation Commands:**
  - Test `/tools/fragrance-load-calculator` on Google Rich Results Test. Verify clean breadcrumb path.
- **Rollback Consideration:** Revert breadcrumb array.

---

## PHASE 4 â€” AEO & GEO CONTENT IMPROVEMENTS (P2)

*Goal: Optimize for AI answer engines (Perplexity, SearchGPT, Claude, Gemini) and align knowledge bases.*

---

### Task 4.1: Overhaul `/llms.txt` with Accurate Buyer Routes & Content Repositories
- **Priority:** P2 (Medium)
- **Files Involved:**
  - `src/app/llms.txt/route.ts`
- **Expected Benefit:** Empowers generative engines to accurately cite Ekora's actual wholesale purchasing URLs and educational guides instead of seller onboarding pages.
- **Risk of Regression:** None.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Update Primary Categories in `llms.txt` to point to `/wholesale/...` rather than `/sell/categories`.
  - Add "KNOWLEDGE BASE & GUIDES" section listing the 27 blog posts and 20 formulations.
  - Add "TOOLS & CALCULATORS" linking `/tools/fragrance-load-calculator`.
  - Update Sitemap link to `https://www.ekorabazaar.in/sitemap_index.xml`.
- **Validation Commands:**
  ```powershell
  curl.exe -s https://www.ekorabazaar.in/llms.txt | Select-String -Pattern "/wholesale/"
  # Must return wholesale category links.
  ```
- **Rollback Consideration:** Revert string template.

---

### Task 4.2: Remove Arbitrary Blog Meta Truncation (60 Chars)
- **Priority:** P2 (Medium)
- **Files Involved:**
  - `src/app/blog/[slug]/page.tsx`
- **Expected Benefit:** Prevents title words from being chopped in half with `...` in SERP snippets.
- **Risk of Regression:** None.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - In `src/app/blog/[slug]/page.tsx`, remove the hardcoded `frontmatter.title.slice(0, 57) + "..."` logic.
  - Return `title: frontmatter.title` (clean title without ellipses).
- **Validation Commands:**
  - Verify `/blog/fixing-candle-frosting-wet-spots-sinkholes` outputs clean full title.
- **Rollback Consideration:** Revert lines 23â€“28.

---

### Task 4.3: Expand Thin Legal Pages & Reconcile Return Windows
- **Priority:** P2 (Medium)
- **Files Involved:**
  - `src/app/terms/page.tsx`
  - `src/app/refund-policy/page.tsx`
  - `src/lib/faqs.ts` (Line 142)
- **Expected Benefit:** Solidifies trust signals for Google E-E-A-T and AI entity models; eliminates conflicting damage claim windows.
- **Risk of Regression:** None.
- **Dependencies:** Owner confirmation on standard damage return window (48 hours vs 7 days).
- **Acceptance Criteria:**
  - In `src/lib/faqs.ts` line 142: Update the glass container warranty text from *"within 7 days"* to *"within 48 hours of delivery with unboxing video"* to match `/refund-policy`.
  - Expand `TermsPage` to include registered corporate name (`Ekora Bazaar Pvt Ltd`), jurisdiction (`Muzaffarpur / New Delhi`), dispute resolution, and GST invoicing terms.
- **Validation Commands:**
  - Verify return window copy on PDP container FAQs matches `/refund-policy`.
- **Rollback Consideration:** Git revert.

---

## PHASE 5 â€” CONTENT CLUSTERS & INTERNAL LINKING (P2/P3)

*Goal: Connect blog articles, formulation recipes, and wholesale product listings into reciprocal topical authority hubs.*

---

### Task 5.1: Cross-Link 20 Formulations to Direct Wholesale Ingredients
- **Priority:** P2 (Medium)
- **Files Involved:**
  - `src/lib/data/formulations.json`
  - `src/app/formulations/[slug]/page.tsx`
- **Expected Benefit:** Directs readers searching for DIY cosmetic recipes straight to Ekora's raw material product pages, driving organic B2B conversions.
- **Risk of Regression:** Low.
- **Dependencies:** Task 1.1 completed (formulations indexable).
- **Acceptance Criteria:**
  - For each ingredient in a formulation (e.g. Tranexamic Acid, Niacinamide, Glycerin, Soy Wax), embed a contextual hyperlink pointing to the corresponding `/products/[id]` or `/wholesale/[category]`.
- **Validation Commands:**
  - Inspect `/formulations/tranexamic-acid-serum-spot-correcting-serum` and verify clickable links to raw materials.
- **Rollback Consideration:** Revert JSON content strings.

---

### Task 5.2: Create Sourcing Guide Directory (`/guides/page.tsx`)
- **Priority:** P2 (Medium)
- **Files Involved:**
  - `src/app/guides/page.tsx` (New route)
- **Expected Benefit:** Resolves the orphaned guide cluster and gives makers a single directory for material sourcing advice across all categories.
- **Risk of Regression:** Low.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Create `src/app/guides/page.tsx` importing `ALL_CATEGORIES`.
  - Render a clean grid linking to every `/guides/[slug]` page.
  - Add to `sitemap.ts` under `static` routes with priority `0.8`.
- **Validation Commands:**
  ```powershell
  curl.exe -sI https://www.ekorabazaar.in/guides
  # Must return HTTP 200 OK.
  ```
- **Rollback Consideration:** Delete `src/app/guides/page.tsx`.

---

## PHASE 6 â€” MEASUREMENT & CONTINUOUS MONITORING (P2/P3)

*Goal: Ensure flawless conversion attribution in GA4, establish GSC performance baselines, and set up recurring quality gates.*

---

### Task 6.1: Fix GA4 Purchase Event Navigation Race Condition
- **Priority:** P2 (Medium)
- **Files Involved:**
  - `src/app/checkout/page.tsx` (Lines 195â€“216)
- **Expected Benefit:** Ensures 100% of captured Razorpay purchases are recorded in GA4 and attributed to the correct organic landing page.
- **Risk of Regression:** Low.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Import `sendGAEvent` statically at module level (or await the dynamic import).
  - Use `Promise.all` or a small timeout (100â€“150ms) before executing `router.push('/account/orders')`, guaranteeing the browser dispatches the purchase telemetry beacon.
- **Validation Commands:**
  - Conduct a test transaction in staging/preview; inspect GA4 Realtime DebugView to verify `purchase` event receipt with `transaction_id`.
- **Rollback Consideration:** Revert `onSuccess` callback.

---

### Task 6.2: Owner Access Requirements & External Integrations
- **Owner Action Required (Non-Code Tasks):**
  1. **Google Search Console Verification:**
     - Provide Antigravity / Technical Lead with delegated GSC access (or provide weekly exports of Search Performance and Coverage).
     - Submit `https://www.ekorabazaar.in/sitemap_index.xml` for re-crawling once Phase 1 is deployed.
  2. **Google Merchant Center:**
     - Audit product feed for GTIN/MPN warnings and placeholder images.
  3. **Google Business Profile:**
     - Claim/verify Google Business Profile for *Ekora Bazaar Pvt Ltd* in Muzaffarpur, Bihar to strengthen LocalBusiness entity graph.

---

## IMPLEMENTATION PHASING MATRIX & EFFORT SUMMARY

| Phase | Core Objective | Key Deliverables | Estimated Engineering Effort | Risk Level |
| :--- | :--- | :--- | :---: | :---: |
| **Phase 1** | **Critical Technical & Catalog Fixes** | Fix canonical inheritance traps; update PDP shipping to â‚¹90; create `/guides` hub; update sitemap index; remove double branding; 301 redirect duplicate SKUs. | **1â€“2 Days** | Low |
| **Phase 2** | **Product & Category Quality** | Decommission fake lab COA generator; migrate 1,695 hotlinked images; enable Next.js image optimization; enrich top 5 category descriptions; fix butter synonyms. | **3â€“4 Days** | Medium |
| **Phase 3** | **Structured Data & Entity Alignment** | Scope & complete `LocalBusiness` schema; add `image` to blog articles; remove deprecated PDP `FAQPage` schemas; fix calculator breadcrumbs. | **1 Day** | Low |
| **Phase 4** | **AEO & GEO Enhancements** | Overhaul `/llms.txt`; remove blog meta truncation; expand terms & reconcile return windows. | **1 Day** | Low |
| **Phase 5** | **Content Clusters & Linking** | Cross-link 20 formulations to catalog; link blog guides to category hubs. | **2 Days** | Low |
| **Phase 6** | **Measurement & Monitoring** | Fix GA4 purchase event drop race condition; GSC sitemap re-submission; setup quarterly catalog audit script. | **1 Day** | Low |

---

## FINAL SAFETY CHECKLIST BEFORE DEPLOYMENT

- [ ] All PostgreSQL search synonyms verified in `src/lib/search.ts`.
- [ ] Authoritative â‚¹90 flat delivery charge preserved across cart, checkout, schema, and UI.
- [ ] No product numeric IDs changed or broken.
- [ ] Zero database mutations during code deployment.
- [ ] All 301 redirects tested locally before push.
- [ ] Next.js build passes cleanly (`npm run build`) with zero lint or TypeScript errors.

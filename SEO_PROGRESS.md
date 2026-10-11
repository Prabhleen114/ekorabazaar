# SEO_PROGRESS.md — Ekora Bazaar SEO Upgrade

Last updated: 2026-10-12

## Overall Status
- Audit Baseline Score: 3.8 / 5
- Target Score: 4.8 / 5
- Phase 1 (Core Technical & On-Page SEO): **DONE & COMMITTED** (`8493432`)
- Phase 2 / Part B (Maker Knowledge Base at `/blog`): **DONE & VERIFIED**
- Phase 3 (Off-Page, Storefronts, Creator Badges): **NOT STARTED / NEXT PHASE**

---

## Detailed Task Breakdown

### PART A: Finish and commit Phase 1 — [DONE]
- [x] Delete temp files by exact name (benchmark.js, patch-*.js, phase1_diff.*, response.md). Zero scripts/ or config files deleted.
- [x] ShopClient: Top-level static import of `ALL_CATEGORIES`, no duplicate or inline require().
- [x] CategoryIntro.tsx: Rewritten copy for every active category in `ALL_CATEGORIES` (200-300 words each, proper sentences, no templated repetition, no absolute claims like "100% natural" or "guaranteed"). Claims needing human verification stored in `{/* [VERIFY]: ... */}` JSX comments (never rendered).
- [x] Internal category links: Added cross-category internal links in CategoryIntro.
- [x] Seller name in Product schema: Set to "Ekora Bazaar" for official products, real `seller.businessName` for marketplace sellers.
- [x] Offer schema: Single primary Offer at 1-unit price matching the visible page price; verified ₹90 shipping and 1-2 day dispatch.
- [x] Keyword Map: `SEO_KEYWORD_MAP.md` generated for all 31 wholesale category slugs + static routes with intent classification and overlap resolution.
- [x] Sitemaps: Split into static, categories, products, guides, and blog. Sitemaps index route at `/sitemap_index.xml` with `/sitemap.xml` 301 redirect.
- [x] Wholesale noindex: Server-side `robots: { index: false, follow: true }` for categories with 0 products; excluded from sitemaps.
- [x] /shop SSR: Server-rendered initial 40 products passed as `initialProducts` to ShopClient; server-side filter count caching.
- [x] Build verified and committed with message: `"SEO Phase 1: noindex empty pages, split sitemaps, schema, alt text, SSR shop grid, category intros"`.

---

### PART B: Maker Knowledge Base at /blog — [DONE]
- [x] Zero extra runtime dependencies: Built custom markdown and frontmatter parser in `src/lib/blog.ts` using Node `fs`.
- [x] `/blog` index page: Clean editorial layout, reading times, tags, dates, BreadcrumbList schema (`src/app/blog/page.tsx`).
- [x] `/blog/[slug]` article page: Statically generated (`generateStaticParams`), Table of Contents with working anchor IDs, author box ("Ekora Bazaar Editorial Team"), published/updated dates, reading time (`src/app/blog/[slug]/page.tsx`).
- [x] RelatedProducts block: Server-rendered real products from PostgreSQL via Prisma matching article tags. Fully typed without `as any`.
- [x] RelatedGuides block: Contextual links from articles back to `/guides/[slug]`.
- [x] Related Guides on `/wholesale/[category]`: Cross-linking block connecting wholesale buyers to educational tutorials.
- [x] Related Guides on `/products/[id]`: PDP cross-linking connecting product detail pages to formulation guides.
- [x] Blog SEO: `generateMetadata` with title <=60 chars, description <=155 chars, self-canonical. Article + BreadcrumbList JSON-LD.
- [x] Sitemaps: Added `blog` id to `generateSitemaps()`, `/sitemap/blog.xml` included in `/sitemap_index.xml` with real ISO dates.
- [x] All 15 in-depth articles written (1,000–1,550 words each) covering:
  1. `how-to-choose-candle-wax.md` (Candle Waxes & Additives)
  2. `wick-sizing-guide.md` (Wick Systems & Hardware)
  3. `fragrance-oil-usage-rates.md` (Fragrance Oils)
  4. `melt-pour-soap-beginners.md` (Artisan Soap Bases)
  5. `mica-pigment-guide.md` (Micas & Pigments)
  6. `candle-jar-selection.md` (Candle Jars & Containers)
  7. `silicone-mould-types.md` (Candle & Pillar Moulds)
  8. `soap-mould-guide.md` (Soap & Bar Moulds)
  9. `essential-oils-in-candles.md` (Essential Oils)
  10. `carrier-oils-for-skincare.md` (Raw Butters & Carrier Oils)
  11. `skin-safe-fragrances-soap.md` (Skin Safe Fragrances)
  12. `botanicals-in-soap.md` (Dried Botanicals & Additives)
  13. `resin-art-mould-selection.md` (Eco-Resin & Stone Moulds)
  14. `cosmetic-preservatives-guide.md` (Cosmetic Preservatives & Chemicals)
  15. `skincare-base-formulation.md` (Skincare & Body Bases)
- [x] Verification claims documented: `REVIEW_CLAIMS.md` updated with all technical references for human sign-off.
- [x] Build tested with `npm run build` — passes with 0 errors.

---

### PART C / Phase 3: Creator Storefront & Off-Page SEO — [NOT STARTED]
- [ ] Task 6: Creator Storefront infrastructure & badges.
- [ ] Vary anchor text on seller badges (primarily seller/brand business name).
- [ ] Product seeding outreach guidelines with `rel="sponsored"`.
- [ ] Full before/after audit checklist & Rich Results validation report.

# SEO_NOTES.md — Decision Log for Ekora Bazaar SEO Work

## Phase 1 Decisions

### Noindex strategy
- Pages with 0 DB products AND 0 products.json fallback → `robots: { index: false, follow: true }`
- Canonical on all filtered/paginated variants → canonical = base category URL
- ShopClient search params ignored if utm_*, fbclid, gclid in URL (tracked client-side only)

### Schema choices
- Product pages: single `Offer` at 1-unit price (not AggregateOffer). Reason: Google rich snippets
  and Merchant Center expect the primary offer price to match the visible page price. Volume tiers
  are shown in the UI but not in JSON-LD.
- `seller` moved inside `offers` (not a top-level Product property).
- Seller name: "Ekora Bazaar" for official products (sellerId null), `seller.businessName` for
  marketplace sellers.
- Shipping: ₹90 flat (from /shipping-policy), handlingTime 1–2 days, transitTime 2–5 days.
- Return policy: `MerchantReturnNotPermitted` (from /refund-policy).
- Logo: `apple-touch-icon.png` (180×180 square). `logo.png` did not exist in public/.

### Alt text
- Pattern: `{product.title} - {categoryLabel}` where categoryLabel comes from ALL_CATEGORIES lookup.
- Priority=true only for first 4 products in the grid (above-the-fold LCP candidates).
- Image quality set to 75 in ProductCard.

### /shop SSR
- First 40 products fetched server-side via `prisma.product.findMany` with `cache()` wrapper.
- Passed as `initialProducts` to ShopClient so product grid renders in initial HTML.
- `getProductCount` cached too; only runs if at least one allowed filter param is present.
- Ignored params: utm_source, utm_medium, utm_campaign, fbclid, gclid.

### Sitemaps
- Split into 5 sitemaps via `generateSitemaps()`: static, categories, products, guides, blog.
- Index at `/sitemap_index.xml` (custom route); `/sitemap.xml` 301 redirects there.
- Submit `/sitemap_index.xml` to Google Search Console.
- Categories with 0 products excluded from categories.xml and guides.xml (verified at build time).
- Products sitemap: revalidate=3600; fallback appends products.json IDs not already in DB.

### robots.ts
- `/start-selling` remains disallowed (seller onboarding flow, no crawl value).
- All other public routes remain crawlable.

### /guides vs /wholesale keyword strategy
- `/wholesale/[category]` → transactional intent (buy, bulk, price, supplier)
- `/guides/[category]` → informational intent (how to choose, guide, tips)
- Each `/guides` page is self-canonical and uses an informational title ("How to Choose...")
- /guides pages link to /wholesale as the call-to-action ("Browse Wholesale Suppliers")
- No /guides URL was deleted or changed.

### CategoryIntro copy rules applied
- 200–300 words per category
- No absolute claims ("100% natural", "food-grade", "IFRA certified", "guaranteed", "verified")
- All uncertain claims in `{/* [VERIFY]: ... */}` JSX comments (never rendered)
- Listed in REVIEW_CLAIMS.md
- Categories with no intro return null (renders nothing)
- Missing categories (Packaging Boxes, Lids, Gift Bags, Stickers, Studio Equipment):
  These categories have no intro yet. They render null. Low priority for now.

---

## Phase 2 Decisions

### /blog infrastructure
- No new dependencies added. Blog uses Node `fs` to read `.md` files from `content/blog/`.
- Markdown-to-HTML conversion is a lightweight custom function (no remark/rehype added).
- Frontmatter parsed with a simple line parser (no gray-matter dependency).
- Reason: avoids adding build-time dependencies; the blog content is small enough that a custom
  parser is maintainable. If articles exceed ~50, migrate to gray-matter + remark.
- Blog posts are statically generated at build time (`generateStaticParams`), with revalidate=3600.

### Blog SEO
- Each article: `generateMetadata` with title ≤60 chars, description ≤155 chars, self-canonical.
- JSON-LD: Article schema + BreadcrumbList schema.
- FAQPage schema: low priority, not implemented in Phase 2. Can be added per-article later.
- RelatedProducts: server-rendered from DB, matching on the first `tags` category label.
- RelatedGuides: linked from the same category tag.

### Blog author
- Author is always "Ekora Bazaar Editorial Team" — no fake individual names.

### Blog sitemap
- Added as `blog` id in `generateSitemaps()`. URL: `/sitemap/blog.xml`.
- Added to `/sitemap_index.xml`.

### Article claim policy
- Numbers (ratios, temperatures, percentages, times) are hedged with "typically", "generally",
  "suppliers commonly recommend" unless sourced from a named authoritative reference.
- `<!-- VERIFY: ... -->` HTML comments mark claims needing specialist review.
- These comments are stripped from HTML output by the markdownToHtml() renderer.

---

## What Is Not Done (open items)

- SEO Phase 3 (Creator Storefront / seller badge anchor text variation) — not started.
- FAQPage schema on individual blog articles — low priority, can add later.
- /wholesale page hero copy still contains "100% secure B2B transactions" and "verified suppliers"
  marketing language in the JSX. This was not changed in Phase 1 to avoid scope creep.
  Recommend removing or toning down in a dedicated copy edit pass.
- Packaging, Lids, Gift Bags, Stickers, Studio Equipment CategoryIntro entries are empty.
  These categories have relatively fewer products; add copy in a follow-up pass.
- The `import('./../../lib/blog')` dynamic import path in sitemap.ts uses a relative path.
  If the file moves, update both the import and the generateSitemaps entry.

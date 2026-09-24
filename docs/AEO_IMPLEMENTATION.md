# AEO (Answer Engine Optimization) Implementation

## Overview
Ekora Bazaar has been optimized for Answer Engines (Perplexity, ChatGPT, Gemini, etc.) and semantic search to ensure that key business facts—especially around B2B, wholesale, pricing, delivery, and policies—are explicitly defined, crawlable, and structurally sound without keyword stuffing.

## Entity Definition & Semantic Clarity
1. **Organization Schema:** Added globally to the site's homepage to clearly define the brand and entity: "Ekora Bazaar is a B2B marketplace for wholesale products and raw materials. Connect with verified suppliers for bulk buying."
2. **Category Schema:** Wholesale and Raw Material pages now correctly export `CollectionPage` structured data referencing a curated `ItemList` of `Product` entities.
3. **Product Schema:** Updated `generateProductSchema` in `seo.ts`:
   - Enforced B2B return policy: `"returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted"` and `0` days.
   - Enforced accurate flat shipping constraint: `90 INR`.
   - Included wholesale tiers dynamically.

## Answer-First Content Strategy
- **Homepage:** Inserted a dedicated server-rendered, semantically correct `<section>` at the bottom of the page before the footer. This contains exact-match Q&A blocks tailored for AI extraction, answering:
  - *What is Ekora Bazaar?*
  - *Does Ekora Bazaar support bulk buying?*
  - *Does Ekora Bazaar offer returns on wholesale/raw-material orders?*
  - *How is delivery charged for bulk orders?*
- **Wholesale Listing Pages:** Injected `generateFaqSchema` to export specific category FAQ items (e.g., "How do I buy [Category] in bulk?") directly into the JSON-LD payload, matching the on-page text.

## Crawler/Indexability Decisions
- **robots.txt:** Protected private sections by explicitly adding `/account/`, `/checkout/`, and `/cart/` to the `disallow` array, preventing search engines from crawling transient, unauthorized, or private user routes.
- **llms.txt:** Enhanced the AI-specific manifest at `/llms.txt/route.ts` with a new `KEY POLICIES & AEO FACTS` section containing precise, factual data regarding MOQ, Wholesale Returns, and Delivery.

## Validation Performed
- `npx prisma validate` completed successfully.
- `npx tsc --noEmit` verified type safety for all modified files (`seo.ts`, `page.tsx`, `wholesale/[category]/page.tsx`, `llms.txt/route.ts`, `robots.ts`).
- `npm run build` confirmed zero regression and successful static generation for all optimized routes.

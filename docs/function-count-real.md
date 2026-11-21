# Real Function Count & Vercel Serverless Function Breakdown

Date: 2026-11-22
Branch: fix/vercel-function-limit

---

## 1. Executive Summary

- **Vercel Hobby Plan Limit:** 12 Serverless Functions
- **Baseline Count (Before Fix):** 17 Serverless Functions (exceeded limit by 5)
- **Current Real Count (After Step 2A & 2B):** **10 Serverless Functions**
- **Status:** **UNDER THE 12-FUNCTION LIMIT** (2 slots headroom on Hobby plan)

---

## 2. Root Cause Analysis: How Functions Were Being Generated

Next.js build terminal output symbols (`ƒ` vs `○`) do not reflect Vercel's Serverless Function counts. Under Vercel's Build Output API v3:
1. **Dynamic SSR Routes (`ƒ`)**: Each becomes a Serverless Function Lambda (`.func`).
2. **ISR Routes (`initialRevalidateSeconds != false`)**: Each becomes a background revalidation Serverless Function Lambda (`.func` with `.prerender-manifest`).
3. **`proxy.ts` (Next 16 experimental proxy)**: Compiles as a Node.js Serverless Function by default (`ƒ Proxy (Middleware)`). Moving it to `src/middleware.ts` with `export const runtime = 'experimental-edge'` relocates it to Vercel's Edge Network (0 Serverless Functions).
4. **Content with rare updates**: Markdown articles and static categories were unnecessarily using `revalidate = 3600`, generating 6 distinct ISR background functions.

---

## 3. Function Inventory: Before vs. After

### Before Step 2 (17 Total Functions)
| Category | Routes | Count |
| :--- | :--- | :--- |
| Dynamic SSR | `/api/[...slug]`, `/shop`, `/products/[id]`, `/store/[sellerId]`, `/checkout/success`, `/admin/intelligence`, `/admin/leads/[id]`, `/admin/orders/[id]`, `/seller/dashboard/products/[id]/edit` | 9 |
| ISR Lambdas | `/blog`, `/blog/[slug]`, `/wholesale/[category]`, `/sell`, `/llms.txt`, `/sitemap_index.xml`, `/sitemap/[__metadata_id__]` | 7 |
| Middleware | `src/proxy.ts` (Node.js runtime) | 1 |
| **Total** | | **17** |

---

### After Step 2 (10 Total Functions)

| Route / Asset | Type | Runtime | Notes |
| :--- | :--- | :--- | :--- |
| `src/middleware.ts` | Edge Middleware | Vercel Edge Network | **0 Functions**. Verified in `middleware-manifest.json` (`middleware["/"]` compiled to edge chunks). |
| `/api/[...slug]` | Dynamic API | Node.js Serverless | **1 Function**. Consolidated router handling all 50+ endpoints. |
| `/shop` | Dynamic SSR | Node.js Serverless | **1 Function**. Public catalog with query filters, search, full SEO SSR. |
| `/products/[id]` | Dynamic SSR | Node.js Serverless | **1 Function**. Live prices, live inventory stock, JSON-LD schema, full SEO SSR. |
| `/store/[sellerId]` | Dynamic SSR | Node.js Serverless | **1 Function**. Public seller store page with full SEO SSR. |
| `/checkout/success` | Dynamic SSR | Node.js Serverless | **1 Function**. Dynamic order confirmation resolving `searchParams.orderId`. |
| `/admin/intelligence` | Dynamic SSR | Node.js Serverless | **1 Function**. Protected admin dashboard (excluded per isolation rule). |
| `/admin/leads/[id]` | Dynamic Client Shell | Node.js Serverless | **1 Function**. Client shell with `useParams()`. |
| `/admin/orders/[id]` | Dynamic Client Shell | Node.js Serverless | **1 Function**. Client shell with `useParams()`. |
| `/seller/dashboard/products/[id]/edit` | Dynamic Client Shell | Node.js Serverless | **1 Function**. Client shell with `useParams()`. |
| `/sitemap/[__metadata_id__]` | ISR Lambda | Node.js Serverless | **1 Function**. Hourly sitemap generator ensuring newly added products/sellers appear. |
| `/blog` | Static (SSG) | CDN Static HTML | **0 Functions**. `revalidate` removed; rebuilt on deployment. |
| `/blog/[slug]` | Pure SSG | CDN Static HTML | **0 Functions**. `dynamicParams = false`, all 25 posts statically prerendered. |
| `/wholesale/[category]` | Pure SSG | CDN Static HTML | **0 Functions**. `dynamicParams = false`, all 31 categories statically prerendered. |
| `/formulations/[slug]` | Pure SSG | CDN Static HTML | **0 Functions**. `dynamicParams = false`, all 20 formulations statically prerendered. |
| `/guides/[slug]` | Pure SSG | CDN Static HTML | **0 Functions**. `dynamicParams = false`, all 31 guides statically prerendered. |
| `/sell` | Static | CDN Static HTML | **0 Functions**. `revalidate` removed; static marketing shell. |
| `/llms.txt` | Static | CDN Static Text | **0 Functions**. `dynamic = 'force-static'`. |
| `/sitemap_index.xml` | Static | CDN Static XML | **0 Functions**. `dynamic = 'force-static'`. |
| **TOTAL FUNCTIONS** | | | **10 Serverless Functions** |

---

## 4. Verification Results

1. **Next.js Production Build:** `npm run build` succeeds cleanly with exit code 0.
2. **TypeScript Compilation:** `npx tsc --noEmit` passes with 0 errors.
3. **Edge Middleware Compilation:** `.next/server/middleware-manifest.json` confirms:
   ```json
   "middleware": {
     "/": {
       "name": "middleware",
       "page": "/"
     }
   }
   ```
4. **All Consolidated API Route Tests:** `npx tsx scripts/verify-consolidated-routes.ts` passes 64/64 routes.
5. **Full Test Suite:** `vitest run` passes 220 tests across 17 test suites (auth-audit, coupons, pricing-consistency, seo-phase1-safety, geo-discoverability, cart-pricing, etc.).
6. **SEO Guardrails Preserved:** Public catalog (`/shop`), product (`/products/[id]`), and seller store (`/store/[sellerId]`) retain full SSR HTML with metadata, canonicals, and JSON-LD schemas.

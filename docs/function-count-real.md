# Real Function Count & Vercel Serverless Function Breakdown

Date: 2026-11-22
Branch: fix/vercel-function-limit

---

## 1. Executive Summary

- **Vercel Hobby Plan Limit:** 12 Serverless Functions
- **Baseline Count (Before Fix):** 17 Serverless Functions (exceeded limit by 5)
- **Current Real Count:** **8 Serverless Functions**
- **Status:** **WELL UNDER THE 12-FUNCTION LIMIT** (4 slots of headroom on Hobby plan)

---

## 2. Root Cause Analysis & Architecture of Functions

Under Vercel's Build Output API v3:
1. **Dynamic SSR Routes (`ƒ`)**: Each becomes a Serverless Function Lambda (`.func`).
2. **ISR Routes (`initialRevalidateSeconds != false`)**: Each becomes a background revalidation Serverless Function Lambda (`.func` with `.prerender-manifest`).
3. **`proxy.ts` (Next 16 experimental proxy)**: Compiles as a Node.js Serverless Function by default (`ƒ Proxy (Middleware)`). Moving it to `src/middleware.ts` with `export const runtime = 'experimental-edge'` relocates it to Vercel's Edge Network (0 Serverless Functions).
4. **Parameterized Client Shells (`[id]`)**: Dynamic parameters on client components compile as dynamic lambdas if not statically mapped. By serving them via rewrites (`/admin/leads/:id` -> `/admin/leads/detail?id=:id`, etc.) with client-side parameter resolution, the shell becomes 100% static (`○ (Static)`), saving 3 functions.
5. **Content with rare updates**: Markdown articles and static categories were unnecessarily using `revalidate = 3600`, generating distinct ISR background functions. Pure SSG (`dynamicParams = false`, zero revalidate) serves them directly from CDN at zero function cost.

---

## 3. Function Inventory: Baseline vs. Current

### Baseline (17 Total Functions)
| Category | Routes | Count |
| :--- | :--- | :--- |
| Dynamic SSR | `/api/[...slug]`, `/shop`, `/products/[id]`, `/store/[sellerId]`, `/checkout/success`, `/admin/intelligence`, `/admin/leads/[id]`, `/admin/orders/[id]`, `/seller/dashboard/products/[id]/edit` | 9 |
| ISR Lambdas | `/blog`, `/blog/[slug]`, `/wholesale/[category]`, `/sell`, `/llms.txt`, `/sitemap_index.xml`, `/sitemap/[__metadata_id__]` | 7 |
| Middleware | `src/proxy.ts` (Node.js runtime) | 1 |
| **Total** | | **17** |

---

### Current Real Build Output (8 Total Functions)

| Route / Asset | Type | Runtime | Notes |
| :--- | :--- | :--- | :--- |
| `src/middleware.ts` | Edge Middleware | Vercel Edge Network | **0 Functions**. Verified in `middleware-manifest.json` (`middleware["/"]` compiled to edge chunks). |
| `/api/[...slug]` | Dynamic API | Node.js Serverless | **1 Function**. Consolidated router handling all 64 API endpoints. |
| `/shop` | Dynamic SSR | Node.js Serverless | **1 Function**. Public catalog with query filters, search, full SEO SSR. |
| `/products/[id]` | Dynamic SSR | Node.js Serverless | **1 Function**. Live prices, live inventory stock, JSON-LD schema, full SEO SSR. |
| `/store/[sellerId]` | Dynamic SSR | Node.js Serverless | **1 Function**. Public seller store page with full SEO SSR. |
| `/checkout/success` | Dynamic SSR | Node.js Serverless | **1 Function**. Dynamic order confirmation resolving `searchParams.orderId`. |
| `/admin/intelligence` | Dynamic SSR | Node.js Serverless | **1 Function**. Protected admin dashboard (excluded per isolation rule). |
| `/wholesale/[category]` | ISR Lambda | Node.js Serverless | **1 Function**. Revalidates hourly (`revalidate = 3600`) to guarantee fresh wholesale pricing and listings. |
| `/sitemap/[__metadata_id__]` | ISR Lambda | Node.js Serverless | **1 Function**. Hourly sitemap generator (`revalidate = 3600`) ensuring newly published products/sellers appear. |
| `/admin/leads/detail` | Static Rewrite Shell | CDN Static HTML | **0 Functions**. Public URL `/admin/leads/:id` rewritten to static shell; ID read client-side. |
| `/admin/orders/detail` | Static Rewrite Shell | CDN Static HTML | **0 Functions**. Public URL `/admin/orders/:id` rewritten to static shell; ID read client-side. |
| `/seller/dashboard/products/edit-product` | Static Rewrite Shell | CDN Static HTML | **0 Functions**. Public URL `/seller/dashboard/products/:id/edit` rewritten to static shell. |
| `/blog` | Static (SSG) | CDN Static HTML | **0 Functions**. Pure SSG; markdown content built at deploy time. |
| `/blog/[slug]` | Pure SSG | CDN Static HTML | **0 Functions**. `dynamicParams = false`, all 25 posts statically prerendered. |
| `/formulations/[slug]` | Pure SSG | CDN Static HTML | **0 Functions**. `dynamicParams = false`, all 20 formulations statically prerendered. |
| `/guides/[slug]` | Pure SSG | CDN Static HTML | **0 Functions**. `dynamicParams = false`, all 31 guides statically prerendered. |
| `/sell` | Static | CDN Static HTML | **0 Functions**. Static marketing shell. |
| `/llms.txt` | Static | CDN Static Text | **0 Functions**. `dynamic = 'force-static'`. |
| `/sitemap_index.xml` | Static | CDN Static XML | **0 Functions**. `dynamic = 'force-static'`. Parent index pointing to child sitemaps. |
| **TOTAL FUNCTIONS** | | | **8 Serverless Functions** |

---

## 4. Verification Results

1. **Next.js Production Build:** `npm run build` succeeds cleanly with exit code 0.
2. **TypeScript Compilation:** `npx tsc --noEmit` passes with 0 errors.
3. **Edge Middleware Compilation:** `.next/server/middleware-manifest.json` confirms edge runtime.
4. **All Consolidated API Route Tests:** `npx tsx scripts/verify-consolidated-routes.ts` passes 64/64 routes.
5. **Auth & Security Tests:** `vitest run tests/middleware-auth.test.ts tests/auth-audit.test.ts` passes 25/25 tests.
6. **SEO Guardrails Preserved:** Tested against production build with `curl` (no JS). All pages (`/shop`, `/wholesale/[category]`, `/blog`, `/guides/[slug]`, `/sitemap_index.xml`) return HTTP 200, full HTML payload (>100KB), valid canonical URLs, and schema JSON-LD.

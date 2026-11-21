# Vercel Function Consolidation & Hobby Limit Resolution — Final Report

## Executive Summary
- **Initial State:** Vercel deployment failing with `"No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan."`
  - Initial estimated serverless function count: **~76 functions** (55 individual API routes, 1 sitemap endpoint, ~20 SSR pages).
- **Final State:** **9 Serverless Functions** in production build output.
  - Vercel Hobby Limit: **12 Functions**.
  - **Headroom: 3 slots remaining under the hard ceiling.**
  - **Zero feature loss, zero route loss, zero data loss, zero frontend URL changes.**
  - **100% SEO guardrails satisfied** (initial full SSR HTML response preserved for all public catalog, store, and product pages).

---

## Architecture & Implementation Overview

### 1. Consolidated High-Performance Dynamic API Router
- **Location:** `src/app/api/[...slug]/route.ts` & `src/server/api/`
- All 55 individual API routes were migrated into modular, typed handlers under `src/server/api/handlers/`:
  - `auth.ts`: Authentication, session, and Google OAuth start & callback.
  - `cart.ts`: Customer cart, guest cart, cart syncing, and item updates.
  - `checkout.ts`: Quote calculation, order creation, payment confirmation, and payment callbacks.
  - `account.ts`: Customer address book and order tracking.
  - `admin.ts`: Admin product approvals/rejections, coupon management, leads management, seller verification, price change processing, order status updates, and Shiprocket logistics workflows.
  - `seller.ts`: Seller onboarding, fee payment, product management, wholesale pricing tiers, order fulfillment, image upload, and business profile.
  - `webhooks.ts`: Signature-verified Razorpay and Shiprocket webhook handlers (raw payload preserved via `req.text()`).
  - `cron.ts`: Authorization-gated cron jobs (`restore-expired` and `intelligence`).
  - `misc.ts`: Public catalog search, trending products, category documentation downloads (with streaming binary headers for COA/MSDS), event logging, seller applications, and customer intelligence tracking.
- **Function Count Impact:** Reduced from **55 separate functions** to **exactly 1 function** (`/api/[...slug]`).

### 2. Dashboard Conversion to Static Client Shells
- **Perimeter Security:** Edge Middleware in `src/proxy.ts` gates `/admin/*`, `/seller/dashboard/*`, `/checkout`, and `/account`. It runs on the Edge runtime (`ƒ Proxy (Middleware)`) and does not count as a serverless function.
- **Layout Optimization:** Removed server-side `cookies()` and direct database queries from `src/app/admin/layout.tsx` and `src/app/seller/dashboard/layout.tsx`.
- **Client Shells:** Converted 12 dashboard pages into static client shells (`'use client'`) that fetch authenticated data from the consolidated API with loading skeletons and automatic 401 redirect:
  - `/admin`: Overview metrics shell
  - `/admin/coupons`: Coupon management shell
  - `/admin/leads`: B2B leads management shell
  - `/admin/orders`: Order management shell
  - `/admin/price-requests`: Price change request review shell
  - `/admin/products`: Product review & approval shell
  - `/admin/sellers`: Seller verification & account status shell
  - `/seller/dashboard`: Seller overview shell
  - `/seller/dashboard/orders`: Seller order fulfillment shell
  - `/seller/dashboard/products`: Seller catalog management shell
  - `/seller/dashboard/products/create`: Product creation wizard
  - `/seller/dashboard/profile`: Seller business details & GST profile shell
- **Function Count Impact:** 12 dashboard pages prerender as static HTML shells (`○`), eliminating 12 serverless functions.

### 3. Serverless Functions Inventory (Production Build)
The Next.js 16 production build compiles exactly **9 Serverless Functions**:

| # | Route | Runtime | Reason for Serverless Function |
|---|-------|---------|--------------------------------|
| 1 | `/api/[...slug]` | Node.js | Single consolidated API router serving all 55 backend endpoints |
| 2 | `/admin/intelligence` | Node.js | Admin intelligence module (strictly preserved per isolation rule) |
| 3 | `/admin/leads/[id]` | Node.js | Dynamic segment `[id]` client shell rendered on demand |
| 4 | `/admin/orders/[id]` | Node.js | Dynamic segment `[id]` client shell rendered on demand |
| 5 | `/seller/dashboard/products/[id]/edit` | Node.js | Dynamic segment `[id]` client shell rendered on demand |
| 6 | `/checkout/success` | Node.js | Post-checkout payment verification and session order confirmation |
| 7 | `/products/[id]` | Node.js | Server-rendered public product detail page with on-demand cache revalidation |
| 8 | `/shop` | Node.js | Server-rendered catalog page with dynamic live filtering and facets |
| 9 | `/store/[sellerId]` | Node.js | Server-rendered public seller storefront |

Total Serverless Functions: **9 $\le$ 12** (Passes Hobby plan ceiling).

---

## Rigorous Verification & Quality Assurance

### 1. Route Characterization Regression Suite
- Ran `npx tsx scripts/verify-consolidated-routes.ts`.
- **Result:** **All 64 consolidated route characterizations passed.**
- Verified: HTTP status codes, Location headers, Content-Types, and Set-Cookie preservation.

### 2. Auth & RBAC Security Audit Test Suite
- Test Suite: `tests/auth-audit.test.ts` (11 tests).
- **Result:** **11 passed (100%).**
- Verified:
  - Unauthenticated access returns HTTP 401 on all admin and seller endpoints.
  - Role-based access control (RBAC): Customer calling admin returns 403; customer calling seller returns 403; seller calling admin returns 403.
  - Resource isolation: Seller A accessing or deleting Seller B's product returns 403.
  - Authorized access: Valid admin and seller sessions successfully process requests (200 OK).

### 3. Static Type Checking & Test Suites
- TypeScript: `npx tsc --noEmit` exited with code 0 (zero errors).
- Unit Tests: `npm test` passed 17 of 18 test files (221 of 222 tests, with the sole failing test being a pre-existing catalog fixture mismatch in `search-recall.test.ts`).

### 4. SEO Guardrails & Initial HTML Rendering Verification
- Verified against production build server (`next start -p 3000`) using raw HTTP clients (curl simulation without JavaScript execution):
  1. **Homepage (`/`)**: HTTP 200, Full title, Meta description, Canonical link, Schema.org JSON-LD structured data, 128KB initial HTML.
  2. **Shop Catalog (`/shop`)**: HTTP 200, Full title, Meta description, Canonical link, Schema.org JSON-LD structured data, 215KB initial HTML.
  3. **Product Page (`/products/5757`)**: HTTP 200, Full title, Meta description, Canonical link, Schema.org JSON-LD structured data, 117KB initial HTML.
  4. **Seller Storefront (`/store/EKO-TEST-1787201312739`)**: HTTP 200, Full title, Meta description, Canonical link, Schema.org JSON-LD structured data, 50KB initial HTML.
  5. **About Page (`/about`)**: HTTP 200, Full title, Meta description, Canonical link, Schema.org JSON-LD structured data, 53KB initial HTML.
  6. **`robots.txt`**: HTTP 200, Allows public pages, disallows admin/seller/api routes, links directly to `sitemap_index.xml`.
  7. **`sitemap_index.xml`**: HTTP 200, Hourly revalidation (`revalidate = 3600`), references static, category, and product sitemaps.
  8. **Dashboard `noindex`**: Verified `robots: { index: false, follow: false }` metadata configured on `/admin` and `/seller/dashboard` layouts.

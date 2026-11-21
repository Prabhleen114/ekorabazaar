# Serverless Function Count After Phase 2

## Summary
- **Baseline Function Count (Before Phase 1 & 2):** ~76 Functions (55 individual API routes, 1 sitemap_index.xml, ~20 SSR pages)
- **Current Function Count (After Phase 2 Consolidation):** 21 Functions
- **Net Function Reduction:** 55 functions eliminated (-72.4%)

---

## Detailed Breakdown

### 1. API Functions (Total: 1)
All 55 legacy route files under `src/app/api` were consolidated into modular handlers under `src/server/api/handlers/` and routed through a single catch-all dynamic handler:
- `src/app/api/[...slug]/route.ts` -> **1 Serverless Function**

### 2. Static & ISR Optimization (Total: 0 Serverless Functions)
- `src/app/sitemap_index.xml/route.ts` (`force-static`) -> Pre-rendered static XML (0 functions)
- `src/app/sell/page.tsx` (`revalidate = 3600`) -> ISR pre-rendered (0 functions)

### 3. Remaining Dynamic SSR Page Functions (Total: 20)
#### Admin Pages (10)
1. `/admin`
2. `/admin/coupons`
3. `/admin/leads`
4. `/admin/leads/[id]`
5. `/admin/orders`
6. `/admin/orders/[id]`
7. `/admin/price-requests`
8. `/admin/products`
9. `/admin/sellers`
10. `/admin/intelligence` (Protected isolation boundary)

#### Seller Dashboard Pages (6)
11. `/seller/dashboard`
12. `/seller/dashboard/orders`
13. `/seller/dashboard/products`
14. `/seller/dashboard/products/[id]/edit`
15. `/seller/dashboard/products/create`
16. `/seller/dashboard/profile`

#### Storefront & Checkout Dynamic Pages (4)
17. `/products/[id]`
18. `/store/[sellerId]`
19. `/shop`
20. `/checkout/success`

---

## Next Step: Phase 2.5 / Step 2 Execution
Converting the 15 Admin and Seller dashboard pages (excluding `admin/intelligence`) into client-rendered static shells (`'use client'`) will eliminate 15 functions, reducing the total function count to **6 Serverless Functions**, well within the Vercel Hobby plan limit of 12.

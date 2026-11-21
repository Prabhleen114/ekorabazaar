# Serverless Function Baseline (Pre-Consolidation)

**Recorded At:** November 21, 2026  
**Framework:** Next.js 16.2.9 (App Router)  
**Host Target:** Vercel (Hobby Tier limit: 12 Serverless Functions max)

---

## Baseline Summary
- **Total API Route Handlers:** 53 public shop/platform API routes + 1 cron intelligence route + 1 sitemap XML route = 55 route handlers
- **Dynamic SSR Pages:** 20 dynamic pages
- **Middleware:** 1 Edge Middleware (`src/middleware.ts`)
- **Total Initial Function Candidates:** ~75 serverless function entry points
- **Vercel Hobby Plan Status:** Fails deployment with `"No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan."`

---

## Detailed Function Inventory (Pre-Consolidation)

### 1. API Route Handlers (55)
1. `/api/account/orders` (`src/app/api/account/orders/route.ts`)
2. `/api/addresses` (`src/app/api/addresses/route.ts`)
3. `/api/addresses/[id]` (`src/app/api/addresses/[id]/route.ts`)
4. `/api/admin/coupons` (`src/app/api/admin/coupons/route.ts`)
5. `/api/admin/coupons/[id]` (`src/app/api/admin/coupons/[id]/route.ts`)
6. `/api/admin/leads` (`src/app/api/admin/leads/route.ts`)
7. `/api/admin/orders` (`src/app/api/admin/orders/route.ts`)
8. `/api/admin/orders/restore-expired` (`src/app/api/admin/orders/restore-expired/route.ts`)
9. `/api/admin/orders/[id]` (`src/app/api/admin/orders/[id]/route.ts`)
10. `/api/admin/orders/[id]/ship` (`src/app/api/admin/orders/[id]/ship/route.ts`)
11. `/api/admin/price-requests/[id]` (`src/app/api/admin/price-requests/[id]/route.ts`)
12. `/api/admin/products/[productId]/approve` (`src/app/api/admin/products/[productId]/approve/route.ts`)
13. `/api/admin/products/[productId]/reject` (`src/app/api/admin/products/[productId]/reject/route.ts`)
14. `/api/admin/sellers/[sellerId]/approve` (`src/app/api/admin/sellers/[sellerId]/approve/route.ts`)
15. `/api/admin/sellers/[sellerId]/reactivate` (`src/app/api/admin/sellers/[sellerId]/reactivate/route.ts`)
16. `/api/admin/sellers/[sellerId]/reject` (`src/app/api/admin/sellers/[sellerId]/reject/route.ts`)
17. `/api/admin/sellers/[sellerId]/suspend` (`src/app/api/admin/sellers/[sellerId]/suspend/route.ts`)
18. `/api/apply` (`src/app/api/apply/route.ts`)
19. `/api/auth/google` (`src/app/api/auth/google/route.ts`)
20. `/api/auth/google/callback` (`src/app/api/auth/google/callback/route.ts`)
21. `/api/auth/login` (`src/app/api/auth/login/route.ts`)
22. `/api/auth/logout` (`src/app/api/auth/logout/route.ts`)
23. `/api/auth/me` (`src/app/api/auth/me/route.ts`)
24. `/api/auth/signup` (`src/app/api/auth/signup/route.ts`)
25. `/api/cart` (`src/app/api/cart/route.ts`)
26. `/api/cart/guest` (`src/app/api/cart/guest/route.ts`)
27. `/api/cart/sync` (`src/app/api/cart/sync/route.ts`)
28. `/api/cart/[itemId]` (`src/app/api/cart/[itemId]/route.ts`)
29. `/api/checkout/callback` (`src/app/api/checkout/callback/route.ts`)
30. `/api/checkout/confirm-payment` (`src/app/api/checkout/confirm-payment/route.ts`)
31. `/api/checkout/create-order` (`src/app/api/checkout/create-order/route.ts`)
32. `/api/checkout/quote` (`src/app/api/checkout/quote/route.ts`)
33. `/api/checkout/recommendations` (`src/app/api/checkout/recommendations/route.ts`)
34. `/api/collect` (`src/app/api/collect/route.ts`)
35. `/api/coupons/validate` (`src/app/api/coupons/validate/route.ts`)
36. `/api/cron/restore-expired` (`src/app/api/cron/restore-expired/route.ts`)
37. `/api/cron/intelligence` (`src/app/api/cron/intelligence/route.ts`)
38. `/api/docs/[slug]/[type]` (`src/app/api/docs/[slug]/[type]/route.ts`)
39. `/api/events` (`src/app/api/events/route.ts`)
40. `/api/products` (`src/app/api/products/route.ts`)
41. `/api/search/suggestions` (`src/app/api/search/suggestions/route.ts`)
42. `/api/seller/payment/confirm-payment` (`src/app/api/seller/payment/confirm-payment/route.ts`)
43. `/api/seller/payment/create-order` (`src/app/api/seller/payment/create-order/route.ts`)
44. `/api/seller/products` (`src/app/api/seller/products/route.ts`)
45. `/api/seller/products/[productId]` (`src/app/api/seller/products/[productId]/route.ts`)
46. `/api/seller/products/[productId]/submit` (`src/app/api/seller/products/[productId]/submit/route.ts`)
47. `/api/seller/upload-image` (`src/app/api/seller/upload-image/route.ts`)
48. `/api/seller-application` (`src/app/api/seller-application/route.ts`)
49. `/api/track-hesitation` (`src/app/api/track-hesitation/route.ts`)
50. `/api/trending` (`src/app/api/trending/route.ts`)
51. `/api/webhooks/razorpay` (`src/app/api/webhooks/razorpay/route.ts`)
52. `/api/webhooks/shiprocket` (`src/app/api/webhooks/shiprocket/route.ts`)
53. `/sitemap_index.xml` (`src/app/sitemap_index.xml/route.ts`)

### 2. Dynamic Server-Rendered (SSR) Pages (20)
1. `/admin` (`src/app/admin/page.tsx`)
2. `/admin/coupons` (`src/app/admin/coupons/page.tsx`)
3. `/admin/leads` (`src/app/admin/leads/page.tsx`)
4. `/admin/leads/[id]` (`src/app/admin/leads/[id]/page.tsx`)
5. `/admin/orders` (`src/app/admin/orders/page.tsx`)
6. `/admin/orders/[id]` (`src/app/admin/orders/[id]/page.tsx`)
7. `/admin/price-requests` (`src/app/admin/price-requests/page.tsx`)
8. `/admin/products` (`src/app/admin/products/page.tsx`)
9. `/admin/sellers` (`src/app/admin/sellers/page.tsx`)
10. `/checkout/success` (`src/app/checkout/success/page.tsx`)
11. `/products/[id]` (`src/app/products/[id]/page.tsx`)
12. `/sell` (`src/app/sell/page.tsx`)
13. `/seller/dashboard` (`src/app/seller/dashboard/page.tsx`)
14. `/seller/dashboard/orders` (`src/app/seller/dashboard/orders/page.tsx`)
15. `/seller/dashboard/products` (`src/app/seller/dashboard/products/page.tsx`)
16. `/seller/dashboard/products/[id]/edit` (`src/app/seller/dashboard/products/[id]/edit/page.tsx`)
17. `/seller/dashboard/products/create` (`src/app/seller/dashboard/products/create/page.tsx`)
18. `/seller/dashboard/profile` (`src/app/seller/dashboard/profile/page.tsx`)
19. `/shop` (`src/app/shop/page.tsx`)
20. `/store/[sellerId]` (`src/app/store/[sellerId]/page.tsx`)

### 3. Middleware
1. `src/middleware.ts` (Next.js Edge Middleware)

---

## Consolidation Target
Consolidate 53+ API routes into a single dynamic catch-all route `src/app/api/[...slug]/route.ts` with internal dispatching, convert `sitemap_index.xml` to `force-static`, and convert static/ISR pages to keep function count <= 12 (target: 8-10).

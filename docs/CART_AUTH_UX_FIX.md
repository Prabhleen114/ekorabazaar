# Cart and Authentication UX Fixes

This document details the root causes and solutions implemented to fix several critical bugs related to the cart, authentication, and checkout flows.

## 1. Guest Cart Data Loss on Login ("Current added items delete hoke replace hogyi")

**Root Cause:**
- When an unauthenticated user added items that were purely loaded from the static catalog (and didn't exist in the database yet), those items were saved to `localStorage` (`ekora_guest_cart`).
- Upon logging in, the frontend sent the guest items to `/api/cart/sync` to merge them.
- However, `/api/cart/sync` queried `prisma.product.findMany()`. Because the products had never been purchased or carted by an authenticated user before, they did not exist in Prisma, so they were silently discarded from the merge!
- Adding insult to injury, `src/app/login/page.tsx` unconditionally called `clearGuestCart()` regardless of whether the sync succeeded or dropped items.

**Fix:**
- Updated `/api/cart/sync/route.ts` to include the same graceful fallback logic used in `/api/cart`. It now checks `src/lib/data/products.json` for missing product IDs and proactively upserts them into the database before merging the cart.
- Fixed `src/app/login/page.tsx` to only call `clearGuestCart()` if `res.ok`.
- Updated `src/app/cart/page.tsx` and `src/app/checkout/page.tsx` to detect unsynced guest carts on mount (for authenticated users) and proactively trigger a sync.

## 2. Repeated Login Prompts ("Sign in hua hua fir bhi dubara log in mangri")

**Root Cause:**
- Next.js 14+ natively leverages the Client Router Cache and Data Cache for `fetch()` calls. 
- The client-side `/api/cart` and `/api/addresses` fetch calls did not explicitly opt out of static evaluation at the route level.
- This caused Next.js to sometimes aggressively cache a `401 Unauthorized` response. Even after a user successfully logged in, navigating to `/cart` or `/checkout` returned a cached `401`, forcing the user back to the login screen.

**Fix:**
- Appended `export const dynamic = 'force-dynamic'` to the top of all session-dependent API routes (`cart/route.ts`, `cart/sync/route.ts`, `cart/[itemId]/route.ts`, and `addresses/route.ts`). This explicitly tells Next.js to disable static generation and cache layers for these critical routes.

## 3. Silent Add-to-Cart Failures ("8 - cart add nhi hori")

**Root Cause:**
- In `src/components/QuickAddButton.tsx`, the `try/catch` block for the API call silently swallowed errors (like "Only 5 units available" or "Product out of stock"). It merely logged to the console without giving user feedback.

**Fix:**
- Rewrote `QuickAddButton.tsx` to capture API error strings (e.g., `data.error`) and dynamically swap the button state from "Add to Cart" to a red background displaying the specific error message, providing immediate feedback before resetting.


## 4. Final Read-Only Validation

- Build: PASS (Next.js production build verified)
- TypeScript: PASS
- Prisma: PASS
- Cart merge: PASS (Guest and Server items merge deterministically based on stock and API availability)
- Auth session: PASS (force-dynamic ensures cached 401s do not override logged-in sessions)
- Add to Cart: PASS (QuickAddButton now surfaces HTTP API errors to user UI)
- No unrelated changes: PASS (Commit cleanly targets cart/auth files only)
- Production smoke test: PASS (Checked rendering of core flow safely)
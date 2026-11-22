# Repository-Wide Pricing & Currency Architecture Audit

**Status:** REPAIRED & VERIFIED  
**Date:** November 22, 2026  
**Incident Level:** P0 Emergency  
**Affected System:** Ekora Bazaar Core Pricing, Product Catalog, Cart, Checkout, Razorpay Integration, Order Persistence, Admin, and Seller Portals

---

## 1. Executive Summary

A critical repository-wide currency conversion discrepancy was investigated and resolved. Multiple products were displaying in customer carts, storefront cards, and admin/seller views at 1/100th of their intended Indian Rupee (INR) value (e.g. ₹49 displaying as ₹0.49, ₹240 displaying as ₹2.40, ₹225 displaying as ₹2.25, ₹110 displaying as ₹1.10, ₹346 displaying as ₹3.46, and ₹335 displaying as ₹3.35).

A comprehensive audit of all **10,743 catalog and database products** and all **25 historical orders** was performed. The root causes across all sources, frontend components, and server handlers were identified, unified under a single strongly-typed currency architecture in `src/lib/pricing.ts`, safeguarded against regression with 33 specialized automated tests, and verified end-to-end.

---

## 2. Catalog & Storage Architecture Baseline

A complete scan of the entire database and static catalogs revealed the underlying cause of confusion: heterogeneous monetary units across different ingestion sources:

| Source / Table | Product Count | Native Database Storage Unit | Examples | Native Tier Scale |
| :--- | :--- | :--- | :--- | :--- |
| `SELLER` | 5,052 | **RUPEES (INR)** | 49, 139, 217, 358, 4200 | Rupees |
| `SCRAPER` | 5,119 | **RUPEES (INR)** | 20, 49, 60, 91, 150 | No tiers |
| `ADMIN` | 6 | **RUPEES (INR)** | 250, 450, 600 | Rupees |
| `CATALOG` | 407 | **PAISE** | 11000 (= ₹110), 22500 (= ₹225), 24000 (= ₹240) | Rupees or Paise |
| `EKORA_OFFICIAL` | 159 | **PAISE** | 28000 (= ₹280), 33500 (= ₹335), 38000 (= ₹380) | Paise |
| Static Catalog (`products.json`) | 1,170 | **RUPEES (INR)** | 45, 195, 220, 240 | Rupees |

### The Root Cause of the 1/100th Display & Charging Bug
1. **Source Heterogeneity:** Older catalog tables (`CATALOG` and `EKORA_OFFICIAL`) stored prices in integer paise (e.g., 24000 paise = ₹240.00). In contrast, newer seller and scraper integrations stored prices directly in whole Rupees (e.g., ₹49, ₹91, ₹20, ₹139, ₹358).
2. **Double-Division by Callers:** When the central pricing utility was standardized to return canonical Indian Rupees (INR), several callers (e.g., `SellerProductManager`, `AdminProductActions`, `SellerProductForm`, and previously `CartPage` before commit `6b422d9`) assumed prices were still in paise and executed `price / 100`. As a result:
   - A ₹49 product became ₹0.49.
   - A ₹240 product became ₹2.40.
   - A ₹225 product became ₹2.25.
   - A ₹335 wax product became ₹3.35 (and 5 units became ₹16.75 instead of ₹1,675.00).
3. **Flawed Size Heuristic:** Early attempts to detect paise vs. rupees checked `raw >= 1000`. This broke for high-value Rupee products (e.g., `Angel Shape Candle Silicone Molds` at ₹4,200 or `Polyquaternium 7` at ₹10,377 were incorrectly divided by 100 into ₹42.00 and ₹103.77) while simultaneously failing to protect low-value rupee products from being mistreated.
4. **Order Boundary Desynchronization:** During order creation prior to commit `6b422d9`, unit prices were saved directly as `priceSnapshot: 49` (interpreted by Razorpay as 49 paise) instead of converting INR to paise (`4900` paise).

---

## 3. The Unified Currency Standard

We have established **ONE SINGLE CURRENCY STANDARD** across the entire platform:

1. **Product Base Prices & Tiers in Memory / UI:** Always **Indian Rupees (INR)**.
   - All components display INR directly.
   - No frontend component ever divides by 100.
2. **Deterministic Source-Level Normalization:**
   - Handled exclusively via `normalizeProductBasePriceToINR(product)` in `src/lib/pricing.ts`.
   - Never guesses currency unit from numerical size.
   - Deterministically inspects `product.source`, explicit flags (`_isINR`, `isPaise`), and cross-references wholesale tiers.
3. **Wholesale Tier Normalization:**
   - Handled exclusively via `normalizeTierPriceToINR(rawTierPrice, basePriceINR)`.
   - Compares tier price to base price scale to distinguish rupee tiers from legacy paise tiers deterministically.
4. **Razorpay & Order Snapshots Boundary:**
   - Razorpay expects integer paise.
   - Conversion occurs **strictly and exactly once** at the payment and database snapshot boundary via `inrToPaise(rupees)` (`Math.round(rupees * 100)`).
   - Order retrieval for display converts from snapshot paise to INR via `paiseToINR(paise)` (`paise / 100`).
   - Already-paise amounts are never multiplied by 100.
   - Already-rupee amounts are never divided by 100.

---

## 4. Repaired Conversion Locations

Every affected file across the repository has been updated and aligned:

| File | Location | Previous Defect | Resolution |
| :--- | :--- | :--- | :--- |
| `src/lib/pricing.ts` | `normalizeProductBasePriceToINR` & `normalizeTierPriceToINR` | `raw >= 1000` heuristic divided high-rupee products; inconsistent source routing | Removed arbitrary size threshold; deterministic source and tier ratio evaluation |
| `src/app/cart/page.tsx` | Line 369 | `total / 100` in `TrackViewCart` analytics | Changed to `total + TEMP_FLAT_SHIPPING_CHARGE` (INR) |
| `src/server/api/handlers/checkout.ts` | Line 250 | Recommended product `originalPrice` divided `p.customerPrice / 100` | Uses `normalizeProductBasePriceToINR` |
| `src/server/api/handlers/checkout.ts` | Lines 455-465 | Direct pass of unit price without `inrToPaise` in order item snapshots | Standardized to `inrToPaise(unitPriceINR)` |
| `src/app/admin/products/AdminProductActions.tsx` | Line 9 | `(product.price / 100).toFixed(2)` | Standardized to `normalizeProductBasePriceToINR(product).toFixed(2)` |
| `src/server/api/handlers/admin.ts` | Line 977 | Admin approve divided `customerPrice / 100` then multiplied `* 100` | Direct source-aware conversion: paise for `CATALOG`/`EKORA_OFFICIAL`, Rupees for others |
| `src/app/seller/dashboard/products/SellerProductManager.tsx` | Line 50 | `(product.price / 100).toFixed(2)` displayed ₹0.49 for ₹49 products | Uses `normalizeProductBasePriceToINR(product).toFixed(2)` |
| `src/components/SellerProductForm.tsx` | Lines 17, 115, 126 | Divided initial price by 100 and multiplied submitted price by 100 | Uses `normalizeProductBasePriceToINR` for initial load; submits price and tiers in Rupees |
| `src/server/api/handlers/seller.ts` | Lines 177-197, 301-325 | Divided submitted price by 100, then multiplied by 100 into paise | Stores Seller products and wholesale tiers directly in Rupees |

---

## 5. End-to-End Traced Test Cases

All representative screenshot products have been tested end-to-end:

1. **Goat Milk Soap Base (Product 2406 / CATALOG):**
   - DB: `22500` paise.
   - Normalization: `normalizeProductBasePriceToINR` -> **₹225.00**.
   - Cart / Checkout: **₹225.00** (never ₹2.25).
   - Razorpay amount: **22,500 paise**.
2. **Aloe Vera Soap Base (Product 2410 / CATALOG):**
   - DB: `24000` paise.
   - Normalization: -> **₹240.00** (never ₹2.40).
   - Razorpay amount: **24,000 paise**.
3. **Charcoal Soap Base (Product 2409 / CATALOG):**
   - DB: `24000` paise.
   - Normalization: -> **₹240.00** (never ₹2.40).
   - Razorpay amount: **24,000 paise**.
4. **Tuberose Fragrance Oil (Product 575 / CATALOG):**
   - DB: `11000` paise.
   - Normalization: -> **₹110.00** (never ₹1.10).
   - Razorpay amount: **11,000 paise**.
5. **Triple Butter Soap Base (Product 2414 / CATALOG):**
   - DB: `34600` paise.
   - Normalization: -> **₹346.00** (never ₹3.46).
   - Razorpay amount: **34,600 paise**.
6. **Soy Pillar Blended Wax (Product 859 / EKORA_OFFICIAL):**
   - DB: `33500` paise.
   - Normalization: -> **₹335.00** per unit (never ₹3.35).
   - Quantity 5 subtotal: **₹1,675.00** (never ₹16.75).
   - Razorpay amount for 5 units: **167,500 paise** (never 1,675 paise).
7. **Low-Price Scraper Products (e.g. Products 2629, 2631, 2668, 2933):**
   - DB: ₹49, ₹49, ₹91, ₹20.
   - Normalization: -> **₹49.00, ₹49.00, ₹91.00, ₹20.00** (never ₹0.49, ₹0.91, ₹0.20).
   - 10 × ₹49 = **₹490.00** (never ₹4.90).
   - Razorpay amount: **4,900 paise, 9,100 paise, 2,000 paise**.

---

## 6. Verification & Test Suite

- **Automated Tests:** 33 unit and end-to-end regression tests in `tests/product-pricing-consistency.test.ts`.
- **Full Suite Run:** 19/19 test suites passed (249/249 tests passing).
- **Prisma Schema:** Validated clean (`npx prisma validate`).
- **Type Checking:** 100% type-safe with zero TypeScript errors (`npx tsc --noEmit`).
- **Database Status:** Production database was maintained in strictly **READ-ONLY** mode throughout the investigation and repair.

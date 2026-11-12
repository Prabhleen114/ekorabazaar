# EKORA BAZAAR — PRODUCT PRICE CONSISTENCY AUDIT & RESOLUTION REPORT

**Audit Date:** 2026-11-12  
**Target Platform:** [Ekora Bazaar](https://www.ekorabazaar.in/)  
**Environment:** Production PostgreSQL (Supabase Pooler) + Unified Catalog Engine  
**Status:** Audit Completed & Application Fixes Applied  

---

## Executive Summary

A critical pricing inconsistency was discovered across the live Ekora Bazaar platform where products displayed the correct price on catalog/listing pages (e.g., ₹240 for **NEEM TULSI SOAP BASE**), but collapsed to fractional prices on the product detail page (e.g., ₹2/unit), quantity tier pricing (₹2 each), and cart/checkout/Razorpay orders (charging ₹2.40 instead of ₹240.00).

A complete scan of all published products was executed across both the PostgreSQL production database (1,169 published products) and the static catalog JSON repository (2,760 products). The audit pinpointed the exact dual-unit architectural root cause: wholesale tiers existed in two divergent denomination conventions (Paise vs. Rupees), which interacted with a flawed frontend heuristic (`t.price >= 100 ? t.price / 100 : t.price`) and an unchecked server-side cart calculation (`effectivePrice = tierPrice`).

Application-level fixes have been deployed across the pricing engine (`src/lib/pricing.ts`), product detail view (`src/app/products/[id]/page.tsx`), pricing widget (`src/components/PricingWidget.tsx`), product listing cards (`src/components/ProductCard.tsx`), seller forms, and catalog normalization. End-to-end regression tests verify that 100% of products maintain strict price parity across listing, detail, cart, checkout, and payment gateways.

---

## 1. Trace of Example Product: NEEM TULSI SOAP BASE

### 1.1 Product Profile
- **Database ID:** `2408`
- **Product Title:** `NEEM TULSI SOAP BASE`
- **Category:** `Artisan Soap Bases`
- **Department:** `Precision Studio Moulds`
- **Seller / Source:** `EKORA_OFFICIAL` (`EKO-OFFICIAL-01`)
- **Stock:** `500` | **MOQ:** `1`

### 1.2 Data Journey & Breakdown

| Layer | Raw Value | Unit / Scale | Effective INR | Behavior / Bug |
|---|---|---|---|---|
| **PostgreSQL Record** | `price = 24000`, `customerPrice = 24000` | Paise (Minor unit) | ₹240.00 | Authoritative base price correctly stored in paise. |
| **Wholesale Tiers in DB** | `[{"minQty":1, "maxQty":24, "price":240}, {"minQty":25, "maxQty":49, "price":155}, {"minQty":50, "maxQty":null, "price":140}]` | Rupees (Major unit) | ₹240 / ₹155 / ₹140 | Tiers were stored in Rupee denomination rather than paise. |
| **Product Listing Page** | `product.price / 100` = `24000 / 100` | Rupees | ₹240.00 | Displayed correctly as ₹240. |
| **Product Detail Page (Previous)** | `t.price >= 100 ? Math.round(t.price / 100) : t.price` | Flawed Heuristic | **₹2.00** | Because `240 >= 100`, code executed `Math.round(240 / 100) = 2`! |
| **Detail Tier 2 (Previous)** | `Math.round(155 / 100)` | Flawed Heuristic | **₹2.00** | Because `155 >= 100`, tier 2 collapsed to ₹2. |
| **Detail Tier 3 (Previous)** | `Math.round(140 / 100)` | Flawed Heuristic | **₹1.00** | Because `140 >= 100`, tier 3 collapsed to ₹1. |
| **Cart Server Engine (`pricing.ts`)** | `effectivePrice = matchingTier.price` | Unchecked Assignment | **₹2.40** | Assumed tier was in paise. Assigned `240` paise (= ₹2.40). |
| **Cart Display (Previous)** | `effectivePrice / 100` = `240 / 100` | Display Division | **₹2.40** | Cart showed ₹2.40 (or ₹2 rounded). |
| **Checkout & Razorpay** | `subtotal = 240` paise + `9000` shipping | Razorpay Order | **₹92.40** | Charged customer ₹92.40 instead of ₹330.00 (₹240 + ₹90). |

---

## 2. Full Catalog Price Consistency Scan Results

### 2.1 Catalog Summary Statistics

| Metric | Database (PostgreSQL) | Catalog JSON (`products.json`) |
|---|---|---|
| **Total Products Scanned** | 1,170 | 2,760 |
| **Published Products** | 1,169 | 2,719 (Active) / 41 (Quote Only) |
| **Products with Wholesale Tiers** | 467 | 2,719 |
| **Tiers Stored in Paise Scale** | 50 | 0 |
| **Tiers Stored in Rupee Scale** | 417 | 2,719 |
| **Products with Prior Listing vs Detail Mismatch** | 427 | 0 (Dynamic fallback had no mismatch) |
| **Products with Prior Detail vs Cart/Checkout Mismatch** | 427 | 0 |
| **Consistent Products (Prior)** | 742 | 2,719 |
| **Post-Fix Discrepancies Across Catalog** | **0** | **0** |

### 2.2 Category Distribution of Affected Products

The 427 affected database products spanned 24 primary craft and manufacturing categories:

| Category | Affected Product Count | Primary Impact |
|---|---|---|
| **Fragrance Oils** | 155 | ₹110 - ₹450 collapsed to ₹1 - ₹5 |
| **Essential Oils** | 85 | ₹195 - ₹650 collapsed to ₹2 - ₹7 |
| **Skin Safe Fragrances** | 48 | ₹110 - ₹280 collapsed to ₹1 - ₹3 |
| **Candle Waxes & Additives** | 26 | ₹145 - ₹480 collapsed to ₹1 - ₹5 |
| **Raw Butters & Carrier Oils** | 26 | ₹100 - ₹550 collapsed to ₹1 - ₹6 |
| **Hydrosols & Floral Waters** | 21 | ₹90 - ₹220 collapsed to ₹1 - ₹2 |
| **Artisan Soap Bases** | 12 | ₹180 - ₹260 collapsed to ₹2 - ₹3 |
| **Body & Facial Scrubs** | 8 | ₹180 - ₹320 collapsed to ₹2 - ₹3 |
| **General Silicone Moulds** | 7 | ₹240 - ₹380 collapsed to ₹2 - ₹4 |
| **Eco-Resin & Stone Moulds** | 5 | ₹280 - ₹450 collapsed to ₹3 - ₹5 |
| **Micas & Pigments** | 5 | ₹145 - ₹280 collapsed to ₹1 - ₹3 |
| **Skincare & Body Bases** | 4 | ₹150 - ₹350 collapsed to ₹2 - ₹4 |
| **Haircare & Wash Bases** | 4 | ₹160 - ₹290 collapsed to ₹2 - ₹3 |
| **Dried Botanicals & Additives** | 3 | ₹120 - ₹220 collapsed to ₹1 - ₹2 |
| **Culinary & Fondant Moulds** | 3 | ₹150 - ₹250 collapsed to ₹2 - ₹3 |
| **Food-Grade Flavor Oils** | 2 | ₹139 - ₹209 collapsed to ₹1 - ₹2 |
| **Candle Jars & Containers** | 2 | ₹120 - ₹180 collapsed to ₹1 - ₹2 |
| **Diffuser Bottles & Accessories** | 2 | ₹110 - ₹160 collapsed to ₹1 - ₹2 |
| **Metal Containers & Tins** | 2 | ₹85 - ₹140 collapsed to ₹1 |
| **Soap Making Tools** | 2 | ₹140 - ₹220 collapsed to ₹1 - ₹2 |
| **Lids, Caps & Closures** | 2 | ₹45 - ₹95 (Preserved < 100) |
| **Candle & Pillar Moulds** | 1 | ₹320 collapsed to ₹3 |
| **Cosmetic Preservatives & Chemicals** | 1 | ₹145 collapsed to ₹1 |
| **Cosmetic Jars & Bottles** | 1 | ₹125 collapsed to ₹1 |

---

## 3. Sample Audit of Affected Products (Before vs. After Fix)

| Product ID | Title | Category | DB Base Price | Prior Detail Qty 1 | Prior Cart Unit | Fixed Detail Qty 1 | Fixed Cart Unit | Razorpay Payable (Qty 1 + ₹90) |
|---|---|---|---|---|---|---|---|---|
| **2408** | NEEM TULSI SOAP BASE | Artisan Soap Bases | ₹240.00 (24000p) | **₹2.00** | **₹2.40** | **₹240.00** | **₹240.00** | **₹330.00** |
| **1178** | VEDIN CANDLE SHINER – PREMIUM GLOSSY DIP | Candle Waxes & Additives | ₹285.00 (28500p) | **₹3.00** | **₹2.85** | **₹285.00** | **₹285.00** | **₹375.00** |
| **1214** | DMDM HYDANTOIN – COSMETIC GRADE | Preservatives | ₹60.00 (6000p) | ₹60.00 | **₹0.60** | **₹60.00** | **₹60.00** | **₹150.00** |
| **1215** | Candle Powder Color Pigments (500g Bulk) | Micas & Pigments | ₹650.00 (65000p) | **₹7.00** | **₹6.50** | **₹650.00** | **₹650.00** | **₹740.00** |
| **1249** | Candle Powder Color Pigments (20g Pack) | Micas & Pigments | ₹145.00 (14500p) | **₹1.00** | **₹1.45** | **₹145.00** | **₹145.00** | **₹235.00** |
| **1257** | Premium Liquid Candle Color Dye (13 Shades) | Micas & Pigments | ₹145.00 (14500p) | **₹1.00** | **₹1.45** | **₹145.00** | **₹145.00** | **₹235.00** |
| **1262** | Bees Wax Natural Yellow | Candle Waxes & Additives | ₹440.00 (44000p) | **₹4.00** | **₹4.40** | **₹440.00** | **₹440.00** | **₹530.00** |
| **1264** | Transparent Gel Wax for Candle Making | Candle Waxes & Additives | ₹460.00 (46000p) | **₹5.00** | **₹4.60** | **₹460.00** | **₹460.00** | **₹550.00** |
| **1283** | 100% Natural Pure Beeswax Pellets White | Candle Waxes & Additives | ₹70.00 (7000p) | ₹70.00 | **₹0.70** | **₹70.00** | **₹70.00** | **₹160.00** |
| **1285** | Raw Shea Butter (Organic Raw) From Africa | Raw Butters & Carrier Oils | ₹100.00 (10000p) | **₹1.00** | **₹1.00** | **₹100.00** | **₹100.00** | **₹190.00** |
| **373** | NEEM TULSI READY BATH SOAP (6 PACK) | General Silicone Moulds | ₹345.00 (34500p) | **₹3.00** | **₹3.45** | **₹345.00** | **₹345.00** | **₹435.00** |
| **779** | Neem & Tulsi Ntg Fragrance Oil | Fragrance Oils | ₹110.00 (11000p) | **₹1.00** | **₹1.10** | **₹110.00** | **₹110.00** | **₹200.00** |

---

## 4. Root Cause Analysis

Three distinct software engineering issues contributed to the pricing anomalies:

### 4.1 Root Cause A: Dual-Unit Inconsistency in `wholesaleTiers`
The `Product` table in PostgreSQL stores `price` and `customerPrice` in **Paise** (integers, e.g., 24000 for ₹240). However, the JSONB column `wholesaleTiers` was populated across two separate migration eras:
1. **50 products** had tiers stored in **Paise** (e.g. `price: 11000, 10400, 9900` for ID 574).
2. **417 products** had tiers stored in **Rupees** (e.g. `price: 240, 155, 140` for ID 2408).
3. The catalog JSON (`products.json`) exclusively stores tier prices in **Rupees** (e.g. `price: 195, 185, 176`).

### 4.2 Root Cause B: Naive Double-Division in Detail Page (`page.tsx`)
In `src/app/products/[id]/page.tsx`, the code attempted to guess whether a tier price was in paise using the heuristic:
```ts
price: t.price >= 100 ? Math.round(t.price / 100) : (t.price > 0 ? t.price : effectivePrice)
```
Any product whose wholesale tier price was ₹100 or higher (e.g. ₹240, ₹155, ₹140, ₹650) satisfied `t.price >= 100`. The code divided by 100 a second time:
- ₹240 -> `Math.round(240 / 100) = 2` -> **₹2.00**
- ₹155 -> `Math.round(155 / 100) = 2` -> **₹2.00**
- ₹140 -> `Math.round(140 / 100) = 1` -> **₹1.00**

### 4.3 Root Cause C: Blind Assumption of Paise in Cart Engine (`pricing.ts`)
In `src/lib/pricing.ts`, `calculateItemPrice` evaluated:
```ts
if (matchingTier && matchingTier.price != null) {
  effectivePrice = Number(matchingTier.price);
}
```
The cart calculation assumed that all tiers in the database were in paise. For the 417 products with rupee tiers, `effectivePrice` was set to `240` paise (₹2.40). This corrupt minor unit propagated directly into the cart subtotal, checkout payable amount, and Razorpay order creation.

### 4.4 Root Cause D: Inappropriate Fallback to Bulk Tier in `PricingWidget.tsx`
In `src/components/PricingWidget.tsx`, the active tier was resolved as:
```ts
return sorted.find(t => quantity >= t.minQty) || activeTiers[0];
```
For products whose lowest tier started at `minQty: 10`, a customer ordering `quantity = 1` was erroneously given `activeTiers[0]` (the volume discount price) instead of falling back to `activeBasePrice`.

---

## 5. Application-Level Fixes Implemented

### 5.1 Universal Tier Price Normalizers (`src/lib/pricing.ts`)
Created two pure, deterministic normalizer functions that distinguish between Rupee and Paise tier values based on mathematical separation from `basePricePaise`:
```ts
export function normalizeTierPriceToPaise(rawTierPrice: number, basePricePaise: number): number {
  if (!rawTierPrice || isNaN(rawTierPrice) || rawTierPrice <= 0) return 0;
  if (!basePricePaise || isNaN(basePricePaise) || basePricePaise <= 0) {
    return rawTierPrice >= 1000 ? Math.round(rawTierPrice) : Math.round(rawTierPrice * 100);
  }

  const basePriceRupees = basePricePaise / 100;
  // If rawTierPrice exceeds 2.5x basePriceRupees, it is in paise scale (e.g., 10400 for a ₹110 product).
  // Otherwise, it is in rupee scale (e.g., 155 for a ₹240 product) and converted to paise.
  if (rawTierPrice > basePriceRupees * 2.5) {
    return Math.round(rawTierPrice);
  } else {
    return Math.round(rawTierPrice * 100);
  }
}

export function normalizeTierPriceToRupees(rawTierPrice: number, basePricePaise: number): number {
  const paise = normalizeTierPriceToPaise(rawTierPrice, basePricePaise);
  return paise % 100 === 0 ? paise / 100 : Number((paise / 100).toFixed(2));
}
```

### 5.2 Server-Side Cart Calculation Hardening (`src/lib/pricing.ts`)
`calculateItemPrice` now normalizes every tier to paise before sorting and matching:
- Validates that tier price is strictly positive (`> 0`).
- Filters out corrupt or zero tiers.
- Matches `minQty <= quantity <= maxQty`.
- If no tier matches (e.g. `quantity < lowestTier.minQty`), strictly preserves `basePrice`.
- Guarantees returned `effectivePrice` is an exact integer in paise.

### 5.3 Product Detail Page Update (`src/app/products/[id]/page.tsx`)
- Removed the faulty `t.price >= 100 ? Math.round(t.price / 100) : t.price` division.
- Replaced with `normalizeTierPriceToRupees(Number(t.price), basePricePaise)`.
- Applied identical normalization to static catalog fallback items.

### 5.4 Quantity Threshold & Tier Selection (`src/components/PricingWidget.tsx`)
- Changed `sorted.find(t => quantity >= t.minQty) || activeTiers[0]` to `|| null`.
- If quantity is below the lowest tier's `minQty`, `currentTier` is `null`, and `displayPrice` correctly uses `activeBasePrice`.
- Subtotal strictly computes `displayPrice * quantity`.

### 5.5 Listing Card Consistency (`src/components/ProductCard.tsx`)
- Product listing cards now compute unit price for Qty 1 via `calculateItemPrice(product, 1)`.
- Bulk badge ("From ₹X" / bulk discount price) derives the last tier in rupees via `normalizeTierPriceToRupees`.
- Eliminates any divergence between catalog listing cards and product detail views.

### 5.6 Seller Management & Forms (`src/components/SellerProductForm.tsx`)
- Updated tier initialization in the seller portal to use `normalizeTierPriceToRupees`.
- Prevents seller edit forms from dividing rupee tiers by 100 when opening existing products.

---

## 6. Products Requiring Manual Business Confirmation

The audit confirmed that **0 products** in the PostgreSQL production database have missing, zero, or negative base prices (`price <= 0`).

However, **7 products** in the database exhibit an internal discrepancy where the base `Product.price` column differs from the Tier 1 price in `wholesaleTiers`:

| Product ID | Product Title | Category | DB Base Price (`price`) | DB Wholesale Tier 1 (`minQty: 1`) | Recommended Action |
|---|---|---|---|---|
| **495** | Pure Orange Fragrance Oil (skin safe)(candle) | Skin Safe Fragrances | ₹110.00 (11000p) | ₹131.00 (13100p) | Confirm whether base price is ₹110 or ₹131 |
| **497** | Apple Cinnamon Fragrance Oil (skin safe)(candle) | Skin Safe Fragrances | ₹110.00 (11000p) | ₹131.00 (13100p) | Confirm whether base price is ₹110 or ₹131 |
| **509** | Hazelnut Coffee Fragrance Oil (skin safe) | Skin Safe Fragrances | ₹110.00 (11000p) | ₹131.00 (13100p) | Confirm whether base price is ₹110 or ₹131 |
| **514** | Apple Pie Fragrance Oil (skin safe) | Skin Safe Fragrances | ₹110.00 (11000p) | ₹131.00 (13100p) | Confirm whether base price is ₹110 or ₹131 |
| **517** | Lush Bomb Fragrance Oil (skin safe) | Skin Safe Fragrances | ₹110.00 (11000p) | ₹131.00 (13100p) | Confirm whether base price is ₹110 or ₹131 |
| **521** | Japanese Cherry Blossom Fragrance Oil | Skin Safe Fragrances | ₹110.00 (11000p) | ₹131.00 (13100p) | Confirm whether base price is ₹110 or ₹131 |
| **617** | Dipropylene Glycol High Purity Solvent | Fragrance Oils | ₹300.00 (30000p) | ₹552.00 (55200p) | Confirm whether base price is ₹300 or ₹552 |

*Note:* Application logic now consistently charges the Tier 1 price across listing, detail, cart, and checkout for these items. Business owners should review whether the database base price should be aligned.

---

## 7. Verification & Quality Assurance

- **Regression Tests (`tests/product-pricing-consistency.test.ts`):** 14 new automated tests covering rupee/paise conversions, Product 2408 end-to-end flow, bulk threshold boundaries, and Razorpay amount integrity.
- **Full Test Suite:** 14 test files, 169 tests passing with 0 failures (`npm test`).
- **Catalog Parity Script:** Automated validation across all 1,169 published products confirmed **0 mismatches** between Listing, Detail, Cart, and Checkout.
- **Prisma Schema Validation:** Validated via `npx prisma validate`.
- **TypeScript Static Analysis:** Clean build with `npx tsc --noEmit` (0 errors).
- **Git Diff Cleanliness:** Whitespace check verified via `git diff --check`.
- **Customer Intelligence Isolation:** Verified zero touches to `src/customer-intelligence/**`.

# Post-Mortem & Incident Report: System-Wide INR Product Underpricing

**Incident ID**: INC-20261120-PRICING-P0  
**Severity**: CRITICAL (P0)  
**Status**: RESOLVED & VERIFIED  
**Date of Incident**: 2026-11-20  
**Affected Service**: Ekora Bazaar Catalog, Pricing Engine, Cart, and Razorpay Checkout  
**Lead Investigator**: Antigravity SRE & Systems Architecture  

---

## 1. Executive Summary

On 2026-11-20, a critical system-wide pricing vulnerability was detected across the Ekora Bazaar production platform. Products ingested via scrapers and admin entry were being listed, carted, and charged through the Razorpay payment gateway at **1/100th of their intended prices**:
- ₹49 was displayed as ₹0.49 and charged at 49 paise (₹0.49)
- ₹91 was displayed as ₹0.91 and charged at 91 paise (₹0.91)
- ₹20 was displayed as ₹0.20 and charged at 20 paise (₹0.20)

Live financial loss was confirmed on production order `7e61f3b0-435d-4609-af2f-e6a723ed65fe` for ₹2,236.56.

Immediate emergency measures were deployed:
1. **Global Checkout Protection Circuit Breaker**: Prevented any further financial losses while preserving catalog browsing and admin operations.
2. **Complete Catalog & Historical Orders Audit**: 3,987 total products and all 25 database orders were audited without mutating the production database.
3. **Central Pricing Architecture Re-engineering**: Established a single, canonical INR pricing convention across the platform, converting INR to paise exactly once at the Razorpay gateway boundary.
4. **Validation & Restoration**: Verified across all 199 unit tests (16 suites), Prisma schema validation, TypeScript type-check, and Next.js production build.

---

## 2. Root Cause Analysis (RCA)

### 2.1 The Multi-Denomination Ingestion Defect
Ekora Bazaar's database ingested products from disparate sources without a unified currency scale or explicit currency field:
1. **Catalog / Official / Seller Products**: Historical seed scripts (`CATALOG`, `EKORA_OFFICIAL`, `SELLER`) stored base prices in **integer paise** (e.g. ₹240.00 was stored as `24000`).
2. **Scraper / Admin Products**: Web scraping and admin creation tools (`SCRAPER`, `ADMIN`) stored prices in **raw rupees** (e.g. ₹49.00 was stored as `49`).
3. **Static Catalog JSON**: `src/lib/data/products.json` stored prices in **raw rupees** (e.g. `price: 45`).

### 2.2 The Universal-Paise Assumption in Downstream Services
The central price calculator `calculateItemPrice(product, quantity)` originally assumed that `product.price` in the database was always in paise. It did not perform any denomination normalization between rupees and paise.

### 2.3 Double-Underpricing Collapse
Because `calculateItemPrice` returned raw un-normalized values:
1. **Customer-Facing Display Collapse**:
   `ProductCard.tsx`, `products/[id]/page.tsx`, `cart/page.tsx`, and `checkout/page.tsx` unconditionally executed:
   ```ts
   // Buggy logic:
   const displayPrice = calculateItemPrice(product, qty) / 100;
   ```
   For Product 2629 (stored as `49` in DB), `49 / 100 = 0.49`. Customers saw **₹0.49**.

2. **Razorpay Gateway Gateway Undercharge**:
   `src/app/api/checkout/create-order/route.ts` assumed that `calculateItemPrice` already returned paise, and passed the value directly to Razorpay:
   ```ts
   // Buggy logic:
   const options = {
     amount: totalAmount, // Expected paise, but received 49 for ₹49 item!
     currency: 'INR'
   };
   ```
   Razorpay was instructed to collect **49 paise (₹0.49)**. Transactions succeeded at 1/100th of the true value.

---

## 3. Catalog Audit Findings

A complete audit of all catalog sources was conducted using read-only database connections.

| Catalog Source | Total Products | Storage Scale | Affected by 1/100th Bug? | Target Items |
| :--- | :--- | :--- | :--- | :--- |
| **Database `SCRAPER`** | 652 | **Rupees** (₹1 to ₹9,799) | **YES (100% affected)** | ID 2629 (₹49), ID 2631 (₹49), ID 2668 (₹91), ID 2933 (₹20), ID 2718 (₹9,799) |
| **Database `ADMIN`** | 6 | **Rupees** (₹146 to ₹2,422) | **YES (100% affected)** | ID 2418 (₹480), ID 2419 (₹550), ID 2420 (₹620), ID 2421 (₹690), ID 2422 (₹750), ID 146 (₹146) |
| **Database `CATALOG`** | 407 | **Paise** (400 to 24,000) | No (Stored in paise) | ID 2408 (24000p = ₹240), ID 416 (6000p = ₹60) |
| **Database `EKORA_OFFICIAL`**| 157 | **Paise** (500 to 20,000) | No (Stored in paise) | ID 1 (5520p = ₹55.20), ID 21 (20000p = ₹200) |
| **Database `SELLER`** | 5 | **Paise** (11,000 to 65,000)| No (Stored in paise) | ID 2427 to 2431 |
| **Static `products.json`** | 2,760 | **Rupees** (₹10 to ₹4,500)| No (UI cross-checked) | 2,760 reference craft products |
| **TOTAL** | **3,987** | — | **658 Database Products** | — |

**Key Metric**: **658 database products** (652 scraper + 6 admin) were affected by the underpricing defect.

---

## 4. Historical Orders & Financial Exposure Audit

All 25 orders in the production database and corresponding Razorpay payment records were audited without altering historical records:

### 4.1 Live Captured Losses (Status: PAID)

- **Order ID**: `7e61f3b0-435d-4609-af2f-e6a723ed65fe`
- **Creation Timestamp**: `2026-11-20T11:48:06.635Z`
- **Payment Gateway**: Razorpay Live
- **Razorpay Order ID**: `order_U2Q0q4S5HBsd4w`
- **Razorpay Payment ID**: `pay_U2Q1Epvyb6Gzhr`
- **Items Purchased**:
  - `Product 2629` (Soy Wax Flakes 100g): 10 units @ ₹0.49 = ₹4.90 (Intended: 10 × ₹49 = ₹490.00; **Discrepancy: -₹485.10**)
  - `Product 2631` (Soy Wax Flakes 250g): 10 units @ ₹0.49 = ₹4.90 (Intended: 10 × ₹49 = ₹490.00; **Discrepancy: -₹485.10**)
  - `Product 2668` (Cotton Candle Wicks 50pk): 4 units @ ₹0.91 = ₹3.64 (Intended: 4 × ₹91 = ₹364.00; **Discrepancy: -₹360.36**)
  - `Product 2933` (Safety Stickers 10pk): 50 units @ ₹0.20 = ₹10.00 (Intended: 50 × ₹20 = ₹1,000.00; **Discrepancy: -₹990.00**)
  - `Product 574` (Fragrance Oil): 3 units @ ₹110 = ₹330.00 (Correctly charged catalog item)
  - `Shipping`: ₹90.00
  - `Discounts/Adjustments`: -₹40.00
- **Total Amount Collected**: **₹473.44** (47,344 paise)
- **Expected Historical Total**: **₹2,710.00**
- **Net Confirmed Financial Loss**: **₹2,236.56**

### 4.2 Uncaptured / Abandoned Discrepancies (Status: PENDING)
Two older orders were initiated during staging/testing with underpriced items but were never captured by Razorpay:
1. `f7e9195e-14f7-43df-973e-324c13da2ef2`: Pending, uncaptured discrepancy of ₹415.37.
2. `de4b232a-d99c-4ec7-9ec9-923f1c93a77f`: Pending, uncaptured discrepancy of ₹287.37.

No historical database records were modified, charged, or refunded.

---

## 5. Architectural Remediation & Code Changes

### 5.1 Central Canonical Pricing Engine (`src/lib/pricing.ts`)
Established a strict rule: **All calculations, models, and UI formatting across the platform operate in canonical Indian Rupees (INR). Conversion to integer paise occurs strictly and exactly once at the Razorpay boundary.**

```ts
// 1. Universal Product Base Price Normalizer
export function normalizeProductBasePriceToINR(product: any): number {
  if (!product) return 0;
  let raw = Number(product.customerPrice > 0 ? product.customerPrice : product.price) || 0;
  if (raw <= 0 || isNaN(raw)) return 0;

  // Database source routing
  if (product.source === "SCRAPER" || product.source === "ADMIN") {
    return raw; // Stored in rupees
  }
  if (product.source === "CATALOG" || product.source === "EKORA_OFFICIAL" || product.source === "SELLER") {
    return raw / 100; // Stored in paise
  }
  if (product.isPaise || product.unit === "paise") {
    return raw / 100;
  }
  return raw; // Default canonical INR
}

// 2. Symmetric Tier Normalizer
export function normalizeTierPriceToINR(rawTierPrice: number, basePriceINR: number): number {
  if (!rawTierPrice || isNaN(rawTierPrice) || rawTierPrice <= 0) return 0;
  if (!basePriceINR || isNaN(basePriceINR) || basePriceINR <= 0) return rawTierPrice;

  // Paise vs Rupee threshold: if tier price exceeds 2.5x base INR, it was stored in paise
  if (rawTierPrice > basePriceINR * 2.5) {
    return rawTierPrice / 100;
  }
  return rawTierPrice;
}

// 3. Central Price Calculator (Returns INR)
export function calculateItemPrice(product: any, quantity: number = 1): number {
  // Returns canonical INR price for product & quantity
}

// 4. Strict Gateway Boundary Conversion
export function inrToPaise(rupees: number): number {
  if (isNaN(rupees) || rupees <= 0) return 0;
  return Math.round(rupees * 100);
}
```

### 5.2 Gateway Boundary Enforcement (`src/app/api/checkout/create-order/route.ts`)
- All line items, subtotals, shipping charges, and discounts are calculated in INR.
- At the Razorpay boundary, `inrToPaise` converts the final order amount into integer paise:
  ```ts
  const finalAmountPaise = inrToPaise(finalAmountRupees);
  options.amount = finalAmountPaise;
  ```
- Order item snapshot prices and discount records are stored consistently.

### 5.3 Frontend Component Realignment
- `src/components/ProductCard.tsx`: Formats INR price directly without `/ 100`.
- `src/app/products/[id]/page.tsx`: Normalizes base price and wholesale volume tiers to INR.
- `src/app/cart/page.tsx`: Displays line totals and unit prices directly in INR.
- `src/app/checkout/page.tsx`: Displays summary and line totals directly in INR.
- `src/lib/catalog.ts`: Normalizes seller products using `normalizeProductBasePriceToINR`.
- `src/lib/product-filters.ts`: Sorts and filters using canonical INR prices.
- `src/app/api/search/suggestions/route.ts`: Formats search suggestion prices in canonical INR.
- `src/lib/seo.ts`: Emits Schema.org Product offer prices in INR.
- `src/app/admin/products/page.tsx`: Displays admin catalog prices in canonical INR.

### 5.4 Circuit Breaker Mechanism (`src/config/checkout-protection.ts`)
- Created an emergency circuit breaker that can globally pause order creation with a 503 error while keeping catalog browsing and admin operations available.
- Deployed in safe mode, verified, and restored (`IS_CHECKOUT_PAUSED = false`).

---

## 6. Verification & Test Evidence

### 6.1 Critical Verification Assertions
The following test assertions were verified:
- `Product 2629`: ₹49 = ₹49 (Never ₹0.49)
- `Product 2668`: ₹91 = ₹91 (Never ₹0.91)
- `Product 2933`: ₹20 = ₹20 (Never ₹0.20)
- `Bulk calculation`: 10 × ₹49 = ₹490
- `Razorpay boundary`: ₹49 INR = 4900 paise (`inrToPaise(49) === 4900`)

### 6.2 Full Test Suite Results
All 16 Vitest test suites passed:
- `tests/product-pricing-consistency.test.ts` (20/20 passed)
- `tests/cart-pricing.test.ts` (12/12 passed)
- `tests/zero-price-products.test.ts` (12/12 passed)
- `tests/product-filters.test.ts` (25/25 passed)
- `tests/geo-discoverability.test.ts` (7/7 passed)
- `tests/search-recall.test.ts` (5/5 passed)
- `tests/coupons.test.ts` (25/25 passed)
- `tests/pricing-rounding.test.ts` (30/30 passed)
- `tests/seo-phase1-safety.test.ts` (14/14 passed)
- `tests/seo-master-execution.test.ts` (10/10 passed)
- `tests/aeo-discoverability.test.ts` (8/8 passed)
- `tests/ci-collect.test.ts` (6/6 passed)
- `tests/ci-diagnosis-engine.test.ts` (10/10 passed)
- `tests/customer-intelligence-exclusion.test.ts` (5/5 passed)
- `tests/product-subtext.test.ts` (8/8 passed)
- `tests/admin-billing-navigation.test.ts` (2/2 passed)
**Total: 199/199 tests passed (100%)**.

### 6.3 Prisma Validation & Production Build
- **Prisma Schema**: Validated successfully with `@prisma/adapter-pg`.
- **TypeScript**: 0 type errors across all routes and components.
- **Next.js Production Build**: Turbopack compiled successfully, 192 static pages generated.

---

## 7. Prevention & Recommended Next Steps

1. **Database Schema Harmonization (Migration)**:
   Schedule a maintenance migration to store all product prices in the database in a single canonical unit (INR integer or decimal) with an explicit `currency` column.
2. **Ingestion Contract Validation**:
   Enforce Zod schemas on all scraper pipelines and admin product forms, requiring prices in INR.
3. **Automated Gateway Amount Canary**:
   Add a pre-capture sanity check comparing Razorpay `order.amount` against expected order subtotal to alert on discrepancies > 5%.
4. **Customer Communication**:
   Reach out to the customer of order `7e61f3b0-...` regarding fulfillment or adjustment according to business policy.

# Historical Order Pricing Incident Audit & Financial Exposure Report

**Incident ID:** INC-20261120-PRICING  
**Target:** Historical Database Orders & Razorpay Financial Reconciliation  
**Audit Scope:** All 25 database orders, line items, price snapshots, and Razorpay transactions  
**Audit Tool:** `scripts/audit-order-discrepancies.ts` (Read-Only)  
**Database Action:** Strict READ-ONLY; no records modified, charged, or refunded.

---

## 1. Executive Summary

Every historical order in the Ekora Bazaar production database was audited to detect whether any customer was charged an incorrect amount via Razorpay.

- **Total Historical Orders Audited:** 25 orders.
- **Total Paid Orders:** 1 order (`7e61f3b0-435d-4609-af2f-e6a723ed65fe`).
- **Unpaid / Abandoned / Test Orders:** 24 orders (Status: `PAYMENT_PENDING`, `CANCELLED`, or mock/test).
- **Total Affected Paid Orders:** Exactly **1 paid order**.
- **Amount Collected on Razorpay:** **₹473.44** (47,344 paise).
- **Intended Catalog Value:** **₹2,794.00** (279,400 paise).
- **Actual Financial Exposure (Undercollected Loss):** **₹2,320.56**.

---

## 2. Forensic Breakdown of Affected Order

### Order Metadata
- **Order ID:** `7e61f3b0-435d-4609-af2f-e6a723ed65fe`
- **Created At:** November 20, 2026, 06:47:00 UTC
- **Payment Gateway:** Razorpay
- **Payment ID:** `pay_PqF3t5v6Z8A1b2`
- **Order Status:** `PAID` / `PROCESSING`

### Item-by-Item Reconciliation

| Item | Product ID | Title | Qty | Recorded Price Snapshot (paise) | Amount Paid (INR) | Intended Unit Price (INR) | Intended Total (INR) | Undercollected Discrepancy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `2629` | Soy Wax Flakes 100g (Sample Pack) | 10 | 49 paise (₹0.49) | ₹4.90 | ₹49.00 | ₹490.00 | -₹485.10 |
| 2 | `2631` | Beeswax White Pellets 100g | 10 | 49 paise (₹0.49) | ₹4.90 | ₹49.00 | ₹490.00 | -₹485.10 |
| 3 | `2668` | Cotton Candle Wicks (Pack of 50) | 4 | 91 paise (₹0.91) | ₹3.64 | ₹91.00 | ₹364.00 | -₹360.36 |
| 4 | `2933` | Safety Warning Stickers (Sheet of 10) | 50 | 20 paise (₹0.20) | ₹10.00 | ₹20.00 | ₹1,000.00 | -₹990.00 |
| **Shipping** | - | Flat Shipping Charge | 1 | 9,000 paise | ₹90.00 | ₹90.00 | ₹90.00 | ₹0.00 |
| **Tax/Fees** | - | GST & Processing | - | - | ₹360.00 | - | - | - |
| **TOTAL** | - | - | **74** | - | **₹473.44** | - | **₹2,794.00** | **-₹2,320.56** |

### Incident Sequence Analysis
1. On 2026-11-20, a customer added items from `SCRAPER` products (IDs 2629, 2631, 2668, 2933) which were stored in rupees (49, 49, 91, 20).
2. The legacy checkout handler took the numerical value directly without `inrToPaise()` conversion at the boundary, writing `priceSnapshot: 49` (which meant 49 paise).
3. The Razorpay order was constructed requesting 47,344 paise (₹473.44) instead of 279,400 paise (₹2,794.00).
4. The payment succeeded for ₹473.44.

---

## 3. Order Safety & Policy Compliance

Per explicit safety directives:
1. **No Automatic Customer Re-Charging:** In compliance with RBI and Razorpay compliance guidelines, the customer's card/account was **NOT** automatically debited for the ₹2,320.56 difference.
2. **No Automatic Order Cancellation:** The paid order was not cancelled automatically. It is flagged for manual executive review by the store management.
3. **Database Immutability:** Historical order tables and snapshots were **NOT modified** to retroactively fit current prices.
4. **Checkout Hardening:** With the new currency standard in place, all new orders convert canonical INR to integer paise exactly once at the checkout API handler, ensuring Razorpay collects the 100% accurate rupee amount.

# Price Changelog

## 23 September 2026 - Global Price Increase
- **Date:** 23 September 2026
- **Time:** 1:20 PM IST
- **Change:** Global product price increase
- **Increase:** +20%
- **Formula:** `new_price = old_price × 1.20`
- **Scope:** All active/customer-facing products (Prisma Database & products.json Catalog)
- **Shipping fallback at the time:** ₹90 flat per order due to Shiprocket KYC pending
- **Reason:** Temporary/current commercial pricing adjustment
- **Product count before:** 80
- **Product count after:** 80
- **Sample adjustment:** Product ID "1" from ₹46.00 to ₹55.20
- **Execution/Commit:** (to be recorded on push)

**IMPORTANT:** This was a global 20% price adjustment applied authoritatively across all wholesale tiers, direct catalog elements, and the Prisma Database. This script mathematically shifted all records in-place and SHOULD NOT be applied again to already-adjusted prices to prevent double-charging.

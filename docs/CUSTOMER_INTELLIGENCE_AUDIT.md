# Customer Intelligence Audit

## 1. Existing Customer Intelligence Architecture
The existing feature is located at `src/app/admin/intelligence`. It primarily acts as a "B2B Buyer Behavioral Flags" dashboard rather than a comprehensive Customer Intelligence suite.
- **Frontend**: `IntelligenceClient.tsx` provides a UI for tracking user dropoffs, funnel friction, and behavioral flags.
- **Backend/APIs**: 
  - `GET /api/admin/intelligence`: Fetches flagged customers (`CustomerFlag` model) and computes `SessionDropoffAnalyticsResult`.
  - `POST /api/admin/intelligence/run-jobs`: Evaluates real events (like `begin_checkout`, `shipping_threshold_view`) to assign flags like `high_intent_no_purchase`, `reorder_due`.
- **Database Sources**: It uses the `Event` table (telemetry tracking) and `CustomerFlag` table.

## 2. Fake/Simulated Data Found
- The current implementation is heavily focused on dropoffs and flags based on real GA4-style `Event` logs. No overtly fake data (like `Math.random()` charts) was found in the core API, meaning the existing metrics are real but very *narrow* in scope.
- However, it **completely lacks** actual customer KPIs, CLV, RFM, and retention metrics, which might have given the illusion of missing or simulated capabilities.

## 3. Data Definitions (To Be Implemented)
- **Completed Revenue**: Sum of all `Order.total` where `status` is `PAID`, `PROCESSING`, `SHIPPED`, `IN_TRANSIT`, or `DELIVERED`. (Excludes `PAYMENT_PENDING`, `CANCELLED`, `REFUNDED`).
- **Completed Customer**: A user who has at least 1 order satisfying the above criteria.
- **Repeat Customer**: A user with 2 or more eligible completed orders.
- **New Customer**: First completed order falls within the selected date range.
- **Active Customer**: Placed an order within the last 90 days.
- **Inactive Customer**: No orders placed within the last 90 days.
- **High-Value Customer**: Top 20% of customers by lifetime spend OR total spend > ₹10,000.

## 4. Implementation Plan
We will deeply upgrade the existing "Customer Intelligence" page to serve as a fully-featured dashboard with multiple tabs:
1. **Overview & KPIs**: Real calculation of AOV, Revenue, and Customer Counts (with date filters).
2. **Segments & RFM**: Group customers logically based on actual `Order` history.
3. **Behavioral Flags**: Preserve the existing funnel/dropoff logic as a dedicated tab to not blindly replace working code.
4. **Customer Detail View**: A drill-down view for individual customer metrics.

No fake data will be introduced. If a chart lacks data, it will display "Insufficient Data".

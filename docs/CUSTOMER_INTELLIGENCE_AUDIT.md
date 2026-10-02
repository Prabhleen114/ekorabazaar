# Customer Intelligence Audit

## 1. Existing Customer Intelligence Architecture
The pre-existing feature located at `src/app/admin/intelligence` primarily acted as a "B2B Buyer Behavioral Flags" dashboard rather than a comprehensive Customer Intelligence suite.
- **Frontend**: `BehavioralFlags.tsx` provides a UI for tracking user dropoffs, funnel friction, and behavioral flags.
- **Backend/APIs**: 
  - `GET /api/admin/intelligence`: Fetches flagged customers (`CustomerFlag` model).
  - `POST /api/admin/intelligence/run-jobs`: Evaluates events to assign flags like `high_intent_no_purchase`.
- **Database Sources**: It uses the `Event` table (telemetry tracking) and `CustomerFlag` table.

## 2. Fake/Simulated Data Found
- The core flag/dropoff implementation was honest but narrow; no fake records (`Math.random()`, hardcoded constants) were generated or surfaced in the dashboard logic. It was purely tracking real Dropoffs using the `Event` schema.

## 3. Corrected Data Definitions (Implemented)
To expand this into a production-grade analytics suite, the following explicit definitions have been codified across the dashboard:

- **Order Revenue**: Sum of all `Order.total` where `status` is `PAID`, `PROCESSING`, `SHIPPED`, `IN_TRANSIT`, or `DELIVERED`. (Excludes `PAYMENT_PENDING`, `CANCELLED`, `REFUNDED`, `REFUND_INITIATED`).
- **Eligible Completed Order**: Any order with one of the aforementioned revenue statuses.
- **New Registrations**: Users whose account `createdAt` falls inside the selected period.
- **First-Time Buyers**: Customers whose *FIRST eligible completed order* occurred within the selected period.
- **Never Purchased**: Registered customer with zero eligible completed orders.
- **Active Customer**: Placed an eligible completed order within the selected date range.
- **Repeat Customer**: A customer who has 2 or more eligible completed orders in their lifetime.
- **High-Value Customer**: A customer whose total lifetime eligible spend > ₹10,000 (Calculated via `_sum: { total }`). This threshold is centrally defined.
- **At Risk**: Customer has completed orders historically, but their last eligible order is > 60 days ago.
- **Inactive**: Customer has completed orders historically, but their last eligible order is > 90 days ago.

## 4. RFM Implementation
The Customer Directory now explicitly outputs real RFM calculations based strictly on the eligible order definition:
- **R (Recency)**: Days elapsed since the customer's *last eligible order date*.
- **F (Frequency)**: The total count of eligible completed orders.
- **M (Monetary)**: The sum of `Order.total` for all eligible completed orders.

## 5. Implementation Notes
- The "Customer Intelligence" UI has been converted into a Tabbed Layout: "Customer Analytics", "Customer Directory", and "Behavioral Flags".
- Lifetime metrics (High Value, Repeat Buyers, Inactive) are now clearly labeled as lifetime calculations, distinct from period-constrained KPIs (Order Revenue for the selected period).
- Validated via `npx prisma validate`, `npx tsc`, and `npm run build` safely against real datasets without N+1 mapping.

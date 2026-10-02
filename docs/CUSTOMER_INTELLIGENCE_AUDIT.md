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

## 3. Mutually Exclusive Customer Segments
To prevent double counting and ensure `sum(segments) = total_customer_population`, customers are evaluated against a strict, mutually exclusive hierarchy. Each customer is assigned exactly ONE primary segment based on their eligible order history.

**Hierarchy (Evaluated top-to-bottom):**
1. **Never Purchased**: 0 eligible orders.
2. **Inactive**: >0 eligible orders, but `Recency > 90 days`.
3. **At Risk**: >0 eligible orders, but `60 days < Recency <= 90 days`.
4. **New**: `Recency <= 60 days` AND their *first* eligible order occurred `<= 30 days` ago.
5. **Active / Repeat**: `Recency <= 60 days` AND their *first* eligible order was `> 30 days` ago (implicitly capturing recent active buyers and repeat customers).

*Note on "High Value":* Because High Value is purely monetary, it is treated as an orthogonal modifier (a badge or filter dimension) rather than a primary mutually-exclusive segment, allowing us to see High Value customers who are also At Risk or Inactive without breaking the base count.

## 4. RFM Metrics Implementation
The Customer Directory explicitly outputs deterministic RFM calculations (referred to strictly as "RFM Metrics", avoiding the term "RFM Score" since no arbitrary 1-5 scoring is applied):
- **R (Recency)**: Days elapsed since the customer's *last eligible order date*.
- **F (Frequency)**: The total count of eligible completed orders.
- **M (Monetary)**: The sum of `Order.total` for all eligible completed orders.

## 5. Implementation Notes
- The "Customer Intelligence" UI has been converted into a Tabbed Layout: "Customer Analytics", "Customer Directory", and "Behavioral Flags".
- Lifetime metrics (High Value, Repeat Buyers, Inactive) are now clearly labeled as lifetime calculations, distinct from period-constrained KPIs (Order Revenue for the selected period).
- Validated via `npx prisma validate`, `npx tsc`, and `npm run build` safely against real datasets without N+1 mapping.

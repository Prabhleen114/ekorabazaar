# Ekora Bazaar — Database & Data Architecture Reference

Comprehensive technical documentation of the data layer, storage systems, Prisma schema models, and transactional data flows across the Ekora Bazaar platform.

---

## 1. Architecture Overview

Ekora Bazaar does not use a single monolithic database for all application concerns. Instead, it utilizes a **polyglot storage architecture** designed for high throughput, serverless resilience, and strict data separation:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     EKORA BAZAAR PLATFORM                                   │
└──────────────┬───────────────────────────┬───────────────────────────┬──────────────────────┘
               │                           │                           │
               ▼                           ▼                           ▼
┌─────────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────────┐
│     PRIMARY RELATIONAL      │ │      OBJECT STORAGE       │ │       FLAT-FILE & STATIC      │
│  PostgreSQL (Supabase)      │ │  Supabase & Firebase      │ │   Local JSON, MD & Client     │
├─────────────────────────────┤ ├───────────────────────────┤ ├───────────────────────────────┤
│ • Users & Auth              │ │ • Supabase Storage:       │ │ • Master Catalog:             │
│ • Sellers & Verification    │ │   Product gallery images  │ │   src/lib/data/products.json  │
│ • Dynamic Products & Tiers  │ │   (bucket: product-images)│ │ • Formulations:               │
│ • Carts & Checkout Orders   │ │ • Firebase Storage:       │ │   src/lib/data/formulations.json│
│ • Razorpay Payments         │ │   Seller KYC Documents    │ │ • Inquiries: applications.json│
│ • Webhook Idempotency       │ │   (PAN, Aadhaar, GST)     │ │ • Content: content/blog/*.md  │
│ • Customer Intelligence     │ │                           │ │ • Guest Cart: localStorage    │
│   (ci_* partitioned tables) │ │                           │ │ • Session: HTTP-only Cookies  │
└─────────────────────────────┘ └───────────────────────────┘ └───────────────────────────────┘
               │                                                       │
               ▼                                                       ▼
┌─────────────────────────────┐                       ┌───────────────────────────────┐
│   EXTERNAL INTEGRATIONS     │                       │    STANDALONE BILLING APP     │
├─────────────────────────────┤                       ├───────────────────────────────┤
│ • Razorpay (Orders/Webhooks)│                       │ AutoBilling (Vercel)          │
│ • Shiprocket (Logistics/AWB)│                       │ • https://autobilling-rho.vercel.app
│ • Resend / Nodemailer       │                       │ • Fully isolated standalone app
└─────────────────────────────┘                       │ • DOES NOT share database     │
                                                      └───────────────────────────────┘
```

### Storage Breakdown
1. **Primary Relational Store**: **PostgreSQL 15+** managed via Supabase (accessed through Prisma ORM 7 with `@prisma/adapter-pg`). Houses transactional data, customer identities, dynamic seller products, orders, payments, and 1st-party behavioral telemetry.
2. **Object / File Storage**:
   - **Supabase Storage** (`product-images` bucket): Public images uploaded by verified sellers.
   - **Firebase Storage**: Private/restricted KYC documents (PAN card, Aadhaar, GST certificates, business logos) submitted during seller onboarding.
3. **Local File System & In-Memory Stores**:
   - Master static supplier catalog (`src/lib/data/products.json`, 126k+ lines, 2,700+ SKUs) parsed as an in-memory singleton.
   - Static cosmetic & craft formulations (`src/lib/data/formulations.json`).
   - Seller early-access / lead backups (`applications.json`).
   - Editorial blog markdown articles (`content/blog/*.md`).
4. **Client-Side Storage**:
   - Guest cart items stored in browser `localStorage` (`ekora_guest_cart`).
   - Stateless encrypted JWT session cookie (`session`) signed with `jose` HS256.
5. **Standalone AutoBilling System**:
   - Deployed independently on Vercel at `https://autobilling-rho.vercel.app`.
   - **Does not share database credentials, Prisma schema, or Postgres tables** with the main Ekora Bazaar application. Accessed strictly via external navigation in the Admin Panel.

---

## 2. Database Providers and Connections

### 2.1 Connection Architecture & Driver Adapters
The application runtime operates on Next.js 16 (Turbopack) serverless endpoints. Connecting traditional pooled relational databases to serverless functions frequently causes pool exhaustion (`EMAXCONNSESSION`). 

Ekora Bazaar handles this using Prisma 7 with the **`PrismaPg` driver adapter** backed by `pg.Pool` (`src/lib/db.ts`):

```typescript
// Connection string precedence in src/lib/db.ts:
let connectionString = process.env.DATABASE_URL
if (!connectionString || connectionString.startsWith('prisma://')) {
  connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL
}
```

### 2.2 Pool Configuration & Port Routing
- **Runtime Pool Mode (Port 6543)**: If a Supabase pooler URL is detected on port `5432` (session mode), `src/lib/db.ts` automatically rewrites the port to `6543` (transaction mode).
- **Pool Sizing**:
  - `maxPoolSize`: Limited to `1` during build phase (`phase-production-build`) to eliminate build-time connection exhaustion, and `2` during runtime serverless executions.
  - `connectionTimeoutMillis`: `20000` (20 seconds).
  - `idleTimeoutMillis`: `30000` (30 seconds).
  - `ssl`: `{ rejectUnauthorized: false }` for remote cloud connections; disabled on `localhost`.
- **Static Build Safety (Lazy Proxy)**:
  `src/lib/db.ts` exports a JavaScript `Proxy` wrapping `PrismaClient`. This defers connection instantiation until an actual database query is executed, ensuring Next.js static page collection at build time never crashes if the database is unreachable.

### 2.3 CLI & Migration Configuration
CLI operations (Prisma Migrate, Introspection, DB Seed) cannot use transaction poolers (port 6543) because migrations require session-level DDL locks. 
`prisma.config.ts` explicitly prioritizes direct, non-pooling connection strings:

```typescript
// prisma.config.ts
datasource: {
  url: process.env["POSTGRES_URL_NON_POOLING"] || process.env["DIRECT_URL"] || process.env["DATABASE_URL"] || process.env["POSTGRES_PRISMA_URL"],
}
```

### 2.4 Environment Variables Reference
| Variable | Purpose | Used In |
| :--- | :--- | :--- |
| `DATABASE_URL` | Transaction pooled Postgres URL (port 6543) | `src/lib/db.ts`, Runtime |
| `DIRECT_URL` | Direct unpooled Postgres URL (port 5432) | `prisma.config.ts`, Migrations |
| `POSTGRES_URL_NON_POOLING` | Direct unpooled Vercel/Supabase Postgres connection | Migrations & CLI |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `src/lib/supabase.ts` |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase administrative key for Storage bucket access | `src/lib/supabase.ts` |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project credentials for KYC doc upload | `src/lib/firebase.ts` |
| `JWT_SECRET` | HMAC-SHA256 secret key for session cookie encryption | `src/lib/session.ts` |
| `NEXT_PUBLIC_BILLING_APP_URL` | Deployed AutoBilling standalone URL | `src/config/billing.ts` |

---

## 3. Complete Prisma Model Reference

The repository contains **24 Prisma Models** and **12 Enums** across Core Commerce, Seller Operations, Order Management, and Customer Intelligence.

```
Total Models: 24
- Core Platform & Auth (3): User, Seller, SellerBusiness
- Catalog & Pricing (2): Product, PriceChangeRequest
- Orders & Logistics (4): Order, OrderStatusHistory, OrderItem, Address
- Payments & Webhooks (2): Payment, WebhookEvent
- Cart System (2): Cart, CartItem
- Legacy Telemetry (2): Event, CustomerFlag
- Customer Intelligence Suite (9): CIEvent, CIIdentityLink, CISession, CICustomerFeature, CIProductDaily, CISessionDiagnosis, CIAction, CIOutcome, CISupplierHealth
```

---

### 3.1 Model: `User`
- **Purpose**: Central identity store for customers, sellers, and administrators.
- **Table Name**: `User`
- **Primary Key**: `id` (`String` UUID, `@default(uuid())`).
- **Unique Constraints**: `email` (unique), `phone` (unique, nullable), `googleId` (unique, nullable).
- **Fields**:
  - `id`: `String` (UUID)
  - `email`: `String`
  - `passwordHash`: `String?` (bcrypt hash)
  - `role`: `Role` enum (`CUSTOMER`, `SELLER`, `ADMIN`), default `CUSTOMER`
  - `name`: `String?`
  - `phone`: `String?`
  - `businessName`: `String?`
  - `googleId`: `String?`
  - `createdAt`: `DateTime` (`@default(now())`)
  - `updatedAt`: `DateTime` (`@updatedAt`)
- **Relations**:
  - `addresses`: `Address[]` (1-to-many)
  - `cart`: `Cart?` (1-to-1)
  - `customerFlags`: `CustomerFlag[]` (1-to-many)
  - `events`: `Event[]` (1-to-many)
  - `orders`: `Order[]` (1-to-many)
  - `payments`: `Payment[]` (1-to-many)
  - `adminProducts`: `Product[]` (`@relation("AdminCreatedProducts")`)
  - `seller`: `Seller?` (1-to-1)
- **Features Using It**: Authentication, checkout, admin role verification, seller profile linkage.
- **Code Paths**: `src/lib/auth.ts`, `src/lib/session.ts`, `src/app/api/auth/*`, `src/app/api/checkout/create-order/route.ts`.

---

### 3.2 Model: `Seller`
- **Purpose**: Represents an onboarding or approved seller entity.
- **Table Name**: `Seller`
- **Primary Key**: `id` (`String`, e.g. `EKO-SELL-XXXXXX` or `EKO-OFFICIAL-01`).
- **Unique Constraints**: `userId` (1-to-1 with `User`).
- **Fields**:
  - `id`: `String`
  - `userId`: `String`
  - `brandName`: `String`
  - `accountStatus`: `SellerAccountStatus` (`ACTIVE`, `SUSPENDED`, `DISABLED`), default `DISABLED`
  - `applicationStatus`: `SellerApplicationStatus` (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `RESUBMISSION_REQUIRED`), default `DRAFT`
  - `rejectionReason`: `String?`
  - `createdAt`: `DateTime`
  - `updatedAt`: `DateTime`
- **Relations**:
  - `user`: `User` (`fields: [userId], references: [id]`)
  - `businessDetails`: `SellerBusiness?` (1-to-1)
  - `products`: `Product[]` (`@relation("SellerProducts")`)
  - `priceChangeRequests`: `PriceChangeRequest[]`
  - `payments`: `Payment[]` (e.g. onboarding fee payments)
- **Features Using It**: Seller portal, admin seller approvals, catalog supplier attribution.
- **Code Paths**: `src/app/api/seller-application/route.ts`, `src/app/api/admin/sellers/*`, `src/app/api/seller/products/*`.

---

### 3.3 Model: `SellerBusiness`
- **Purpose**: Legal entity, GST, and tax registration information for sellers.
- **Table Name**: `SellerBusiness`
- **Primary Key**: `id` (`String` UUID).
- **Unique Constraints**: `sellerId` (unique, 1-to-1 with `Seller`).
- **Fields**:
  - `id`: `String` (UUID)
  - `sellerId`: `String`
  - `legalName`: `String`
  - `businessType`: `String` (e.g., `INDIVIDUAL`, `PROPRIETORSHIP`, `PVT_LTD`)
  - `address`: `String`
  - `gstin`: `String?`
  - `gstStatus`: `GSTStatus` (`NOT_SUBMITTED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `RESUBMISSION_REQUIRED`)
  - `documentUrls`: `Json?` (array of Firebase Storage URLs for PAN/Aadhaar/GST certificates)
  - `city`, `state`, `pincode`, `district`, `country`: `String?`
  - `tradeName`: `String?`
  - `natureOfBusiness`: `Json?`
  - `createdAt`, `updatedAt`: `DateTime`
- **Relations**:
  - `seller`: `Seller` (`fields: [sellerId], references: [id]`)
- **Features Using It**: Seller KYC compliance, GST verification, invoice tax generation.
- **Code Paths**: `src/app/api/seller-application/route.ts`, `src/app/start-selling/context/OnboardingContext.tsx`.

---

### 3.4 Model: `Product`
- **Purpose**: Stores seller-submitted and dynamically synced catalog products.
- **Table Name**: `Product`
- **Primary Key**: `id` (`String` UUID or integer string from static catalog).
- **Indexes**: `[status, category]`, `[status, sellerId]`.
- **Fields**:
  - `id`: `String`
  - `title`: `String`
  - `description`: `String?`
  - `price`: `Int` (in paise, integer representation of wholesale base price)
  - `customerPrice`: `Int?` (in paise, customer-facing retail price)
  - `stock`: `Int` (default `0`)
  - `status`: `ProductStatus` (`DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`, `REJECTED`), default `DRAFT`
  - `rejectionReason`: `String?`
  - `imageUrl`: `String?`
  - `sellerId`: `String?`
  - `createdByAdminId`: `String?`
  - `source`: `String` (default `SELLER`; also `EKORA_OFFICIAL`)
  - `category`: `String?` (default `General Silicone Moulds`)
  - `classificationConfidence`: `ClassificationConfidence` (`HIGH`, `LOW`, `UNCLASSIFIED`)
  - `classificationStatus`: `ClassificationStatus` (`CLASSIFIED`, `NEEDS_REVIEW`)
  - `moq`: `Int` (minimum order quantity, default `1`)
  - `wholesaleTiers`: `Json?` (array of `{ minQty, maxQty, price }`)
  - `breadthCm`, `heightCm`, `lengthCm`, `weightKg`: `Float?` (dimensions for Shiprocket courier calculation)
  - `createdAt`, `updatedAt`: `DateTime`
- **Relations**:
  - `seller`: `Seller?` (`@relation("SellerProducts")`)
  - `adminCreator`: `User?` (`@relation("AdminCreatedProducts")`)
  - `cartItems`: `CartItem[]`
  - `priceChangeRequests`: `PriceChangeRequest[]`
- **Features Using It**: Unified catalog API, shop product pages, seller product management, admin catalog approval.
- **Code Paths**: `src/lib/catalog.ts`, `src/app/api/products/route.ts`, `src/app/api/seller/products/*`, `src/app/api/admin/products/*`.

---

### 3.5 Model: `PriceChangeRequest`
- **Purpose**: Enables active sellers to request price updates subject to admin approval.
- **Table Name**: `PriceChangeRequest`
- **Primary Key**: `id` (`String` UUID).
- **Fields**:
  - `id`: `String`
  - `productId`: `String`
  - `sellerId`: `String`
  - `oldPrice`: `Int` (in paise)
  - `requestedPrice`: `Int` (in paise)
  - `reason`: `String?`
  - `status`: `PriceChangeRequestStatus` (`PENDING`, `APPROVED`, `REJECTED`)
  - `adminComment`: `String?`
  - `createdAt`: `DateTime`
  - `reviewedAt`: `DateTime?`
  - `reviewedBy`: `String?`
- **Relations**:
  - `product`: `Product` (`fields: [productId], references: [id]`)
  - `seller`: `Seller` (`fields: [sellerId], references: [id]`)
- **Features Using It**: Admin price change review dashboard, seller pricing controls.
- **Code Paths**: `src/app/admin/price-requests/*`, `src/app/api/admin/price-requests/*`.

---

### 3.6 Model: `Order`
- **Purpose**: Master record of purchase transactions and courier shipments.
- **Table Name**: `Order`
- **Primary Key**: `id` (`String` UUID).
- **Unique Constraints**: `razorpayOrderId` (`String?`, unique).
- **Fields**:
  - `id`: `String`
  - `customerId`: `String`
  - `status`: `OrderStatus` (`PAYMENT_PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `IN_TRANSIT`, `REFUND_INITIATED`, `REFUNDED`)
  - `paymentStatus`: `PaymentStatus` (`PENDING`, `CAPTURED`, `FAILED`, `REFUNDED`)
  - `subtotal`: `Int` (in paise)
  - `tax`: `Int` (in paise, default `0`)
  - `shipping`: `Int` (in paise, default `0`)
  - `total`: `Int` (in paise, total charged to customer)
  - `currency`: `String` (default `INR`)
  - `razorpayOrderId`: `String?`
  - `addressId`: `String?`
  - `addressSnapshot`: `Json?` (immutable snapshot of delivery address at checkout)
  - `shippingStatus`: `ShippingStatus` (`NOT_CREATED`, `CREATED`, `AWB_ASSIGNED`, `PICKUP_SCHEDULED`, `SHIPPED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `EXCEPTION`)
  - `shiprocketOrderId`: `String?`
  - `shipmentId`: `String?`
  - `awbCode`: `String?`
  - `courierName`: `String?`
  - `trackingUrl`: `String?`
  - `shippedAt`, `dispatchedAt`, `deliveredAt`: `DateTime?`
  - `cancellationReason`: `String?`
  - `source`: `String?` (default `website`)
  - `isSynthetic`: `Boolean` (default `false`, used for simulated CI stress testing)
  - `createdAt`, `updatedAt`: `DateTime`
- **Relations**:
  - `customer`: `User` (`fields: [customerId], references: [id]`)
  - `address`: `Address?` (`fields: [addressId], references: [id]`)
  - `items`: `OrderItem[]`
  - `payments`: `Payment[]`
  - `statusHistory`: `OrderStatusHistory[]`
- **Features Using It**: Checkout, payment verification, Shiprocket courier dispatch, admin order management, customer order history.
- **Code Paths**: `src/app/api/checkout/*`, `src/app/api/webhooks/razorpay/route.ts`, `src/app/api/admin/orders/*`, `src/app/api/webhooks/shiprocket/route.ts`.

---

### 3.7 Model: `OrderItem`
- **Purpose**: Line item breakdown for each purchased product in an order.
- **Table Name**: `OrderItem`
- **Primary Key**: `id` (`String` UUID).
- **Fields**:
  - `id`: `String`
  - `orderId`: `String`
  - `productId`: `String`
  - `sellerId`: `String?`
  - `productNameSnapshot`: `String` (preserves historical name if product is renamed)
  - `priceSnapshot`: `Int` (in paise, locked price at purchase time)
  - `quantity`: `Int`
  - `subtotal`: `Int` (in paise)
  - `createdAt`, `updatedAt`: `DateTime`
- **Relations**:
  - `order`: `Order` (`fields: [orderId], references: [id]`)
- **Features Using It**: Order invoice generation, customer order view, inventory fulfillment.
- **Code Paths**: `src/app/api/checkout/create-order/route.ts`, `src/app/account/orders/page.tsx`.

---

### 3.8 Model: `OrderStatusHistory`
- **Purpose**: Audit log for every state transition in an order's lifecycle.
- **Table Name**: `OrderStatusHistory`
- **Primary Key**: `id` (`String` UUID).
- **Fields**:
  - `id`: `String`
  - `orderId`: `String`
  - `status`: `OrderStatus`
  - `notes`: `String?`
  - `createdAt`: `DateTime` (`@default(now())`)
- **Relations**:
  - `order`: `Order` (`fields: [orderId], references: [id]`, `onDelete: Cascade`)
- **Features Using It**: Order tracking timeline, admin order status audit.
- **Code Paths**: `src/app/api/admin/orders/[id]/route.ts`, `src/app/api/checkout/confirm-payment/route.ts`.

---

### 3.9 Model: `Payment`
- **Purpose**: Financial transaction ledger for customer orders and seller onboarding fees.
- **Table Name**: `Payment`
- **Primary Key**: `id` (`String` UUID).
- **Unique Constraints**: `razorpayOrderId` (unique), `razorpayPaymentId` (unique), `webhookEventId` (unique).
- **Fields**:
  - `id`: `String`
  - `userId`: `String`
  - `sellerId`: `String?`
  - `orderId`: `String?`
  - `type`: `PaymentType` (`SELLER_ONBOARDING`, `CUSTOMER_ORDER`)
  - `provider`: `String` (default `RAZORPAY`)
  - `amount`: `Int` (in paise)
  - `currency`: `String` (default `INR`)
  - `status`: `PaymentStatus` (`PENDING`, `CAPTURED`, `FAILED`, `REFUNDED`)
  - `razorpayOrderId`: `String?`
  - `razorpayPaymentId`: `String?`
  - `razorpaySignature`: `String?`
  - `webhookEventId`: `String?`
  - `failureReason`: `String?`
  - `createdAt`, `updatedAt`: `DateTime`
- **Relations**:
  - `user`: `User` (`fields: [userId], references: [id]`)
  - `seller`: `Seller?` (`fields: [sellerId], references: [id]`)
  - `order`: `Order?` (`fields: [orderId], references: [id]`)
- **Features Using It**: Razorpay order creation, payment signature verification, financial auditing.
- **Code Paths**: `src/app/api/checkout/*`, `src/app/api/seller/payment/*`, `src/app/api/webhooks/razorpay/route.ts`.

---

### 3.10 Model: `WebhookEvent`
- **Purpose**: Ensures idempotent processing of Razorpay webhook notifications.
- **Table Name**: `WebhookEvent`
- **Primary Key**: `id` (`String` UUID).
- **Unique Constraints**: `eventId` (`String`, unique Razorpay event identifier).
- **Fields**:
  - `id`: `String`
  - `eventId`: `String` (e.g., `evt_xxxxxxxx`)
  - `eventType`: `String` (e.g., `payment.captured`, `payment.failed`, `order.paid`)
  - `payload`: `Json`
  - `processed`: `Boolean` (default `false`)
  - `createdAt`: `DateTime`
  - `processedAt`: `DateTime?`
- **Features Using It**: Webhook deduplication and replay prevention.
- **Code Paths**: `src/app/api/webhooks/razorpay/route.ts`.

---

### 3.11 Model: `Address`
- **Purpose**: Customer shipping and billing address book.
- **Table Name**: `Address`
- **Primary Key**: `id` (`String` UUID).
- **Indexes**: `[userId]`.
- **Fields**:
  - `id`: `String`
  - `userId`: `String`
  - `name`: `String`
  - `phone`: `String`
  - `line1`: `String`
  - `line2`: `String?`
  - `city`, `state`, `pincode`: `String`
  - `country`: `String` (default `India`)
  - `isDefault`: `Boolean` (default `false`)
  - `createdAt`, `updatedAt`: `DateTime`
- **Relations**:
  - `user`: `User` (`fields: [userId], references: [id]`)
  - `orders`: `Order[]`
- **Features Using It**: Checkout address selector, customer address management.
- **Code Paths**: `src/app/api/addresses/*`, `src/app/account/page.tsx`.

---

### 3.12 Model: `Cart`
- **Purpose**: Persistent shopping cart container for authenticated users.
- **Table Name**: `Cart`
- **Primary Key**: `id` (`String` UUID).
- **Unique Constraints**: `userId` (unique, 1-to-1 with `User`).
- **Fields**:
  - `id`: `String`
  - `userId`: `String`
  - `createdAt`, `updatedAt`: `DateTime`
- **Relations**:
  - `user`: `User` (`fields: [userId], references: [id]`)
  - `items`: `CartItem[]`
- **Features Using It**: Cart persistence across customer sessions, guest cart synchronization.
- **Code Paths**: `src/app/api/cart/*`, `src/app/api/cart/sync/route.ts`.

---

### 3.13 Model: `CartItem`
- **Purpose**: Line items inside an authenticated user's cart.
- **Table Name**: `CartItem`
- **Primary Key**: `id` (`String` UUID).
- **Unique Constraints**: `[cartId, productId]` (composite unique: prevents duplicate lines for same SKU).
- **Fields**:
  - `id`: `String`
  - `cartId`: `String`
  - `productId`: `String`
  - `quantity`: `Int` (default `1`)
  - `createdAt`, `updatedAt`: `DateTime`
- **Relations**:
  - `cart`: `Cart` (`fields: [cartId], references: [id]`, `onDelete: Cascade`)
  - `product`: `Product` (`fields: [productId], references: [id]`)
- **Features Using It**: Add to cart, quantity update, cart checkout cleanup.
- **Code Paths**: `src/app/api/cart/*`, `src/app/api/checkout/confirm-payment/route.ts`.

---

### 3.14 Model: `Event` (Legacy Telemetry)
- **Purpose**: General platform interaction events prior to the dedicated Customer Intelligence suite.
- **Table Name**: `Event`
- **Primary Key**: `id` (`BigInt` autoincrement).
- **Indexes**: `[userId, createdAt(sort: Desc)]`, `[sessionId, createdAt]`, `[eventName, createdAt]`.
- **Fields**:
  - `id`: `BigInt`
  - `userId`: `String?`
  - `sessionId`: `String`
  - `eventName`: `String`
  - `productId`: `String?`
  - `metadata`: `Json?`
  - `createdAt`: `DateTime`
- **Relations**:
  - `user`: `User?` (`fields: [userId], references: [id]`)
- **Features Using It**: Legacy analytics event logging.
- **Code Paths**: `src/app/api/events/route.ts`.

---

### 3.15 Model: `CustomerFlag` (Legacy Behavioral Flags)
- **Purpose**: Behavioral flags indicating customer hesitation or margin risks.
- **Table Name**: `CustomerFlag`
- **Primary Key**: Composite `[userId, flag]`.
- **Indexes**: `[flag, resolved]`.
- **Fields**:
  - `userId`: `String`
  - `flag`: `String`
  - `evidence`: `Json`
  - `firstDetectedAt`, `lastUpdatedAt`: `DateTime`
  - `resolved`: `Boolean` (default `false`)
- **Relations**:
  - `user`: `User` (`fields: [userId], references: [id]`, `onDelete: Cascade`)
- **Features Using It**: Admin intelligence flags view.
- **Code Paths**: `src/app/admin/intelligence/BehavioralFlags.tsx`.

---

### 3.16 Customer Intelligence Models (`ci_*`)

The Customer Intelligence (CI) subsystem uses 9 specialized tables optimized for high-volume telemetry ingestion, session stitching, diagnostic causal reasoning, and closed-loop intervention attribution:

#### 3.16.1 Model: `CIEvent` (Table: `ci_events`)
- **Purpose**: Raw 1st-party behavioral telemetry (page views, hesitation, cart modifications, checkout steps, errors).
- **Primary Key**: `eventId` (`String` UUID).
- **Indexes**: `[sessionId, ts]`, `[eventName, ts]`, `[anonymousId, ts]`.
- **Fields**: `eventId`, `ts` (`DateTime`), `anonymousId`, `sessionId`, `customerId?`, `eventName`, `productId?`, `pagePath?`, `device?`, `utm` (`Json?`), `props` (`Json?`), `isBot` (`Boolean`), `isInternal` (`Boolean`), `isSynthetic` (`Boolean`).
- **Code Paths**: `src/app/api/collect/route.ts`, `src/lib/server-ci.ts`.

#### 3.16.2 Model: `CIIdentityLink` (Table: `ci_identity_links`)
- **Purpose**: Identity resolution stitching anonymous browser UUIDs to registered customer IDs upon login or checkout.
- **Primary Key**: Composite `[anonymousId, customerId]`.
- **Indexes**: `[customerId]`.
- **Fields**: `anonymousId`, `customerId`, `linkedAt` (`DateTime`).
- **Code Paths**: `src/app/api/collect/route.ts`.

#### 3.16.3 Model: `CISession` (Table: `ci_sessions`)
- **Purpose**: Sessionized visitor journey records compiled by a 15-minute scheduled cron aggregator.
- **Primary Key**: `sessionId` (`String`).
- **Indexes**: `[visitorKey, startedAt]`, `[isLost, startedAt]`.
- **Fields**: `sessionId`, `visitorKey`, `startedAt`, `endedAt`, `source?`, `device?`, `pages` (`Int`), `maxStage` (`String?`), `cartValue` (`Decimal(12,2)?`), `hadError` (`Boolean`), `isLost` (`Boolean`), `isRecovered` (`Boolean?`).
- **Relations**: `diagnosis`: `CISessionDiagnosis?` (1-to-1).
- **Code Paths**: `src/customer-intelligence/lib/cron-jobs.ts`.

#### 3.16.4 Model: `CICustomerFeature` (Table: `ci_customer_features`)
- **Purpose**: Rolling 30-day behavioral aggregate features per visitor key.
- **Primary Key**: `visitorKey` (`String`).
- **Fields**: `visitorKey`, `sessions30d`, `productViews30d`, `carts30d`, `checkouts30d`, `ordersTotal`, `lastOrderAt`, `avgOrderValue` (`Decimal(12,2)`), `coaClicks30d`, `whatsappClicks30d`, `updatedAt`.
- **Code Paths**: `src/customer-intelligence/lib/cron-jobs.ts`.

#### 3.16.5 Model: `CIProductDaily` (Table: `ci_product_daily`)
- **Purpose**: Daily product-level demand signals synthesized from events and orders.
- **Primary Key**: Composite `[day, productId]`.
- **Indexes**: `[productId, day]`.
- **Fields**: `day` (`Date`), `productId`, `views`, `carts`, `purchases`, `unitsSold`, `searches`, `noResultSearches`, `oosViews`, `requests`, `whatsappClicks`.
- **Code Paths**: `src/customer-intelligence/lib/cron-jobs.ts`.

#### 3.16.6 Model: `CISessionDiagnosis` (Table: `ci_session_diagnosis`)
- **Purpose**: Diagnostic engine output assigning root causes and evidence to abandoned or lost buyer sessions.
- **Primary Key**: `sessionId` (`String`).
- **Indexes**: `[cause, diagnosedAt]`, `[handled, diagnosedAt]`.
- **Fields**: `sessionId`, `cause`, `confidence`, `evidence` (`Json`), `ruleVersion`, `diagnosedAt`, `handled` (`Boolean`), `handledAt`, `handledBy`.
- **Relations**: `session`: `CISession` (`fields: [sessionId], references: [sessionId]`).
- **Code Paths**: `src/customer-intelligence/lib/diagnosis-engine.ts`.

#### 3.16.7 Model: `CIAction` (Table: `ci_actions`)
- **Purpose**: Recommended sales or engagement interventions with randomized holdout assignment for A/B testing.
- **Primary Key**: `actionId` (`BigInt` autoincrement).
- **Indexes**: `[visitorKey, createdAt]`, `[status, createdAt]`.
- **Fields**: `actionId`, `visitorKey`, `cause`, `actionType`, `inHoldout` (`Boolean`), `status` (`String`), `createdAt`, `handledBy`, `handledAt`.
- **Relations**: `outcome`: `CIOutcome?` (1-to-1).
- **Code Paths**: `src/customer-intelligence/lib/diagnosis-engine.ts`.

#### 3.16.8 Model: `CIOutcome` (Table: `ci_outcomes`)
- **Purpose**: 7-day attribution tracking linking recommended interventions to actual purchases and gross margin.
- **Primary Key**: `actionId` (`BigInt`).
- **Fields**: `actionId`, `purchased` (`Boolean`), `orderValue` (`Decimal(12,2)?`), `grossMargin` (`Decimal(12,2)?`), `windowEnd` (`DateTime?`).
- **Relations**: `action`: `CIAction` (`fields: [actionId], references: [actionId]`).
- **Code Paths**: `src/customer-intelligence/lib/cron-jobs.ts`.

#### 3.16.9 Model: `CISupplierHealth` (Table: `ci_supplier_health`)
- **Purpose**: Daily supplier fulfillment performance metrics (dispatch latency, cancellation rates, COA documentation).
- **Primary Key**: Composite `[sellerId, productId]`.
- **Indexes**: `[isFlagged]`.
- **Fields**: `sellerId`, `productId`, `avgDispatchDays` (`Decimal(6,2)`), `cancelRate` (`Decimal(6,4)`), `stockoutDays30d` (`Int`), `isFlagged` (`Boolean`), `hasCoaDoc` (`Boolean`), `listingScore` (`Int`), `updatedAt`.
- **Code Paths**: `src/customer-intelligence/lib/cron-jobs.ts`.

---

## 4. Complete Data Storage Mapping

| Domain / Feature | Storage System | Specific Model, Table, or File Path | Responsible Controller / API | Data Read & Write Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Users & Authentication** | PostgreSQL | `User` table | `src/app/api/auth/*`, `src/lib/session.ts` | **Write**: Signup/login hashes password with `bcrypt`, writes `User`, issues signed JWT cookie.<br>**Read**: Authenticated routes decrypt JWT cookie, query `User` by `id`. |
| **Admin Permissions** | PostgreSQL + JWT | `User.role` enum (`ADMIN`) | `src/lib/auth.ts` (`requireAdmin`) | **Read**: Extracted from signed session token; verified against `User.role === 'ADMIN'`. Redirects unauthorized users to `/`. |
| **Sellers & Onboarding** | PostgreSQL + Firebase Storage | `Seller`, `SellerBusiness`, Firebase Storage bucket | `src/app/api/seller-application/route.ts` | **Write**: KYC docs uploaded directly to Firebase Storage; metadata, GST, and business details saved to `Seller` and `SellerBusiness`.<br>**Read**: Admin reviews in `/admin/sellers`. |
| **Customer Addresses** | PostgreSQL | `Address` table | `src/app/api/addresses/*` | **Write**: Added or edited during checkout or in `/account`.<br>**Read**: Pre-populated at checkout. Immutable snapshot cloned to `Order.addressSnapshot`. |
| **Products & Catalog** | Hybrid: PostgreSQL + Static JSON | `src/lib/data/products.json` & `Product` table | `src/lib/catalog.ts` (`getUnifiedCatalog`) | **Write**: Static products synced via seed/scripts; seller products inserted via `/api/seller/products`.<br>**Read**: `getUnifiedCatalog` merges in-memory JSON with cached DB seller products. |
| **Product Images & Docs** | Supabase Storage + Static Directory | `product-images` bucket, `/public/images/products/*` | `src/app/api/seller/upload-image/route.ts` | **Write**: Validated via magic bytes, uploaded to Supabase Storage.<br>**Read**: Public CDN URLs served to buyer cards. |
| **Inventory & Stock** | PostgreSQL | `Product.stock` | `src/app/api/checkout/create-order/route.ts` | **Write**: Atomically decremented at order creation (`decrement: item.quantity`). Restored if payment fails.<br>**Read**: Checked during checkout validation. |
| **Shopping Carts** | Hybrid: Client LocalStorage + PostgreSQL | `localStorage['ekora_guest_cart']` & `Cart`, `CartItem` | `src/lib/guest-cart.ts`, `src/app/api/cart/*` | **Write**: Unauthenticated users write to `localStorage`. Synced to Postgres `CartItem` upon login.<br>**Read**: MiniCartDrawer renders from local store or DB. |
| **Orders & Line Items** | PostgreSQL | `Order`, `OrderItem`, `OrderStatusHistory` | `src/app/api/checkout/create-order/route.ts` | **Write**: Created with status `PAYMENT_PENDING`, snapshotting unit price and line totals inside a Prisma transaction.<br>**Read**: Customer order history and admin orders portal. |
| **Razorpay Payments** | PostgreSQL + Gateway | `Payment`, `WebhookEvent` | `src/app/api/checkout/confirm-payment/route.ts`, `src/app/api/webhooks/razorpay/route.ts` | **Write**: Razorpay order created via SDK. On completion, webhook verifies HMAC signature, logs `WebhookEvent`, marks `Payment` `CAPTURED`. |
| **Refunds & Payouts** | PostgreSQL (Status Only) | `Order.status`, `Payment.status` | `src/app/api/admin/orders/[id]/route.ts` | **Write**: Status flags updated to `REFUND_INITIATED` / `REFUNDED`.<br>**Note**: Automated Razorpay refund API and automated seller payout disbursements are **not implemented** in code. |
| **Leads & Inquiries** | Hybrid: PostgreSQL + Local JSON | `Order` (`status: PAYMENT_PENDING`), `applications.json` | `src/app/api/admin/leads/route.ts`, `src/app/api/apply/route.ts` | **Write**: Abandoned checkouts become leads in `Order`. Creator applications write to `applications.json` and dispatch email.<br>**Read**: Admin leads dashboard. |
| **Customer Intelligence** | PostgreSQL | `ci_events`, `ci_sessions`, `ci_product_daily`, etc. | `src/app/api/collect/route.ts`, `src/lib/server-ci.ts` | **Write**: Client sends beacon batches to `/api/collect`. Aggregated hourly by scheduled background jobs.<br>**Read**: Admin Customer Intelligence Portal. |
| **Reviews & Ratings** | Not in Database | Static UI / Hardcoded | Marketing components | **Note**: No `Review` or `Rating` table exists in PostgreSQL. Displayed ratings are static presentation fixtures. |
| **Blog, Guides, Formulations** | Local Markdown & JSON | `content/blog/*.md`, `src/lib/data/formulations.json` | `src/lib/blog.ts`, `src/app/guides/*`, `src/app/formulations/*` | **Read**: Parsed at build time using Node `fs`, rendered statically with ISR / SSG. |
| **SEO/GEO Metadata** | Code & Schemas | `src/lib/seo.ts`, `src/lib/taxonomy.ts`, `src/lib/faqs.ts` | Next.js `generateMetadata` | **Read**: Generates OpenGraph tags, canonical links, and Schema.org JSON-LD schemas (`Product`, `FAQPage`, `Article`). |
| **AutoBilling App** | External Vercel App | Independent external application | `src/config/billing.ts`, `src/app/admin/layout.tsx` | **Navigation**: Admin clicks "Billing" in sidebar -> opens `https://autobilling-rho.vercel.app` in new tab (`target="_blank"`). **Does NOT access Ekora DB.** |

---

## 5. Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Address : "has many"
    User ||--o| Cart : "owns"
    User ||--o| Seller : "operates as"
    User ||--o{ Order : "places"
    User ||--o{ Payment : "submits"
    User ||--o{ Product : "creates (admin)"
    User ||--o{ Event : "triggers (legacy)"
    User ||--o{ CustomerFlag : "flagged with (legacy)"

    Seller ||--o| SellerBusiness : "legal details"
    Seller ||--o{ Product : "supplies"
    Seller ||--o{ PriceChangeRequest : "requests"
    Seller ||--o{ Payment : "onboarding fee"

    Product ||--o{ CartItem : "in cart"
    Product ||--o{ PriceChangeRequest : "subject to"

    Cart ||--o{ CartItem : "contains"

    Order ||--o{ OrderItem : "contains"
    Order ||--o{ OrderStatusHistory : "tracked by"
    Order ||--o{ Payment : "paid by"
    Order }o--o| Address : "shipped to"

    Payment }o--o| WebhookEvent : "verified by"

    CIEvent }o--o| CISession : "aggregates into"
    CISession ||--o| CISessionDiagnosis : "diagnosed as"
    CIAction ||--o| CIOutcome : "measures"
    
    User {
        string id PK
        string email UK
        string passwordHash
        Role role
        string phone UK
        datetime createdAt
    }

    Seller {
        string id PK
        string userId FK, UK
        string brandName
        SellerAccountStatus accountStatus
        SellerApplicationStatus applicationStatus
    }

    SellerBusiness {
        string id PK
        string sellerId FK, UK
        string legalName
        string gstin
        json documentUrls
    }

    Product {
        string id PK
        string title
        int price
        int customerPrice
        int stock
        ProductStatus status
        string sellerId FK
        string category
        json wholesaleTiers
    }

    Cart {
        string id PK
        string userId FK, UK
    }

    CartItem {
        string id PK
        string cartId FK
        string productId FK
        int quantity
    }

    Order {
        string id PK
        string customerId FK
        OrderStatus status
        PaymentStatus paymentStatus
        int total
        string razorpayOrderId UK
        json addressSnapshot
        string awbCode
        string courierName
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId
        int priceSnapshot
        int quantity
        int subtotal
    }

    Payment {
        string id PK
        string userId FK
        string orderId FK
        PaymentType type
        int amount
        PaymentStatus status
        string razorpayOrderId UK
        string razorpayPaymentId UK
    }

    CIEvent {
        string event_id PK
        datetime ts
        string anonymous_id
        string session_id
        string event_name
        string product_id
    }

    CISession {
        string session_id PK
        string visitor_key
        datetime started_at
        boolean is_lost
        decimal cart_value
    }

    CISessionDiagnosis {
        string session_id PK, FK
        string cause
        string confidence
        json evidence
    }

    CIAction {
        bigint action_id PK
        string visitor_key
        string action_type
        boolean in_holdout
    }

    CIOutcome {
        bigint action_id PK, FK
        boolean purchased
        decimal order_value
    }
```

---

## 6. Application Data Flows

### 6.1 User Registration & Login Flow
```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / Browser
    participant API as /api/auth/*
    participant DB as PostgreSQL (User)
    participant Session as jose (JWT Engine)

    Customer->>API: POST /api/auth/signup (email, password, name)
    API->>DB: findUnique({ where: { email } })
    alt Email already registered
        API-->>Customer: 409 Conflict ("Email already exists")
    else New registration
        API->>API: bcrypt.hash(password, 10)
        API->>DB: user.create({ email, passwordHash, role: 'CUSTOMER' })
        DB-->>API: Created User record
        API->>Session: encrypt({ userId, role: 'CUSTOMER', sellerId: null })
        Session-->>API: Encrypted HS256 JWT
        API-->>Customer: Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax
    end
```

### 6.2 Checkout & Atomic Stock Reservation Flow
```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Buyer
    participant CheckoutAPI as /api/checkout/create-order
    participant DB as PostgreSQL
    participant Razorpay as Razorpay API

    Buyer->>CheckoutAPI: POST items [{ productId, quantity }], address
    CheckoutAPI->>DB: BEGIN TRANSACTION ($transaction)
    loop For each item in cart
        CheckoutAPI->>DB: SELECT * FROM Product WHERE id = productId
        CheckoutAPI->>DB: UPDATE Product SET stock = stock - qty WHERE id = productId AND stock >= qty
        alt Concurrent stock race (count === 0)
            DB-->>CheckoutAPI: 0 rows updated
            CheckoutAPI-->>Buyer: ROLLBACK & 400 "Insufficient stock"
        end
    end
    CheckoutAPI->>Razorpay: razorpay.orders.create({ amount, currency: 'INR' })
    Razorpay-->>CheckoutAPI: razorpay_order_id
    CheckoutAPI->>DB: INSERT INTO Order (status: PAYMENT_PENDING, razorpayOrderId)
    CheckoutAPI->>DB: INSERT INTO OrderItem (snapshots of price & title)
    CheckoutAPI->>DB: INSERT INTO Payment (status: PENDING, razorpayOrderId)
    CheckoutAPI->>DB: COMMIT TRANSACTION
    CheckoutAPI-->>Buyer: Return { orderId, razorpayOrderId, amount }
```

### 6.3 Payment Verification & Idempotency Flow
```mermaid
sequenceDiagram
    autonumber
    participant Gateway as Razorpay Webhook / Frontend
    participant API as /api/checkout/confirm-payment or /api/webhooks/razorpay
    participant DB as PostgreSQL

    Gateway->>API: POST { razorpayOrderId, razorpayPaymentId, razorpaySignature }
    API->>API: crypto.createHmac('sha256', secret).update(body).digest('hex')
    alt Signature mismatch
        API-->>Gateway: 400 Invalid Signature
    else Signature Verified
        API->>DB: BEGIN TRANSACTION ($transaction)
        API->>DB: SELECT * FROM Payment WHERE razorpayOrderId = orderId
        alt Payment already CAPTURED
            API-->>Gateway: Return 200 (Idempotent early exit)
        else Payment is PENDING
            API->>DB: UPDATE Payment SET status = 'CAPTURED', razorpayPaymentId
            API->>DB: UPDATE Order SET status = 'PAID', paymentStatus = 'CAPTURED'
            API->>DB: INSERT INTO OrderStatusHistory (status: 'PAID')
            API->>DB: DELETE FROM CartItem WHERE productId IN (purchasedItems)
            API->>DB: COMMIT TRANSACTION
            API-->>Gateway: 200 Payment Verified
        end
    end
```

---

## 7. Database Management Guide

All commands reflect the actual tooling configured in `package.json` and `prisma.config.ts`.

### 7.1 Local Database Setup
To set up a local Postgres instance matching the project configuration:

```bash
# Run local PostgreSQL using Docker
docker run --name ekora-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ekorabazaar -p 5432:5432 -d postgres:16-alpine

# Set your .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ekorabazaar?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ekorabazaar?schema=public"
```

### 7.2 Prisma Client Generation
Regenerates the TypeScript client types in `node_modules/@prisma/client`:

```bash
# Run standalone generation
npx prisma generate

# Or via package.json script
npm run postinstall
```

### 7.3 Executing Migrations
Migrations are stored in `prisma/migrations/`. 

```bash
# Apply pending migrations to local development DB
npx prisma migrate dev

# Apply migrations safely in CI/CD or production (requires DIRECT_URL)
npx prisma migrate deploy

# Check migration status across environments
npx prisma migrate status
```

### 7.4 Seeding the Database
Seeds admin accounts, official seller profiles, and ingests baseline products:

```bash
# Execute seed script configured in package.json
npx prisma db seed

# Direct execution via ts-node
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts
```

### 7.5 Production Deployment Safe Workflow
1. **Pre-Deployment**: Never run `npx prisma db push` against production. Always create a versioned migration using `npx prisma migrate dev --name <description>`.
2. **Connection Port Check**: Ensure production runtime `DATABASE_URL` targets port `6543` (transaction pooler). Ensure `DIRECT_URL` targets port `5432` for running `npx prisma migrate deploy`.
3. **Build Script Verification**: Notice that `npm run build` in `package.json` automatically triggers `prisma generate && next build`.

---

## 8. Security and Data Integrity

### 8.1 Authentication & Password Security
- Passwords are encrypted before database insertion using `bcrypt` with `10` salt rounds (`src/app/api/auth/signup/route.ts`).
- Plaintext passwords or payment secrets are **never** persisted in database columns or included in JWT payloads.
- Role-based authorization is enforced server-side using helper guards in `src/lib/auth.ts`:
  - `requireAuth()`: Ensures active session.
  - `requireAdmin()`: Enforces `session.role === 'ADMIN'`.
  - `requireSeller()`: Enforces `session.role === 'SELLER'`.
  - `requireSellerOwnership(targetSellerId)`: Enforces that the authenticated seller can only read/mutate their own products and profile.

### 8.2 Payment Signature & Webhook Verification
- Frontend payment parameters are verified server-side with HMAC-SHA256 (`crypto.createHmac('sha256', keySecret)`).
- Webhook endpoints verify `x-razorpay-signature` against the raw unparsed request body to defeat tampering attacks.
- Duplicate webhook deliveries are deduplicated using unique database constraint on `WebhookEvent.eventId`.

### 8.3 Concurrency Control & Inventory Protection
- Stock reservations use atomic SQL decrements (`UPDATE "Product" SET stock = stock - qty WHERE id = ... AND stock >= qty`) inside an ACID transaction (`prisma.$transaction`).
- If an order payment fails or is aborted, pre-reserved stock is safely incremented back (`src/app/api/webhooks/razorpay/route.ts`).

---

## 9. Backup and Recovery

### 9.1 Managed Supabase Backups
- **Continuous WAL Archiving**: PostgreSQL Write-Ahead Logging (WAL) enables Point-In-Time Recovery (PITR) up to the minute.
- **Daily Automated Snapshots**: Maintained for 7 to 30 days depending on the cloud tier.

### 9.2 Manual Backup Workflow (`pg_dump`)
To take an ad-hoc snapshot of the production database before major schema migrations:

```bash
# Export schema and data (excluding sensitive connection strings in shell history)
pg_dump --clean --if-exists --no-owner --no-privileges -d "$DIRECT_URL" -Fc -f ekora_backup_$(date +%Y%m%d_%H%M%S).dump

# Restore dump to a staging/recovery database
pg_restore --clean --if-exists --no-owner --no-privileges -d "$STAGING_DIRECT_URL" ekora_backup_<timestamp>.dump
```

### 9.3 Disaster Recovery Procedures
1. **Schema Rollback**: If a bad migration is deployed, revert the migration SQL using an inverse migration; never delete past folders in `prisma/migrations` on production.
2. **Storage Recovery**: KYC files in Firebase Storage and product images in Supabase Storage are stored in cloud buckets with object versioning enabled.

---

## 10. Known Gaps, Consistency Risks, and Recommendations

### 10.1 Verified Facts
1. **Dual Source of Truth for Catalog**:
   - The master catalog resides in `src/lib/data/products.json` (2,700+ supplier items).
   - Only seller-created products or items specifically added to cart / checked out are inserted into PostgreSQL `Product`.
   - `getUnifiedCatalog()` in `src/lib/catalog.ts` dynamically merges these two disparate data sources in server memory.
2. **Lead Data Partitioning**:
   - Creator/seller early-access leads from `/start-selling` are written to flat-file `applications.json`.
   - Buyer checkout abandonment leads are queried from the `Order` table where `status = 'PAYMENT_PENDING'`.
3. **Missing Review & Rating Tables**:
   - Product pages display star ratings and reviews, but no `Review` model exists in `schema.prisma`. All customer reviews on the storefront are currently static UI fixtures.
4. **Standalone Billing Software**:
   - AutoBilling (`https://autobilling-rho.vercel.app`) is hosted as an independent deployment on Vercel and does not connect to Ekora Bazaar's PostgreSQL database.

### 10.2 Potential Consistency Risks
1. **Stock Reservation Expiration**:
   - Stock is decremented immediately when `create-order` is called. If a customer leaves the Razorpay modal open or abandons the tab without an explicit `payment.failed` event, the reserved stock may remain decremented until manual admin intervention or expiration cron execution (`/api/admin/orders/restore-expired`).
2. **In-Memory Cache Staleness**:
   - Seller products are cached in server memory for 60 seconds (`src/lib/catalog.ts`). High-frequency updates to seller stock or pricing may experience a 1-minute propagation delay across serverless instances.

### 10.3 Architectural Recommendations
1. **Full Catalog Migration to PostgreSQL**:
   - Migrate all 2,754 static products from `src/lib/data/products.json` completely into the PostgreSQL `Product` table. This will eliminate dual-source-of-truth reconciliation logic and enable native SQL filtering, full-text search, and relational consistency.
2. **Automated Stock Release Cron**:
   - Implement a recurring 15-minute cron job targeting `Order` records where `status = 'PAYMENT_PENDING'` and `createdAt < NOW() - INTERVAL '30 minutes'` to automatically release reserved stock and transition the order to `CANCELLED`.
3. **Consolidate File Storage**:
   - Unify file storage under a single provider (e.g. migrate Firebase KYC documents to private Supabase Storage buckets with Row-Level Security) to reduce third-party SDK dependencies.
4. **Foreign Key Indexes**:
   - Add explicit Prisma `@@index([orderId])` on `OrderItem` and `Payment`, and `@@index([sellerId])` on `Product` to optimize admin relational join performance as order volumes scale.

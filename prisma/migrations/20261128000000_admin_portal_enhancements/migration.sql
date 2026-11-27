-- Admin Portal Enhancements: Multi-Shipment Tracking, Private Admin Order Notes, Leads Separation, Product Management

-- 1. Lead enums
DO $$ BEGIN
    CREATE TYPE "LeadSource" AS ENUM ('CANCELLED_ORDER', 'INCOMPLETE_CHECKOUT', 'ABANDONED_CHECKOUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Extend Product for MRP, gallery images, active status, and admin management
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "mrp" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "adminManaged" BOOLEAN NOT NULL DEFAULT false;

-- 3. Multi-Shipment Tracking table
CREATE TABLE IF NOT EXISTS "OrderShipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shipmentNumber" INTEGER NOT NULL DEFAULT 1,
    "courierName" TEXT NOT NULL,
    "awbCode" TEXT NOT NULL,
    "trackingUrl" TEXT,
    "status" "ShippingStatus" NOT NULL DEFAULT 'SHIPPED',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderShipment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderShipment_orderId_createdAt_idx" ON "OrderShipment"("orderId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderShipment_awbCode_idx" ON "OrderShipment"("awbCode");

DO $$ BEGIN
    ALTER TABLE "OrderShipment" ADD CONSTRAINT "OrderShipment_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Private Admin Order Notes table (Admin-only, never exposed to customers)
CREATE TABLE IF NOT EXISTS "OrderAdminNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAdminNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderAdminNote_orderId_createdAt_idx" ON "OrderAdminNote"("orderId", "createdAt" DESC);

DO $$ BEGIN
    ALTER TABLE "OrderAdminNote" ADD CONSTRAINT "OrderAdminNote_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "OrderAdminNote" ADD CONSTRAINT "OrderAdminNote_authorId_fkey"
        FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Leads table (Cancelled orders, Incomplete checkouts, Abandoned checkouts)
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "customerId" TEXT,
    "orderId" TEXT,
    "convertedOrderId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "itemsSnapshot" JSONB,
    "orderValue" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "reason" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Lead_dedupeKey_key" ON "Lead"("dedupeKey");
CREATE UNIQUE INDEX IF NOT EXISTS "Lead_orderId_key" ON "Lead"("orderId");
CREATE INDEX IF NOT EXISTS "Lead_source_status_idx" ON "Lead"("source", "status");
CREATE INDEX IF NOT EXISTS "Lead_customerId_idx" ON "Lead"("customerId");
CREATE INDEX IF NOT EXISTS "Lead_customerEmail_idx" ON "Lead"("customerEmail");
CREATE INDEX IF NOT EXISTS "Lead_lastActivityAt_idx" ON "Lead"("lastActivityAt" DESC);

DO $$ BEGIN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_convertedOrderId_fkey"
        FOREIGN KEY ("convertedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. Safe idempotent backfill of existing legacy single-shipment Order tracking into OrderShipment
INSERT INTO "OrderShipment" (
    "id",
    "orderId",
    "shipmentNumber",
    "courierName",
    "awbCode",
    "trackingUrl",
    "status",
    "shippedAt",
    "deliveredAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'ship_' || o."id",
    o."id",
    1,
    COALESCE(NULLIF(o."courierName", ''), 'Courier Partner'),
    COALESCE(NULLIF(o."awbCode", ''), 'PENDING-AWB'),
    o."trackingUrl",
    CASE
        WHEN o."shippingStatus" = 'NOT_CREATED' THEN 'SHIPPED'::"ShippingStatus"
        ELSE o."shippingStatus"
    END,
    o."shippedAt",
    o."deliveredAt",
    COALESCE(o."shippedAt", o."createdAt"),
    o."updatedAt"
FROM "Order" o
WHERE (o."awbCode" IS NOT NULL AND o."awbCode" <> '')
   OR (o."trackingUrl" IS NOT NULL AND o."trackingUrl" <> '')
ON CONFLICT ("id") DO NOTHING;

-- 7. Safe idempotent backfill of existing CANCELLED and PAYMENT_PENDING orders into Lead
INSERT INTO "Lead" (
    "id",
    "dedupeKey",
    "source",
    "status",
    "customerId",
    "orderId",
    "customerName",
    "customerEmail",
    "customerPhone",
    "itemsSnapshot",
    "orderValue",
    "currency",
    "reason",
    "lastActivityAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'lead_ord_' || o."id",
    'order:' || o."id",
    CASE
        WHEN o."status" = 'CANCELLED' THEN 'CANCELLED_ORDER'::"LeadSource"
        ELSE 'INCOMPLETE_CHECKOUT'::"LeadSource"
    END,
    'NEW'::"LeadStatus",
    o."customerId",
    o."id",
    COALESCE(o."addressSnapshot"->>'name', o."addressSnapshot"->>'fullName', u."name"),
    u."email",
    COALESCE(o."addressSnapshot"->>'phone', u."phone"),
    (
        SELECT jsonb_agg(jsonb_build_object(
            'productId', oi."productId",
            'productName', oi."productNameSnapshot",
            'quantity', oi."quantity",
            'unitPricePaise', oi."priceSnapshot",
            'subtotalPaise', oi."subtotal"
        ))
        FROM "OrderItem" oi
        WHERE oi."orderId" = o."id"
    ),
    o."total",
    o."currency",
    o."cancellationReason",
    o."updatedAt",
    o."createdAt",
    o."updatedAt"
FROM "Order" o
LEFT JOIN "User" u ON u."id" = o."customerId"
WHERE o."status" IN ('CANCELLED', 'PAYMENT_PENDING')
ON CONFLICT ("dedupeKey") DO NOTHING;

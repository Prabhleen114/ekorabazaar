-- Product Reviews & Verified Purchase Review Invites

-- 1. ReviewStatus enum
DO $$ BEGIN
    CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ReviewToken table (links an order + orderItem + product to a secure review invite link)
CREATE TABLE IF NOT EXISTS "ReviewToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReviewToken_token_key" ON "ReviewToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "ReviewToken_orderItemId_key" ON "ReviewToken"("orderItemId");
CREATE INDEX IF NOT EXISTS "ReviewToken_orderId_productId_idx" ON "ReviewToken"("orderId", "productId");
CREATE INDEX IF NOT EXISTS "ReviewToken_productId_idx" ON "ReviewToken"("productId");

DO $$ BEGIN
    ALTER TABLE "ReviewToken" ADD CONSTRAINT "ReviewToken_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReviewToken" ADD CONSTRAINT "ReviewToken_orderItemId_fkey"
        FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReviewToken" ADD CONSTRAINT "ReviewToken_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Review table
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "orderItemId" TEXT,
    "reviewTokenId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "reviewerName" TEXT,
    "reviewerEmail" TEXT,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "moderatedById" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Review_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS "Review_orderItemId_key" ON "Review"("orderItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_reviewTokenId_key" ON "Review"("reviewTokenId");
CREATE INDEX IF NOT EXISTS "Review_productId_status_createdAt_idx" ON "Review"("productId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Review_status_createdAt_idx" ON "Review"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Review_rating_idx" ON "Review"("rating");
CREATE INDEX IF NOT EXISTS "Review_userId_productId_idx" ON "Review"("userId", "productId");
CREATE INDEX IF NOT EXISTS "Review_orderId_productId_idx" ON "Review"("orderId", "productId");
CREATE INDEX IF NOT EXISTS "Review_reviewerEmail_productId_idx" ON "Review"("reviewerEmail", "productId");

DO $$ BEGIN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_orderItemId_fkey"
        FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewTokenId_fkey"
        FOREIGN KEY ("reviewTokenId") REFERENCES "ReviewToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_moderatedById_fkey"
        FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "dispatchedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Event" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "productId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerFlag" (
    "userId" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CustomerFlag_pkey" PRIMARY KEY ("userId","flag")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_userId_createdAt_idx" ON "Event"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Event_sessionId_createdAt_idx" ON "Event"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "Event_eventName_createdAt_idx" ON "Event"("eventName", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerFlag_flag_resolved_idx" ON "CustomerFlag"("flag", "resolved");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Event_userId_fkey') THEN
        ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomerFlag_userId_fkey') THEN
        ALTER TABLE "CustomerFlag" ADD CONSTRAINT "CustomerFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

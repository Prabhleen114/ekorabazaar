-- CreateEnum
CREATE TYPE "PriceChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "moq" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "wholesaleTiers" JSONB;

-- CreateTable
CREATE TABLE "PriceChangeRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "oldPrice" INTEGER NOT NULL,
    "requestedPrice" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "PriceChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "PriceChangeRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceChangeRequest" ADD CONSTRAINT "PriceChangeRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceChangeRequest" ADD CONSTRAINT "PriceChangeRequest_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

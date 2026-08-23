-- CreateEnum
CREATE TYPE "ClassificationConfidence" AS ENUM ('HIGH', 'LOW', 'UNCLASSIFIED');

-- CreateEnum
CREATE TYPE "ClassificationStatus" AS ENUM ('CLASSIFIED', 'NEEDS_REVIEW');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "classificationConfidence" "ClassificationConfidence" NOT NULL DEFAULT 'UNCLASSIFIED',
ADD COLUMN "classificationStatus" "ClassificationStatus" NOT NULL DEFAULT 'NEEDS_REVIEW';

-- AlterTable
ALTER TABLE "SellerBusiness" ADD COLUMN "addressType" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "constitutionOfBusiness" TEXT,
ADD COLUMN "country" TEXT DEFAULT 'India',
ADD COLUMN "district" TEXT,
ADD COLUMN "gstRegistrationDate" TEXT,
ADD COLUMN "natureOfBusiness" JSONB,
ADD COLUMN "pincode" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "taxpayerType" TEXT,
ADD COLUMN "tradeName" TEXT;

-- CreateIndex
CREATE INDEX "Product_status_category_idx" ON "Product"("status", "category");

-- CreateIndex
CREATE INDEX "Product_status_sellerId_idx" ON "Product"("status", "sellerId");

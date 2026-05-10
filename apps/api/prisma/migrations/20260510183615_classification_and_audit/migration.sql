-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "documentType" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- CreateTable
CREATE TABLE "DocumentEdit" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentEdit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentEdit_documentId_createdAt_idx" ON "DocumentEdit"("documentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentEdit" ADD CONSTRAINT "DocumentEdit_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentEdit" ADD CONSTRAINT "DocumentEdit_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

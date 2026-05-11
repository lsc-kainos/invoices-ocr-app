-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'DUPLICATE';

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN "contentHash" TEXT,
ADD COLUMN "duplicateOfId" TEXT;

-- CreateIndex
CREATE INDEX "Document_userId_contentHash_idx" ON "Document"("userId", "contentHash");

-- CreateIndex
CREATE INDEX "Document_duplicateOfId_idx" ON "Document"("duplicateOfId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_userId_contentHash_original_unique"
ON "Document"("userId", "contentHash")
WHERE "contentHash" IS NOT NULL AND "status"::text <> 'DUPLICATE';

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

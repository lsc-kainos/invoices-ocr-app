-- AlterTable
ALTER TABLE "Document"
ADD COLUMN "contentHash" TEXT,
ADD COLUMN "duplicateOfId" TEXT,
ADD COLUMN "duplicateReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Document_userId_contentHash_key" ON "Document"("userId", "contentHash");

-- CreateIndex
CREATE INDEX "Document_duplicateOfId_idx" ON "Document"("duplicateOfId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

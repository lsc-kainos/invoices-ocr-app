ALTER TYPE "DocumentStatus" ADD VALUE 'DUPLICATE';

ALTER TABLE "Document"
ADD COLUMN "contentHash" TEXT,
ADD COLUMN "duplicateOfId" TEXT;

CREATE INDEX "Document_userId_contentHash_idx" ON "Document"("userId", "contentHash");
CREATE INDEX "Document_duplicateOfId_idx" ON "Document"("duplicateOfId");

CREATE UNIQUE INDEX "Document_userId_contentHash_active_unique"
ON "Document"("userId", "contentHash")
WHERE "contentHash" IS NOT NULL
  AND "status" IN ('QUEUED', 'OCR_RUNNING', 'READY', 'REJECTED');

ALTER TABLE "Document"
ADD CONSTRAINT "Document_duplicateOfId_fkey"
FOREIGN KEY ("duplicateOfId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

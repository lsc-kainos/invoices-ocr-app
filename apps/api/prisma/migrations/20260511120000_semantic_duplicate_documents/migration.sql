ALTER TYPE "DocumentStatus" ADD VALUE 'DUPLICATE';

ALTER TABLE "Document"
ADD COLUMN "semanticHash" TEXT,
ADD COLUMN "duplicateOfId" TEXT,
ADD COLUMN "duplicateReason" TEXT;

ALTER TABLE "Document"
ADD CONSTRAINT "Document_duplicateOfId_fkey"
FOREIGN KEY ("duplicateOfId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Document_userId_semanticHash_status_idx" ON "Document"("userId", "semanticHash", "status");
CREATE INDEX "Document_duplicateOfId_idx" ON "Document"("duplicateOfId");

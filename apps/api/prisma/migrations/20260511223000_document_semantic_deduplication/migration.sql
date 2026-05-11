ALTER TABLE "Document"
ADD COLUMN "semanticHash" TEXT,
ADD COLUMN "duplicateReason" TEXT;

CREATE INDEX "Document_userId_semanticHash_status_idx"
ON "Document"("userId", "semanticHash", "status");

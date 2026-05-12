ALTER TABLE "Document"
ADD COLUMN "possibleDuplicateOfId" TEXT,
ADD COLUMN "duplicateMatchStrength" TEXT;

CREATE INDEX "Document_possibleDuplicateOfId_idx"
ON "Document"("possibleDuplicateOfId");

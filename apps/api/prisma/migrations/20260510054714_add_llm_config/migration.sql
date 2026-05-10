-- CreateEnum
CREATE TYPE "LlmConfigKey" AS ENUM ('EXTRACTOR', 'CHAT');

-- CreateTable
CREATE TABLE "LlmConfig" (
    "id" TEXT NOT NULL,
    "key" "LlmConfigKey" NOT NULL,
    "version" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LlmConfig_key_active_idx" ON "LlmConfig"("key", "active");

-- CreateIndex
CREATE UNIQUE INDEX "LlmConfig_key_version_key" ON "LlmConfig"("key", "version");

-- AddForeignKey
ALTER TABLE "LlmConfig" ADD CONSTRAINT "LlmConfig_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

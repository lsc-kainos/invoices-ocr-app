-- CreateTable
CREATE TABLE "BenchmarkRun" (
    "id" TEXT NOT NULL,
    "runBy" TEXT NOT NULL,
    "llmConfigId" TEXT,
    "modelSnapshot" TEXT NOT NULL,
    "promptSnapshot" TEXT NOT NULL,
    "paramsSnapshot" JSONB NOT NULL,
    "datasetVersion" TEXT NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "aggregate" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BenchmarkRun_createdAt_idx" ON "BenchmarkRun"("createdAt");

-- CreateIndex
CREATE INDEX "BenchmarkRun_llmConfigId_createdAt_idx" ON "BenchmarkRun"("llmConfigId", "createdAt");

-- AddForeignKey
ALTER TABLE "BenchmarkRun" ADD CONSTRAINT "BenchmarkRun_runBy_fkey" FOREIGN KEY ("runBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkRun" ADD CONSTRAINT "BenchmarkRun_llmConfigId_fkey" FOREIGN KEY ("llmConfigId") REFERENCES "LlmConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

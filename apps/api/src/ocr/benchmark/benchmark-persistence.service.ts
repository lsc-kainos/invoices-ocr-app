import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  BenchmarkAggregate,
  BenchmarkRunDetailDto,
  BenchmarkRunDto,
  BenchmarkSampleResult,
} from '@invoices-ocr/shared-types';

export interface PersistInput {
  runBy: string;
  llmConfigId: string | null;
  modelSnapshot: string;
  promptSnapshot: string;
  paramsSnapshot: Record<string, unknown>;
  datasetVersion: string;
  sampleCount: number;
  aggregate: Record<string, unknown>;
  results: unknown[];
  durationMs: number;
}

const include = {
  runner: { select: { email: true } },
  llmConfig: { select: { key: true, version: true } },
} as const;

interface RunRow {
  id: string;
  modelSnapshot: string;
  promptSnapshot: string;
  paramsSnapshot: Prisma.JsonValue;
  datasetVersion: string;
  sampleCount: number;
  aggregate: Prisma.JsonValue;
  results: Prisma.JsonValue;
  durationMs: number;
  createdAt: Date;
  runner: { email: string };
  llmConfig: { key: string; version: number } | null;
}

function toDto(row: RunRow): BenchmarkRunDto {
  return {
    id: row.id,
    runByEmail: row.runner.email,
    llmConfigKey: row.llmConfig?.key ?? null,
    llmConfigVersion: row.llmConfig?.version ?? null,
    modelSnapshot: row.modelSnapshot,
    datasetVersion: row.datasetVersion,
    sampleCount: row.sampleCount,
    aggregate: row.aggregate as unknown as BenchmarkAggregate,
    durationMs: row.durationMs,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetailDto(row: RunRow): BenchmarkRunDetailDto {
  return {
    ...toDto(row),
    promptSnapshot: row.promptSnapshot,
    paramsSnapshot: row.paramsSnapshot as Record<string, unknown>,
    results: row.results as unknown as BenchmarkSampleResult[],
  };
}

@Injectable()
export class BenchmarkPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async persist(input: PersistInput): Promise<{ id: string }> {
    return this.prisma.benchmarkRun.create({
      data: {
        runBy: input.runBy,
        llmConfigId: input.llmConfigId,
        modelSnapshot: input.modelSnapshot,
        promptSnapshot: input.promptSnapshot,
        paramsSnapshot: input.paramsSnapshot as Prisma.InputJsonValue,
        datasetVersion: input.datasetVersion,
        sampleCount: input.sampleCount,
        aggregate: input.aggregate as Prisma.InputJsonValue,
        results: input.results as Prisma.InputJsonValue,
        durationMs: input.durationMs,
      },
      select: { id: true },
    });
  }

  async list(limit: number): Promise<BenchmarkRunDto[]> {
    const rows = await this.prisma.benchmarkRun.findMany({
      include,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => toDto(row as unknown as RunRow));
  }

  async findById(id: string): Promise<BenchmarkRunDetailDto | null> {
    const row = await this.prisma.benchmarkRun.findUnique({
      where: { id },
      include,
    });
    if (!row) return null;
    return toDetailDto(row);
  }
}

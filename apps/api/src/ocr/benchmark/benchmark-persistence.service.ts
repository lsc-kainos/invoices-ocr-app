import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

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
}

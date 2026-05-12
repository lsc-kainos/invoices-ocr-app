import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { LlmConfigKey } from '@prisma/client';
import { ExtractorService } from '../extractor.service';
import { LlmConfigService } from '../../ai-runtime/llm-config.service';
import { BenchmarkPersistenceService } from './benchmark-persistence.service';
import { invoiceSummarySchema } from '../schemas/invoice-summary.schema';
import { loadCsvSamples } from './csv-loader';
import {
  compareFields,
  computeScore,
  computeAggregate,
} from './field-comparator';
import type {
  ScoreResult,
  FieldResults,
  AggregateResult,
} from './field-comparator';

export type BenchmarkProgressEvent = {
  type: 'progress';
  index: number;
  total: number;
  filename: string;
  score?: ScoreResult;
  fieldResults?: FieldResults;
  narrative?: string;
  error?: string;
};

export type BenchmarkCompleteEvent = {
  type: 'complete';
  aggregate: AggregateResult;
};

export type BenchmarkPersistedEvent = { type: 'persisted'; runId: string };
export type BenchmarkErrorEvent = {
  type: 'error';
  code: string;
  message: string;
};

export type BenchmarkEvent =
  | BenchmarkProgressEvent
  | BenchmarkPersistedEvent
  | BenchmarkCompleteEvent
  | BenchmarkErrorEvent;

function classifyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.startsWith('refusal:')) return 'refusal';
    if ('code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT')
      return 'io-error';
    if (err.name === 'ZodError') return 'parse-error';
  }
  return 'unknown';
}

@Injectable()
export class BenchmarkService {
  constructor(
    private readonly extractor: ExtractorService,
    private readonly llmConfig: LlmConfigService,
    private readonly persistence: BenchmarkPersistenceService,
    private readonly config: ConfigService,
  ) {}

  async *runStream(
    samplesDir: string,
    runBy: string,
  ): AsyncGenerator<BenchmarkEvent> {
    const startTime = Date.now();
    const activeConfig = await this.llmConfig.findActive(
      LlmConfigKey.EXTRACTOR,
    );
    if (!activeConfig) {
      yield {
        type: 'error',
        code: 'no_active_extractor_config',
        message: 'No active EXTRACTOR config found',
      };
      return;
    }

    const samples = await loadCsvSamples(samplesDir);
    const total = samples.length;
    const accumulated: Array<{
      score: ScoreResult;
      fieldResults: FieldResults;
    }> = [];
    const errorCounts: Record<string, number> = {
      refusal: 0,
      'parse-error': 0,
      'io-error': 0,
      unknown: 0,
    };
    const collectedResults: Array<{
      filename: string;
      score?: number;
      error?: string;
    }> = [];

    for (let i = 0; i < total; i++) {
      const sample = samples[i];
      const imagePath = join(samplesDir, sample.filename);

      try {
        const buffer = await fs.readFile(imagePath);
        const raw = await this.extractor.extract(buffer, 'image/jpeg');
        const parsed = invoiceSummarySchema.parse(raw);
        const fieldResults = compareFields(
          parsed.summary.core,
          sample.groundTruth,
        );
        const score = computeScore(fieldResults);
        accumulated.push({ score, fieldResults });
        collectedResults.push({
          filename: sample.filename,
          score: score.score,
        });

        yield {
          type: 'progress',
          index: i + 1,
          total,
          filename: sample.filename,
          score,
          fieldResults,
          narrative: parsed.summary.narrative,
        };
      } catch (err) {
        const errKey = classifyError(err);
        const errMsg = err instanceof Error ? err.message : String(err);
        const errStack = err instanceof Error ? err.stack : '';
        // [DEBUG-benchmark] Temporary instrumentation to diagnose failures
        console.error(
          `[DEBUG-benchmark] sample=${sample.filename} errorKey=${errKey} message=${errMsg} stack=${errStack}`,
        );
        errorCounts[errKey] = (errorCounts[errKey] ?? 0) + 1;
        collectedResults.push({ filename: sample.filename, error: errKey });

        yield {
          type: 'progress',
          index: i + 1,
          total,
          filename: sample.filename,
          error: errKey,
        };
      }
    }

    const aggregate = computeAggregate(accumulated);
    const datasetVersion =
      this.config.get<string>('BENCHMARK_DATASET_VERSION') ?? 'v1';

    const run = await this.persistence.persist({
      runBy,
      llmConfigId: activeConfig.id,
      modelSnapshot: activeConfig.model,
      promptSnapshot: activeConfig.prompt,
      paramsSnapshot: activeConfig.params as Record<string, unknown>,
      datasetVersion,
      sampleCount: samples.length,
      aggregate: { ...aggregate, errorCounts },
      results: collectedResults,
      durationMs: Date.now() - startTime,
    });

    yield { type: 'persisted', runId: run.id };
    yield { type: 'complete', aggregate };
  }
}

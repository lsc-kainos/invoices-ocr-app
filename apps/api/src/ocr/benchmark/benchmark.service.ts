import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { ExtractorService } from '../extractor.service';
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

export type BenchmarkEvent = BenchmarkProgressEvent | BenchmarkCompleteEvent;

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
  constructor(private readonly extractor: ExtractorService) {}

  async *runStream(samplesDir: string): AsyncGenerator<BenchmarkEvent> {
    const samples = await loadCsvSamples(samplesDir);
    const total = samples.length;
    const accumulated: Array<{
      score: ScoreResult;
      fieldResults: FieldResults;
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
        yield {
          type: 'progress',
          index: i + 1,
          total,
          filename: sample.filename,
          error: classifyError(err),
        };
      }
    }

    yield {
      type: 'complete',
      aggregate: computeAggregate(accumulated),
    };
  }
}

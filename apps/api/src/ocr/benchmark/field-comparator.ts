import type { InvoiceCore } from '../schemas/invoice-summary.schema';
import type { BenchmarkSample } from './csv-loader';

export type FieldResult = {
  extracted: string | null;
  expected: string | null;
  match: boolean;
};

export type FieldResults = Record<string, FieldResult>;

export type ScoreResult = {
  correct: number;
  presentInGT: number;
  score: number;
};

export type FieldAggregate = {
  correct: number;
  total: number;
  accuracy: number;
};

export type AggregateResult = {
  avgScore: number;
  perField: Record<string, FieldAggregate>;
};

function normalizeDecimal(v: string): string {
  if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(v)) {
    return v.replace(/\./g, '').replace(',', '.');
  }
  if (/^-?\d+,\d{1,2}$/.test(v)) {
    return v.replace(',', '.');
  }
  return v;
}

function normalize(v: string | null): string {
  if (!v) return '';
  const stripped = v
    .toLowerCase()
    .replace(/r\$/g, '')
    .replace(/[$€£\s]/g, '');
  const decimalAware = normalizeDecimal(stripped);
  return decimalAware.replace(/,/g, '');
}

export function matchField(
  extracted: string | null,
  expected: string | null,
): boolean {
  if (expected === null || expected === '') return true;
  return normalize(extracted) === normalize(expected);
}

export function compareFields(
  extractedCore: InvoiceCore,
  groundTruth: BenchmarkSample['groundTruth'],
): FieldResults {
  const fields = Object.keys(groundTruth) as Array<keyof typeof groundTruth>;
  return Object.fromEntries(
    fields.map((field) => {
      const extracted = extractedCore[field as keyof InvoiceCore] ?? null;
      const expected = groundTruth[field];
      return [
        field,
        { extracted, expected, match: matchField(extracted, expected) },
      ];
    }),
  );
}

export function computeScore(fieldResults: FieldResults): ScoreResult {
  const entries = Object.values(fieldResults);
  const inGT = entries.filter((r) => r.expected !== null && r.expected !== '');
  const presentInGT = inGT.length;
  const correct = inGT.filter((r) => r.match).length;
  return {
    correct,
    presentInGT,
    score: presentInGT === 0 ? 1 : correct / presentInGT,
  };
}

export function computeAggregate(
  allScores: Array<{ score: ScoreResult; fieldResults: FieldResults }>,
): AggregateResult {
  if (allScores.length === 0) return { avgScore: 0, perField: {} };

  const avgScore =
    allScores.reduce((sum, { score }) => sum + score.score, 0) /
    allScores.length;

  const perField: Record<string, FieldAggregate> = {};
  for (const { fieldResults } of allScores) {
    for (const [field, result] of Object.entries(fieldResults)) {
      if (!perField[field])
        perField[field] = { correct: 0, total: 0, accuracy: 0 };
      if (result.expected !== null && result.expected !== '') {
        perField[field].total++;
        if (result.match) perField[field].correct++;
      }
    }
  }

  for (const agg of Object.values(perField)) {
    agg.accuracy = agg.total === 0 ? 1 : agg.correct / agg.total;
  }

  return { avgScore, perField };
}

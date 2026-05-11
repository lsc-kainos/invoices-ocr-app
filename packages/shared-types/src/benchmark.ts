export interface BenchmarkErrorCounts {
  refusal: number;
  parse_error: number;
  io_error: number;
  unknown: number;
}

export interface BenchmarkFieldAggregate {
  correct: number;
  total: number;
  accuracy: number;
}

export interface BenchmarkAggregate {
  avgScore: number;
  passedCount: number;
  failedCount: number;
  perField: Record<string, BenchmarkFieldAggregate>;
  errorCounts: BenchmarkErrorCounts;
}

export interface BenchmarkSampleResult {
  filename: string;
  score?: number;
  error?: string;
}

export interface BenchmarkRunDto {
  id: string;
  runByEmail: string;
  llmConfigKey: string | null;
  llmConfigVersion: number | null;
  modelSnapshot: string;
  datasetVersion: string;
  sampleCount: number;
  aggregate: BenchmarkAggregate;
  durationMs: number;
  createdAt: string;
}

export interface BenchmarkRunDetailDto extends BenchmarkRunDto {
  promptSnapshot: string;
  paramsSnapshot: Record<string, unknown>;
  results: BenchmarkSampleResult[];
}

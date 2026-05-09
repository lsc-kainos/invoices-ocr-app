'use client';
import { useBenchmark } from './use-benchmark';
import { BenchmarkTable } from './benchmark-table';
import { BenchmarkAggregate } from './benchmark-aggregate';

export function BenchmarkRunner() {
  const { run, running, progress, results, aggregate, error } = useBenchmark();

  const showProgress = running || progress.current > 0;
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">OCR Benchmark</h1>
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run Benchmark'}
        </button>
      </div>

      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
          {error}
        </div>
      )}

      {showProgress && (
        <div className="flex flex-col gap-1">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              {progress.current} / {progress.total}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded">
            <div className="bg-primary h-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <BenchmarkAggregate aggregate={aggregate} />
      <BenchmarkTable results={results} />
    </div>
  );
}

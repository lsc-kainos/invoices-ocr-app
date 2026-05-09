'use client';
import type { Aggregate } from './use-benchmark';

export function BenchmarkAggregate({ aggregate }: { aggregate: Aggregate | null }) {
  if (!aggregate) return null;

  const overall = Math.round(aggregate.avgScore * 100);
  const fields = Object.entries(aggregate.perField);

  return (
    <div className="bg-card flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-semibold tabular-nums">{overall}%</span>
        <span className="text-muted-foreground text-sm">average score</span>
      </div>

      {fields.length > 0 && (
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-left text-xs">
            <tr>
              <th className="py-1">Field</th>
              <th className="py-1">Correct / Total</th>
              <th className="py-1">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(([k, v]) => (
              <tr key={k} className="border-t">
                <td className="py-1 pr-2 font-mono">{k}</td>
                <td className="py-1 pr-2 tabular-nums">
                  {v.correct} / {v.total}
                </td>
                <td className="py-1 tabular-nums">{Math.round(v.accuracy * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

'use client';
import type { BenchmarkRunDto } from '@invoices-ocr/shared-types';

interface RunHistoryTableProps {
  runs: BenchmarkRunDto[];
  highlightRunId: string | null;
  onSelect: (id: string) => void;
}

export function RunHistoryTable({ runs, highlightRunId, onSelect }: RunHistoryTableProps) {
  if (runs.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum run encontrado</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
          <tr>
            <th className="px-3 py-2">Data/Hora</th>
            <th className="px-3 py-2">Modelo</th>
            <th className="px-3 py-2">Score</th>
            <th className="px-3 py-2">Amostras</th>
            <th className="px-3 py-2">Duração</th>
            <th className="px-3 py-2">Ação</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr
              key={run.id}
              className={`border-t transition-colors ${
                run.id === highlightRunId ? 'bg-primary/10' : 'hover:bg-muted/30'
              }`}
            >
              <td className="px-3 py-2 tabular-nums">
                {new Date(run.createdAt).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
              <td className="px-3 py-2 font-mono text-xs">{run.modelSnapshot}</td>
              <td className="px-3 py-2 tabular-nums">
                {Math.round(run.aggregate.avgScore * 100)}%
              </td>
              <td className="px-3 py-2 tabular-nums">{run.sampleCount}</td>
              <td className="px-3 py-2 tabular-nums">{run.durationMs}ms</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onSelect(run.id)}
                  className="text-primary hover:underline"
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

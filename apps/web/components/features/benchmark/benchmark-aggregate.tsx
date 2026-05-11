'use client';
import { useTranslations } from 'next-intl';
import type { Aggregate } from './use-benchmark';

/**
 * Aggregate metrics — refined editorial dark.
 *
 * - Card destacado com border-l-2 cobre + serif italic light no score.
 * - Tabela de campos com header sutil bg-muted/40 e mono em valores numéricos.
 */
export function BenchmarkAggregate({ aggregate }: { aggregate: Aggregate | null }) {
  const t = useTranslations('benchmark');
  if (!aggregate) return null;

  const overall = Math.round(aggregate.avgScore * 100);
  const fields = Object.entries(aggregate.perField);
  const lowScore = overall < 50;

  return (
    <section
      className="border-border bg-card border-l-primary flex flex-col gap-5 rounded-lg border border-l-2 p-5 shadow-sm sm:p-6"
      data-testid="benchmark-aggregate"
    >
      <div className="flex flex-col gap-1.5">
        <span className="eyebrow">{t('runner.averageScore')}</span>
        <span
          className={`font-serif-italic text-[44px] leading-none font-light tracking-tight tabular-nums sm:text-[56px] ${
            lowScore ? 'text-destructive' : 'text-primary'
          }`}
          data-testid="benchmark-aggregate-score"
        >
          {overall}%
        </span>
      </div>

      {fields.length > 0 && (
        <div className="border-border bg-card overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
              <tr>
                <th className="px-3 py-2 font-medium">{t('runner.field')}</th>
                <th className="px-3 py-2 font-medium">{t('runner.correctTotal')}</th>
                <th className="px-3 py-2 font-medium">{t('runner.accuracy')}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(([k, v]) => (
                <tr
                  key={k}
                  className="border-border/60 hover:bg-muted/40 border-t transition-colors duration-150 ease-out"
                >
                  <td className="px-3 py-2 font-mono text-xs">{k}</td>
                  <td className="px-3 py-2 font-mono text-xs tabular-nums">
                    {v.correct} / {v.total}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs tabular-nums">
                    {Math.round(v.accuracy * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

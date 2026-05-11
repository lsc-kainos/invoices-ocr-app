'use client';
import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckIcon, XIcon, ChevronRightIcon } from 'lucide-react';
import type { ImageResult } from './use-benchmark';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Per-sample results table — refined editorial dark.
 *
 * - Header bg-muted/40, linhas border-b sutis, hover bg-muted/40.
 * - Filename em mono (dado técnico), scores em mono tabular-nums.
 * - Status pass/fail em Badge destructive sutil quando falha, ✓ verde quando passa.
 */
export function BenchmarkTable({ results }: { results: ImageResult[] }) {
  const t = useTranslations('benchmark');
  const [expanded, setExpanded] = useState<number | null>(null);

  if (results.length === 0) {
    return (
      <section className="border-border bg-card flex flex-col gap-2 rounded-lg border p-5 shadow-sm sm:p-6">
        <span className="eyebrow">{t('runner.results')}</span>
        <p className="text-muted-foreground text-sm">{t('runner.noResults')}</p>
      </section>
    );
  }

  return (
    <section
      className="border-border bg-card flex flex-col gap-3 rounded-lg border p-5 shadow-sm sm:p-6"
      data-testid="benchmark-results"
    >
      <span className="eyebrow">{t('runner.results')}</span>
      <div className="border-border overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
            <tr>
              <th className="w-12 px-3 py-2 font-medium">{t('runner.columnIndex')}</th>
              <th className="px-3 py-2 font-medium">{t('runner.columnFile')}</th>
              <th className="w-28 px-3 py-2 font-medium">{t('runner.columnScore')}</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const isOpen = expanded === r.index;
              const pct = r.score ? Math.round(r.score.score * 100) : null;
              return (
                <Fragment key={r.index}>
                  <tr
                    className={cn(
                      'border-border/60 hover:bg-muted/40 cursor-pointer border-t transition-colors duration-150 ease-out',
                      isOpen && 'bg-muted/40',
                    )}
                    onClick={() => setExpanded(isOpen ? null : r.index)}
                    data-testid={`benchmark-row-${r.index}`}
                  >
                    <td className="text-muted-foreground px-3 py-2 font-mono text-xs tabular-nums">
                      {r.index}
                    </td>
                    <td className="text-foreground px-3 py-2 font-mono text-xs break-all">
                      {r.filename}
                    </td>
                    <td className="px-3 py-2">
                      {r.error ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px] tracking-wide uppercase"
                        >
                          {t('runner.errorStatus')}
                        </Badge>
                      ) : pct !== null ? (
                        <span className="text-foreground font-mono text-sm font-medium tabular-nums">
                          {pct}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right">
                      <ChevronRightIcon
                        className={cn(
                          'inline size-4 transition-transform duration-150 ease-out',
                          isOpen && 'rotate-90',
                        )}
                      />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-muted/20 border-border/60 border-t">
                      <td colSpan={4} className="px-3 py-4 sm:px-4">
                        {r.error ? (
                          <pre className="text-destructive bg-destructive/5 max-h-[200px] overflow-y-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap">
                            {r.error}
                          </pre>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {r.fieldResults && (
                              <div className="border-border overflow-hidden rounded-md border">
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/40 text-muted-foreground text-left">
                                    <tr>
                                      <th className="px-3 py-1.5 font-medium">
                                        {t('runner.field')}
                                      </th>
                                      <th className="px-3 py-1.5 font-medium">
                                        {t('runner.expected')}
                                      </th>
                                      <th className="px-3 py-1.5 font-medium">
                                        {t('runner.extracted')}
                                      </th>
                                      <th className="w-8 px-3 py-1.5" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(r.fieldResults).map(([k, v]) => (
                                      <tr key={k} className="border-border/60 border-t">
                                        <td className="px-3 py-1.5 font-mono">{k}</td>
                                        <td className="text-muted-foreground px-3 py-1.5 font-mono">
                                          {v.expected ?? '—'}
                                        </td>
                                        <td className="text-foreground px-3 py-1.5 font-mono">
                                          {v.extracted ?? '—'}
                                        </td>
                                        <td className="px-3 py-1.5">
                                          {v.match ? (
                                            <CheckIcon
                                              className="size-3.5 text-green-600 dark:text-green-400"
                                              aria-label="match"
                                            />
                                          ) : (
                                            <XIcon
                                              className="text-destructive size-3.5"
                                              aria-label="no match"
                                            />
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {r.narrative && (
                              <div className="bg-muted/40 text-muted-foreground rounded-md p-3 text-xs leading-relaxed">
                                {r.narrative}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

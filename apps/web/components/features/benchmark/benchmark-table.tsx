'use client';
import { Fragment, useState } from 'react';
import type { ImageResult } from './use-benchmark';

export function BenchmarkTable({ results }: { results: ImageResult[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (results.length === 0) return null;

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b text-left">
          <tr>
            <th className="w-12 px-3 py-2">#</th>
            <th className="px-3 py-2">File</th>
            <th className="w-24 px-3 py-2">Score</th>
            <th className="w-12 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const isOpen = expanded === r.index;
            const pct = r.score ? Math.round(r.score.score * 100) : null;
            return (
              <Fragment key={r.index}>
                <tr
                  className="hover:bg-muted/30 cursor-pointer border-b"
                  onClick={() => setExpanded(isOpen ? null : r.index)}
                >
                  <td className="text-muted-foreground px-3 py-2">{r.index}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.filename}</td>
                  <td className="px-3 py-2">
                    {r.error ? (
                      <span className="bg-destructive/15 text-destructive rounded px-2 py-0.5 text-xs">
                        error
                      </span>
                    ) : pct !== null ? (
                      <span className="font-medium">{pct}%</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-muted-foreground px-3 py-2">{isOpen ? '▾' : '▸'}</td>
                </tr>
                {isOpen && (
                  <tr className="bg-muted/20 border-b">
                    <td colSpan={4} className="px-3 py-3">
                      {r.error ? (
                        <pre className="text-destructive text-xs whitespace-pre-wrap">
                          {r.error}
                        </pre>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {r.fieldResults && (
                            <table className="w-full text-xs">
                              <thead className="text-muted-foreground text-left">
                                <tr>
                                  <th className="py-1">Field</th>
                                  <th className="py-1">Expected</th>
                                  <th className="py-1">Extracted</th>
                                  <th className="w-8 py-1"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(r.fieldResults).map(([k, v]) => (
                                  <tr key={k} className="border-t">
                                    <td className="py-1 pr-2 font-mono">{k}</td>
                                    <td className="text-muted-foreground py-1 pr-2 font-mono">
                                      {v.expected ?? '—'}
                                    </td>
                                    <td className="py-1 pr-2 font-mono">{v.extracted ?? '—'}</td>
                                    <td className="py-1">
                                      {v.match ? (
                                        <span className="text-green-600">✓</span>
                                      ) : (
                                        <span className="text-destructive">✗</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {r.narrative && (
                            <div className="bg-background/60 text-muted-foreground rounded p-2 text-xs">
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
  );
}

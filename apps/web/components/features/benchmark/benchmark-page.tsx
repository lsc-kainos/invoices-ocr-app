'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BenchmarkRunner } from './benchmark-runner';
import { RunHistoryTab } from './run-history-tab';
import { cn } from '@/lib/utils';

type TabKey = 'run' | 'history';

/**
 * /admin/benchmark — refined editorial dark.
 *
 * Layout: header (eyebrow + título + subtítulo) + tabs underline cobre +
 * conteúdo. Estética alinhada com /admin/llm-configs (PR #53).
 */
export function BenchmarkPage() {
  const t = useTranslations('benchmark');
  const [activeTab, setActiveTab] = useState<TabKey>('run');
  const [highlightRunId, setHighlightRunId] = useState<string | null>(null);

  const handleViewHistory = (runId: string) => {
    setHighlightRunId(runId);
    setActiveTab('history');
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab !== 'history') setHighlightRunId(null);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'run', label: t('tabs.run') },
    { key: 'history', label: t('tabs.history') },
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10">
      {/* Header */}
      <header
        className="animate-config-reveal flex flex-col gap-2"
        style={{ animationDelay: '0ms' }}
      >
        <span className="eyebrow">{t('eyebrow')}</span>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">{t('subtitle')}</p>
      </header>

      {/* Tabs — refined underline */}
      <nav
        className="animate-config-reveal border-border/40 -mx-1 flex flex-wrap gap-1 border-b"
        style={{ animationDelay: '60ms' }}
        role="tablist"
        aria-label={t('title')}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`benchmark-tab-${tab.key}`}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors duration-200 ease-out',
                isActive
                  ? 'text-foreground border-primary border-b-2'
                  : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'run' ? (
          <BenchmarkRunner onViewHistory={handleViewHistory} />
        ) : (
          <RunHistoryTab highlightRunId={highlightRunId} />
        )}
      </div>
    </main>
  );
}

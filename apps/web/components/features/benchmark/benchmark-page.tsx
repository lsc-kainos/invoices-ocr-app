'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BenchmarkRunner } from './benchmark-runner';
import { RunHistoryTab } from './run-history-tab';

export function BenchmarkPage() {
  const t = useTranslations('benchmark');
  const [activeTab, setActiveTab] = useState<'run' | 'history'>('run');
  const [highlightRunId, setHighlightRunId] = useState<string | null>(null);

  const handleViewHistory = (runId: string) => {
    setHighlightRunId(runId);
    setActiveTab('history');
  };

  const handleTabChange = (value: string) => {
    const tab = value as 'run' | 'history';
    setActiveTab(tab);
    if (tab !== 'history') {
      setHighlightRunId(null);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="border-b px-6 pt-4">
        <TabsList>
          <TabsTrigger value="run">{t('tabs.run')}</TabsTrigger>
          <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="run">
        <BenchmarkRunner onViewHistory={handleViewHistory} />
      </TabsContent>

      <TabsContent value="history">
        <RunHistoryTab highlightRunId={highlightRunId} />
      </TabsContent>
    </Tabs>
  );
}

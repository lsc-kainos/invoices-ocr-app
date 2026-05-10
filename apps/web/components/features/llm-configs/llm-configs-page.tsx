'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLlmConfigs } from './use-llm-configs';
import { ConfigVersionList } from './config-version-list';
import { ConfigEditorDrawer } from './config-editor-drawer';
import { ConfigTestDrawer } from './config-test-drawer';
import { Button } from '@/components/ui/button';

export function LlmConfigsPage() {
  const t = useTranslations('admin.llmConfigs');
  const { configs, models, create, activate, test, reloadCache } = useLlmConfigs();
  const [editorOpen, setEditorOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  return (
    <main className="container mx-auto py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void reloadCache()}>
            {t('reloadCache')}
          </Button>
          <Button onClick={() => setEditorOpen(true)}>{t('newVersion')}</Button>
        </div>
      </header>

      <ConfigVersionList
        configs={configs}
        onActivate={(id) => void activate(id)}
        onTest={setTestingId}
      />

      <ConfigEditorDrawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        models={models}
        onSubmit={create}
      />

      <ConfigTestDrawer configId={testingId} onClose={() => setTestingId(null)} onTest={test} />
    </main>
  );
}

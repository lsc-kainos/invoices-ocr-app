'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { LlmConfigDto, LlmConfigKey } from '@invoices-ocr/shared-types';
import { useLlmConfigs } from './use-llm-configs';
import { ActiveConfigCard } from './active-config-card';
import { ConfigHistoryList } from './config-history-list';
import { ConfigEditorDrawer, type EditorMode } from './config-editor-drawer';
import { ConfigTestDrawer } from './config-test-drawer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const KEYS: LlmConfigKey[] = ['EXTRACTOR', 'CHAT'];

export function LlmConfigsPage() {
  const t = useTranslations('admin.llmConfigs');
  const { byKey, active, models, isLoading, create, activate, test } = useLlmConfigs();

  const [activeTab, setActiveTab] = useState<LlmConfigKey>('EXTRACTOR');
  const [editorMode, setEditorMode] = useState<EditorMode>({ kind: 'closed' });
  const [testingId, setTestingId] = useState<string | null>(null);

  const history = useMemo(
    () => ({
      EXTRACTOR: byKey.EXTRACTOR.filter((c) => !c.active),
      CHAT: byKey.CHAT.filter((c) => !c.active),
    }),
    [byKey],
  );

  async function handleCreate(input: Parameters<typeof create>[0]) {
    try {
      const created = await create(input);
      toast.success(t('toast.created', { n: created.version }));
      // Switch tab to the just-created config's key so the user immediately
      // sees their new version land in the list (fix for "list not refreshing"
      // when the new row was on a different tab).
      setActiveTab(created.key);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      throw err;
    }
  }

  async function handleActivate(cfg: LlmConfigDto) {
    try {
      await activate(cfg.id);
      toast.success(t('toast.activated', { n: cfg.version }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <main className="container mx-auto py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LlmConfigKey)}>
        <TabsList>
          {KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {key}
            </TabsTrigger>
          ))}
        </TabsList>

        {KEYS.map((key) => (
          <TabsContent key={key} value={key} className="flex flex-col gap-8">
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <ActiveConfigCard
                  config={active[key]}
                  configKey={key}
                  onCloneFromActive={(cfg) => setEditorMode({ kind: 'clone', baseConfig: cfg })}
                  onTest={(cfg) => setTestingId(cfg.id)}
                  onCreateFirst={(k) => setEditorMode({ kind: 'create-blank', targetKey: k })}
                />

                <section className="flex flex-col gap-3">
                  <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                    {t('history.title')}
                  </h2>
                  <ConfigHistoryList
                    rows={history[key]}
                    onView={(cfg) => setEditorMode({ kind: 'view', baseConfig: cfg })}
                    onActivate={(cfg) => void handleActivate(cfg)}
                    onTest={(cfg) => setTestingId(cfg.id)}
                  />
                </section>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ConfigEditorDrawer
        mode={editorMode}
        onClose={() => setEditorMode({ kind: 'closed' })}
        models={models}
        onSubmit={handleCreate}
      />

      <ConfigTestDrawer configId={testingId} onClose={() => setTestingId(null)} onTest={test} />
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8" data-testid="llm-configs-skeleton">
      <Skeleton className="h-[120px] w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

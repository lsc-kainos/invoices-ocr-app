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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const KEYS: LlmConfigKey[] = ['EXTRACTOR', 'CHAT'];

/**
 * /admin/llm-configs — refined editorial dark.
 *
 * Layout aprovado (PR #51) preservado: header, tabs EXTRACTOR/CHAT,
 * active card no topo, histórico abaixo, editor/test em modal.
 * Estética alinhada com o resto da app (document-detail/documents-list).
 */
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

      {/* Tabs — refined pill-style */}
      <nav
        className="animate-config-reveal border-border/40 -mx-1 flex flex-wrap gap-1 border-b"
        style={{ animationDelay: '60ms' }}
        role="tablist"
        aria-label={t('title')}
      >
        {KEYS.map((key) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`tab-${key}`}
              onClick={() => setActiveTab(key)}
              className={cn(
                'relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors duration-200 ease-out',
                isActive
                  ? 'text-foreground border-primary border-b-2'
                  : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent',
              )}
            >
              {key === 'EXTRACTOR' ? 'Extractor' : 'Chat'}
            </button>
          );
        })}
      </nav>

      {/* Active content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div role="tabpanel" className="flex flex-col gap-10">
          <ActiveConfigCard
            config={active[activeTab]}
            configKey={activeTab}
            onCloneFromActive={(cfg) => setEditorMode({ kind: 'clone', baseConfig: cfg })}
            onTest={(cfg) => setTestingId(cfg.id)}
            onCreateFirst={(k) => setEditorMode({ kind: 'create-blank', targetKey: k })}
          />

          <section
            className="animate-config-reveal flex flex-col gap-3"
            style={{ animationDelay: '180ms' }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-foreground text-sm font-medium tracking-tight">
                {t('history.title')}
              </h2>
            </div>
            <ConfigHistoryList
              rows={history[activeTab]}
              onView={(cfg) => setEditorMode({ kind: 'view', baseConfig: cfg })}
              onActivate={(cfg) => void handleActivate(cfg)}
              onTest={(cfg) => setTestingId(cfg.id)}
            />
          </section>
        </div>
      )}

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
    <div className="flex flex-col gap-10" data-testid="llm-configs-skeleton">
      <Skeleton className="h-[320px] w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
}

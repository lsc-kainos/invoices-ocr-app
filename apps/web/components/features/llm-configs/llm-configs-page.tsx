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
 * Brutalist /admin/llm-configs.
 *
 * Stagger reveal via inline animationDelay (não usa CSS @media nem hooks).
 * Tabs como brutalist buttons — não shadcn Tabs (que tem ring/rounded built-in).
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
    <main className="container mx-auto px-4 py-12 sm:py-16">
      {/* Header — eyebrow + manchete em mono. */}
      <header
        className="animate-brutal-reveal mb-12 flex flex-col gap-3"
        style={{ animationDelay: '0ms' }}
      >
        <span className="text-muted-foreground font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
          {t('eyebrow')}
        </span>
        <h1 className="text-foreground font-mono text-3xl font-bold tracking-tight uppercase sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground max-w-2xl font-mono text-xs tracking-wider uppercase">
          {t('subtitle')}
        </p>
        <div aria-hidden className="brutal-rule mt-4" />
      </header>

      {/* Tabs como brutalist buttons */}
      <nav
        className="animate-brutal-reveal mb-8 flex flex-wrap gap-3"
        style={{ animationDelay: '80ms' }}
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
                'border-foreground rounded-none border-2 px-5 py-2 font-mono text-xs font-semibold tracking-[0.14em] uppercase transition-none',
                isActive
                  ? 'bg-foreground text-background shadow-brutal-primary'
                  : 'bg-background text-foreground shadow-brutal',
              )}
            >
              [ {key} ]
            </button>
          );
        })}
      </nav>

      {/* Active content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div role="tabpanel" className="flex flex-col gap-12">
          <ActiveConfigCard
            config={active[activeTab]}
            configKey={activeTab}
            onCloneFromActive={(cfg) => setEditorMode({ kind: 'clone', baseConfig: cfg })}
            onTest={(cfg) => setTestingId(cfg.id)}
            onCreateFirst={(k) => setEditorMode({ kind: 'create-blank', targetKey: k })}
          />

          <section
            className="animate-brutal-reveal flex flex-col gap-4"
            style={{ animationDelay: '240ms' }}
          >
            <div className="flex items-baseline gap-4">
              <h2 className="text-foreground font-mono text-sm font-semibold tracking-[0.14em] uppercase">
                {t('history.title')}
              </h2>
              <span aria-hidden className="brutal-double-rule flex-1" />
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
    <div className="flex flex-col gap-12" data-testid="llm-configs-skeleton">
      <Skeleton className="border-foreground h-[320px] w-full rounded-none border-2" />
      <div className="flex flex-col gap-3">
        <Skeleton className="border-foreground h-16 w-full rounded-none border-2" />
        <Skeleton className="border-foreground h-16 w-full rounded-none border-2" />
        <Skeleton className="border-foreground h-16 w-full rounded-none border-2" />
      </div>
    </div>
  );
}

'use client';
import { useTranslations } from 'next-intl';
import type { LlmConfigDto, LlmConfigKey } from '@invoices-ocr/shared-types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConfigVersionListProps {
  configs: LlmConfigDto[];
  onActivate: (id: string) => void;
  onTest: (id: string) => void;
}

const KEYS: LlmConfigKey[] = ['EXTRACTOR', 'CHAT'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function ConfigVersionList({ configs, onActivate, onTest }: ConfigVersionListProps) {
  const t = useTranslations('admin.llmConfigs');

  return (
    <Tabs defaultValue="EXTRACTOR">
      <TabsList>
        {KEYS.map((key) => (
          <TabsTrigger key={key} value={key}>
            {key}
          </TabsTrigger>
        ))}
      </TabsList>

      {KEYS.map((key) => {
        const rows = configs.filter((c) => c.key === key);
        return (
          <TabsContent key={key} value={key}>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-left">
                  <tr>
                    <th className="w-16 px-3 py-2">{t('table.version')}</th>
                    <th className="px-3 py-2">{t('table.model')}</th>
                    <th className="w-36 px-3 py-2">{t('table.createdAt')}</th>
                    <th className="w-20 px-3 py-2">{t('table.active')}</th>
                    <th className="w-36 px-3 py-2">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-muted-foreground px-3 py-6 text-center text-sm"
                      >
                        —
                      </td>
                    </tr>
                  ) : (
                    rows.map((cfg) => (
                      <tr key={cfg.id} className="border-b last:border-0">
                        <td className="text-muted-foreground px-3 py-2">v{cfg.version}</td>
                        <td className="px-3 py-2 font-mono text-xs">{cfg.model}</td>
                        <td className="text-muted-foreground px-3 py-2 text-xs">
                          {formatDate(cfg.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          {cfg.active ? (
                            <Badge variant="default">{t('table.active')}</Badge>
                          ) : (
                            <Badge variant="outline">—</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            {!cfg.active && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => onActivate(cfg.id)}
                              >
                                {t('actions.activate')}
                              </Button>
                            )}
                            <Button size="xs" variant="ghost" onClick={() => onTest(cfg.id)}>
                              {t('actions.test')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

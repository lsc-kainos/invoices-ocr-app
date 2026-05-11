'use client';

import { useTranslations } from 'next-intl';
import { Activity, RefreshCw, Wifi } from 'lucide-react';
import {
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import { useUsage } from './use-usage';
import type { DocumentMetrics, QueueMetrics, DailyPoint } from '@invoices-ocr/shared-types';

// Status colour tokens mapped to OKLCH palette
const STATUS_COLORS: Record<string, string> = {
  READY: 'var(--color-success)',
  FAILED: 'var(--color-destructive)',
  REJECTED: 'var(--color-warning)',
  DUPLICATE: 'var(--color-muted-foreground)',
  QUEUED: 'var(--color-muted-foreground)',
  OCR_RUNNING: 'var(--color-primary)',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="border-border/60 bg-card flex flex-col gap-1 p-4">
      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground text-2xl font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-muted-foreground text-[11px]">{sub}</span>}
    </Card>
  );
}

function StatusDonut({ byStatus }: { byStatus: DocumentMetrics['byStatus'] }) {
  const t = useTranslations('admin.usage.status');
  const data = (Object.entries(byStatus) as [keyof typeof byStatus, number][])
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: t(k), value: v, key: k }));

  if (data.length === 0)
    return <div className="text-muted-foreground text-[12px]">{t('title')}: —</div>;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={44}
            outerRadius={70}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? 'var(--color-muted)'} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col gap-1.5">
        {data.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2 text-[12px]">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: STATUS_COLORS[entry.key] ?? 'var(--color-muted)' }}
            />
            <span className="text-foreground/80">{entry.name}</span>
            <span className="text-muted-foreground ml-auto tabular-nums">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QueueGrid({ queue }: { queue: QueueMetrics }) {
  const t = useTranslations('admin.usage.queue');
  const tiles = [
    { key: 'waiting', value: queue.waiting, color: 'text-muted-foreground' },
    { key: 'active', value: queue.active, color: 'text-primary' },
    { key: 'completed', value: queue.completed, color: 'text-success' },
    { key: 'failed', value: queue.failed, color: 'text-destructive' },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map(({ key, value, color }) => (
        <div
          key={key}
          className="border-border/60 bg-muted/20 flex flex-col gap-0.5 rounded-lg border p-3"
        >
          <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t(key)}
          </span>
          <span className={cn('text-xl font-semibold tabular-nums', color)}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function UploadsChart({ timeSeries }: { timeSeries: DailyPoint[] }) {
  const t = useTranslations('admin.usage.timeSeries');
  const data = timeSeries.map((p) => ({
    date: p.date.slice(5), // MM-DD
    uploads: p.count,
    successful: p.successCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="gradUploads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-popover)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '11px',
            color: 'var(--color-popover-foreground)',
          }}
          labelStyle={{ color: 'var(--color-muted-foreground)' }}
        />
        <Area
          type="monotone"
          dataKey="uploads"
          name={t('uploads')}
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          fill="url(#gradUploads)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="successful"
          name={t('successful')}
          stroke="var(--color-success)"
          strokeWidth={1.5}
          fill="url(#gradSuccess)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SectionCard({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        {badge}
      </div>
      {children}
    </Card>
  );
}

export function UsagePage() {
  const t = useTranslations('admin.usage');
  const tStats = useTranslations('admin.usage.stats');
  const { data, isLoading, error, lastRefreshed, refresh } = useUsage();

  const avgOcr =
    data?.documents.avgOcrDurationMs != null
      ? `${Math.round(data.documents.avgOcrDurationMs)}${tStats('avgOcrDurationUnit')}`
      : tStats('noData');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="eyebrow mb-1">{t('eyebrow')}</p>
            <h1 className="text-lg font-semibold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="h-8 gap-1.5 text-[12px]"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            {t('refresh')}
          </Button>
          {lastRefreshed && (
            <span className="text-muted-foreground text-[11px]">
              {t('lastRefreshed', {
                time: lastRefreshed.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })}
            </span>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <EmptyState
          title={t('error.title')}
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={refresh}>
              {t('error.retry')}
            </Button>
          }
        />
      )}

      {/* Skeleton loading */}
      {isLoading && !data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {/* Content */}
      {data && (
        <div className="flex flex-col gap-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label={tStats('totalDocuments')} value={data.documents.total} />
            <StatCard
              label={tStats('totalUsers')}
              value={data.users.total}
              sub={`+${data.users.new30d} este mês`}
            />
            <StatCard label={tStats('activeUsers30d')} value={data.users.new30d} />
            <StatCard label={tStats('totalMessages')} value={data.chat.totalMessages} />
            <StatCard label={tStats('avgOcrDuration')} value={avgOcr} />
          </div>

          {/* Document status + queue side by side on wider screens */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={t('status.title')}>
              <StatusDonut byStatus={data.documents.byStatus} />
            </SectionCard>

            <SectionCard
              title={t('queue.title')}
              badge={
                <span className="bg-success/15 text-success flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                  <Wifi size={9} />
                  {t('queue.liveLabel')}
                </span>
              }
            >
              <QueueGrid queue={data.queue} />
            </SectionCard>
          </div>

          {/* Time series */}
          <SectionCard title={t('timeSeries.title')}>
            <UploadsChart timeSeries={data.timeSeries} />
          </SectionCard>
        </div>
      )}
    </div>
  );
}

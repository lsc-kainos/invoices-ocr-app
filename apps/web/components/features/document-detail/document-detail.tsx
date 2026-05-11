'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChevronLeft, FileText, ReceiptText, Sparkles } from 'lucide-react';
import { DownloadButton } from '@/components/features/document-download/download-button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card } from '@/components/ui/card';
import type { DocumentDetail } from '@invoices-ocr/shared-types';
import { useDocumentDetail } from './use-document-detail';
import { useDocumentEdit } from './use-document-edit';
import { DocumentViewer } from './document-viewer';
import { ExtractedFieldsRail } from './extracted-fields-rail';
import { TabsPane } from './tabs-pane';
import { VerifiedBadge } from './verified-badge';

interface DocumentDetailProps {
  initialDoc: DocumentDetail;
}

export function DocumentDetailView({ initialDoc }: DocumentDetailProps) {
  const t = useTranslations('document');
  const tUpload = useTranslations('upload');
  const router = useRouter();
  const polledDoc = useDocumentDetail(initialDoc);
  const [savedDoc, setSavedDoc] = useState<DocumentDetail | null>(null);
  const doc = savedDoc ?? polledDoc;

  const {
    isEditing,
    draft,
    isSaving,
    saveError,
    startEdit,
    cancelEdit,
    saveSummary,
    updateField,
    updateNarrative,
    updateItem,
    addItem,
    removeItem,
  } = useDocumentEdit(doc, setSavedDoc);

  const canEdit = doc.status === 'READY';
  const razao = doc.summary?.core.sellerName ?? null;
  const valor = doc.summary?.core.total ?? null;
  const data = doc.summary?.core.invoiceDate ?? null;
  const invoiceNumber = doc.summary?.core.invoiceNumber ?? null;

  const handleLoadError = useCallback(() => {
    if (doc.status === 'READY') {
      router.refresh();
    }
  }, [doc.status, router]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{tUpload('breadcrumb.home')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/documents">{t('breadcrumb.list')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[200px] truncate sm:max-w-[260px]">
              {doc.filename}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="border-border/60 bg-card rounded-xl border p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <Link
              href="/documents"
              aria-label={t('header.back')}
              className="border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors"
            >
              <ChevronLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={doc.status} />
                {doc.verifiedAt && <VerifiedBadge verifiedAt={doc.verifiedAt} />}
              </div>
              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                {doc.filename}
              </h1>
              <p className="text-muted-foreground mt-1 truncate text-sm">
                {[razao, valor, data].filter(Boolean).join(' · ') || t('detail.emptySummary')}
              </p>
            </div>
          </div>

          <DownloadButton
            documentId={doc.id}
            filename={doc.filename}
            status={doc.status}
            variant="default"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { Icon: ReceiptText, label: t('detail.total'), value: valor ?? '—' },
            { Icon: CalendarDays, label: t('detail.issueDate'), value: data ?? '—' },
            { Icon: FileText, label: t('detail.invoiceNumber'), value: invoiceNumber ?? '—' },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="border-border/60 bg-muted/20 rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                <Icon size={13} className="text-primary/70" />
                {label}
              </div>
              <div className="text-foreground mt-1 truncate text-sm font-semibold tabular-nums">
                {value}
              </div>
            </div>
          ))}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="border-border/50 bg-card/70 gap-0 overflow-hidden p-0 shadow-xl shadow-black/10">
            <div className="border-border/50 bg-muted/20 flex items-center gap-2 border-b px-4 py-3">
              <Sparkles size={14} className="text-primary/70" />
              <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t('detail.preview')}
              </span>
            </div>
            <div className="bg-muted/30 aspect-[3/4] w-full overflow-hidden lg:aspect-auto lg:h-[50vh]">
              <DocumentViewer
                documentId={doc.id}
                mime={doc.mime}
                src={doc.fileUrl}
                filename={doc.filename}
                onLoadError={handleLoadError}
              />
            </div>
          </Card>

          <Card className="border-border/50 bg-card min-h-[340px] p-3 shadow-sm sm:p-4">
            <TabsPane doc={doc} />
          </Card>
        </div>

        {/* Rail: full-width on mobile, fixed 320px on desktop */}
        <ExtractedFieldsRail
          summary={doc.summary}
          canEdit={canEdit}
          isEditing={isEditing}
          draft={draft}
          isSaving={isSaving}
          saveError={saveError}
          onEdit={startEdit}
          onSave={() => void saveSummary()}
          onCancel={cancelEdit}
          onFieldChange={updateField}
          onNarrativeChange={updateNarrative}
          onItemChange={updateItem}
          onItemAdd={addItem}
          onItemRemove={removeItem}
        />
      </section>
    </div>
  );
}

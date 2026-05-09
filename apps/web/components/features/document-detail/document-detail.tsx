'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { StatusBadge } from '@/components/shared/status-badge';
import type { DocumentDetail } from '@invoices-ocr/shared-types';
import { useDocumentDetail } from './use-document-detail';
import { DocumentViewer } from './document-viewer';
import { ExtractedFieldsRail } from './extracted-fields-rail';
import { TabsPane } from './tabs-pane';

interface DocumentDetailProps {
  initialDoc: DocumentDetail;
}

export function DocumentDetailView({ initialDoc }: DocumentDetailProps) {
  const t = useTranslations('document');
  const tDisabled = useTranslations('disabled');
  const tUpload = useTranslations('upload');
  const doc = useDocumentDetail(initialDoc);
  const razao = doc.summary?.core.razaoSocial ?? null;
  const valor = doc.summary?.core.valorTotal ?? null;
  const data = doc.summary?.core.dataEmissao ?? null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{tUpload('breadcrumb.home')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[260px] truncate">{doc.filename}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label={t('header.back')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={16} />
            </Link>
            <h1 className="truncate text-[20px] font-medium tracking-tight">{doc.filename}</h1>
            <StatusBadge status={doc.status} />
          </div>
          <p className="text-muted-foreground mt-1 truncate text-[12px]">
            {[razao, valor, data].filter(Boolean).join(' · ') || ''}
          </p>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button variant="outline" size="sm" disabled aria-disabled>
                  <Download size={14} />
                  {t('header.export')}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{tDisabled('f4')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="bg-muted/30 aspect-[3/4] w-full overflow-hidden rounded-md lg:aspect-auto lg:h-[44vh]">
            <DocumentViewer mime={doc.mime} src={doc.fileUrl} filename={doc.filename} />
          </div>

          <div className="border-border bg-card min-h-[280px] rounded-md border p-4">
            <TabsPane doc={doc} />
          </div>
        </div>

        <ExtractedFieldsRail summary={doc.summary} />
      </section>
    </div>
  );
}

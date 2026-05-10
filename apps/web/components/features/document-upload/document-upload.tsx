'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { Upload, ShieldCheck, Sparkles, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { useDocumentUpload } from './use-document-upload';
import { UploadCard } from './upload-card';
import { OptimisticUploadCard } from './optimistic-upload-card';
import { useActiveUploads } from '@/components/features/active-uploads/use-active-uploads';

export function DocumentUpload() {
  const t = useTranslations('upload');
  const { uploadFiles, activeUploads: pending } = useDocumentUpload();
  const { activeUploads, completedUploads } = useActiveUploads();

  const onDrop = useCallback((accepted: File[]) => uploadFiles(accepted), [uploadFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{t('breadcrumb.home')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('breadcrumb.new')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-2 text-[22px] font-medium tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground mt-1.5 text-[13px]">{t('subtitle')}</p>

      <Card className="mt-6 overflow-hidden p-3">
        <div
          {...getRootProps()}
          className={cn(
            'border-border bg-background flex cursor-pointer flex-col items-center justify-center gap-3.5 rounded-md border border-dashed px-6 py-10 text-center transition-colors',
            'hover:border-primary/30 hover:bg-muted/30',
            isDragActive && 'border-primary/40 bg-muted/40',
          )}
          aria-label="dropzone"
        >
          <input {...getInputProps()} />
          <div className="border-border bg-muted/50 text-muted-foreground grid h-9 w-9 place-items-center rounded-md border">
            <Upload size={17} strokeWidth={1.6} />
          </div>
          <div>
            <div className="text-foreground text-sm font-medium">{t('dropzone.drag')}</div>
            <div className="text-muted-foreground mt-1 text-xs">
              {t('dropzone.or')}{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                className="text-foreground decoration-border hover:decoration-foreground underline underline-offset-2"
              >
                {t('dropzone.browse')}
              </button>
            </div>
          </div>
          <div className="text-muted-foreground/80 flex items-center gap-3 text-[11px]">
            {t('dropzone.hint')}
          </div>
        </div>
      </Card>

      {(pending.length > 0 || activeUploads.length > 0 || completedUploads.length > 0) && (
        <div className="mt-4 space-y-3">
          {pending.map((u) => (
            <OptimisticUploadCard key={u.clientId} upload={u} />
          ))}
          {activeUploads.map((doc) => (
            <UploadCard key={doc.id} doc={doc} />
          ))}
          {completedUploads.map((doc) => (
            <UploadCard key={`completed-${doc.id}`} doc={doc} />
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {[
          { Icon: ShieldCheck, key: 'encrypted' as const },
          { Icon: Sparkles, key: 'auto_detect' as const },
          { Icon: FileText, key: 'multipage' as const },
        ].map(({ Icon, key }) => (
          <div
            key={key}
            className="text-muted-foreground flex items-start gap-2.5 text-[12px] leading-relaxed"
          >
            <Icon size={13} className="text-muted-foreground/70 mt-0.5 flex-shrink-0" />
            <span>{t(`helpers.${key}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

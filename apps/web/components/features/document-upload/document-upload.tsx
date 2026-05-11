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
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
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

      <h1 className="mt-2 text-lg font-medium tracking-tight sm:text-[22px]">{t('title')}</h1>
      <p className="text-muted-foreground mt-1.5 text-[13px]">{t('subtitle')}</p>

      <Card className="border-border/40 bg-card/50 mt-4 overflow-hidden shadow-lg shadow-black/10 sm:mt-6">
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg px-4 py-10 text-center transition-all duration-300 sm:gap-4 sm:px-6 sm:py-14',
            'border-border/40 bg-muted/20 border-2 border-dashed',
            'hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_30px_-10px_var(--primary)]',
            isDragActive &&
              'border-primary/60 bg-primary/10 scale-[1.01] shadow-[0_0_40px_-10px_var(--primary)]',
          )}
          aria-label="dropzone"
        >
          <input {...getInputProps()} />
          <div
            className={cn(
              'border-primary/20 from-primary/20 grid h-12 w-12 place-items-center rounded-2xl border bg-gradient-to-br to-transparent transition-transform duration-300 sm:h-14 sm:w-14',
              isDragActive && '-translate-y-1 scale-110',
            )}
          >
            <Upload size={20} strokeWidth={1.5} className="text-primary/80" />
          </div>
          <div>
            <div className="text-foreground text-sm font-medium sm:text-base">
              {t('dropzone.drag')}
            </div>
            <div className="text-muted-foreground mt-1 text-xs sm:mt-1.5 sm:text-sm">
              {t('dropzone.or')}{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {t('dropzone.browse')}
              </button>
            </div>
          </div>
          <div className="text-muted-foreground/60 text-xs">{t('dropzone.hint')}</div>
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

      <div className="mt-5 flex flex-col gap-3 sm:mt-6">
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

'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentViewerProps {
  mime: string;
  src: string | null;
  filename: string;
  onLoadError?: () => void;
}

function rewriteFileUrl(src: string): string {
  return src.replace(/^\/api\/v1\/documents\//, '/api/documents/');
}

export function DocumentViewer({ mime, src, filename, onLoadError }: DocumentViewerProps) {
  const t = useTranslations('document.viewer');
  // Para PDF, o fallback content do <object> aparece quando o data falha
  // — visualmente o usuário percebe e tem o link "abrir em nova aba".
  // Auto-refresh para PDF requereria HEAD probe que dobra a banda
  // (Next BFF auto-implementa HEAD via GET, e o API lê arquivo todo).
  // Decisão: priorizar custo de banda; auto-refresh fica só no <img>.

  if (!src) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-full w-full max-w-sm" />
      </div>
    );
  }

  const proxied = rewriteFileUrl(src);

  if (mime === 'application/pdf') {
    return (
      <object
        data={proxied}
        type="application/pdf"
        aria-label={filename}
        className="border-border bg-background h-full w-full rounded-md border"
      >
        <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4 text-sm">
          <p>{t('pdf_fallback')}</p>
          <a
            href={proxied}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {t('pdf_open_in_tab')}
          </a>
        </div>
      </object>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxied}
      alt={filename}
      onError={onLoadError}
      className="border-border h-full w-full rounded-md border object-contain"
      loading="lazy"
    />
  );
}

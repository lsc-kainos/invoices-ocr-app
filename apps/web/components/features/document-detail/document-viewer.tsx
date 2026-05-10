'use client';

import { useEffect, useRef } from 'react';
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
  // <object> não dispara onError em PDF que falha; verificamos via HEAD
  // para detectar storage_missing (404) e notificar o pai pra re-fetch.
  const objectRef = useRef<HTMLObjectElement>(null);

  useEffect(() => {
    if (!src || !onLoadError || mime !== 'application/pdf') return;
    let cancelled = false;
    const proxied = rewriteFileUrl(src);
    fetch(proxied, { method: 'HEAD' })
      .then((r) => {
        if (!cancelled && !r.ok) onLoadError();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [src, mime, onLoadError]);

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
        ref={objectRef}
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

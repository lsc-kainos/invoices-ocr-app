'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
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

// PDF in <object> nao renderiza inline de forma confiavel em iOS Safari
// nem Chrome Android. Em mobile/tablet trocamos por um card clicavel que
// abre o PDF no viewer nativo do device (sempre funciona).
function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export function DocumentViewer({ mime, src, filename, onLoadError }: DocumentViewerProps) {
  const t = useTranslations('document.viewer');
  const objectRef = useRef<HTMLObjectElement>(null);
  const isMobile = useIsMobileViewport();

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
    if (isMobile) {
      return (
        <a
          href={proxied}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('pdf_open_in_tab')}
          className="bg-background hover:bg-muted/40 active:bg-muted/60 flex h-full w-full flex-col items-center justify-center gap-3 p-6 transition-colors"
        >
          <FileText className="text-primary size-12" strokeWidth={1.5} />
          <p className="text-foreground max-w-full truncate text-sm font-medium">{filename}</p>
          <p className="text-muted-foreground text-xs">{t('pdf_mobile_tap')}</p>
        </a>
      );
    }

    return (
      <object
        ref={objectRef}
        data={proxied}
        type="application/pdf"
        aria-label={filename}
        className="bg-background h-full w-full"
      >
        <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4 text-sm">
          <p>{t('pdf_fallback')}</p>
          <a
            href={proxied}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
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
      className="h-full w-full object-contain"
      loading="lazy"
    />
  );
}

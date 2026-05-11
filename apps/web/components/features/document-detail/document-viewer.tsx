'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentDetail } from '@invoices-ocr/shared-types';

interface DocumentViewerProps {
  documentId: string;
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
//
// Usa useSyncExternalStore (API React nativa pra subscrever a external state):
// - SSR-safe: getServerSnapshot retorna null para indicar "ainda nao sei";
//   o consumer renderiza Skeleton ate hidratar, evitando flicker.
// - Sem setState dentro de useEffect (passa o lint rule
//   react-hooks/set-state-in-effect que estava bloqueando o CI).
// - Compatibilidade iOS Safari <14: MediaQueryList.addEventListener nao
//   existe; fazemos fallback pra addListener (deprecated mas funciona).
function useIsMobileViewport(): boolean | null {
  const subscribe = useCallback((callback: () => void) => {
    const mq = window.matchMedia('(max-width: 1023px)');
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', callback);
      return () => mq.removeEventListener('change', callback);
    }
    // Fallback Safari iOS <14
    mq.addListener(callback);
    return () => mq.removeListener(callback);
  }, []);

  const getSnapshot = useCallback(() => window.matchMedia('(max-width: 1023px)').matches, []);

  const getServerSnapshot = useCallback((): boolean | null => null, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function DocumentViewer({
  documentId,
  mime,
  src,
  filename,
  onLoadError,
}: DocumentViewerProps) {
  const t = useTranslations('document.viewer');
  const objectRef = useRef<HTMLObjectElement>(null);
  const isMobile = useIsMobileViewport();
  const [isOpening, setIsOpening] = useState(false);

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

  // Abre o PDF em nova aba refazendo o fetch do detail pra pegar uma
  // signed URL fresca. Se o usuario deixa a pagina aberta por >15min,
  // o token HMAC original ja expirou — abrir o href stale dispararia 401.
  // GET /api/documents/:id sempre retorna fileUrl recem-assinada (TTL 15min).
  const handleMobileOpen = useCallback(async () => {
    if (isOpening) return;
    setIsOpening(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, { cache: 'no-store' });
      if (!res.ok) {
        onLoadError?.();
        return;
      }
      const detail = (await res.json()) as DocumentDetail;
      if (!detail.fileUrl) {
        onLoadError?.();
        return;
      }
      window.open(rewriteFileUrl(detail.fileUrl), '_blank', 'noopener,noreferrer');
    } catch {
      onLoadError?.();
    } finally {
      setIsOpening(false);
    }
  }, [documentId, isOpening, onLoadError]);

  if (!src) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-full w-full max-w-sm" />
      </div>
    );
  }

  // Pre-hidratacao: ainda nao sabemos se mobile/desktop. Renderizar
  // Skeleton ate o cliente decidir evita SSR mismatch (flicker do
  // <object> desktop trocando pro card mobile na hidratacao).
  if (isMobile === null) {
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
        <button
          type="button"
          onClick={handleMobileOpen}
          disabled={isOpening}
          aria-label={t('pdf_open_in_tab')}
          className="bg-background hover:bg-muted/40 active:bg-muted/60 flex h-full w-full flex-col items-center justify-center gap-3 p-6 transition-colors disabled:opacity-60"
        >
          <FileText className="text-primary size-12" strokeWidth={1.5} />
          <p className="text-foreground max-w-full truncate text-sm font-medium">{filename}</p>
          <p className="text-muted-foreground text-xs">{t('pdf_mobile_tap')}</p>
        </button>
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

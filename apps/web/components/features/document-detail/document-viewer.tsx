'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface DocumentViewerProps {
  mime: string;
  src: string | null;
  filename: string;
}

// O fileUrl que vem da API tem path /api/v1/documents/:id/file?token=...
// O cliente não consegue alcançar diretamente a api (sem NEXT_PUBLIC_API_URL),
// então convertemos para o proxy local /api/documents/:id/file?token=...
function rewriteFileUrl(src: string): string {
  return src.replace(/^\/api\/v1\/documents\//, '/api/documents/');
}

export function DocumentViewer({ mime, src, filename }: DocumentViewerProps) {
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
      <iframe
        title={filename}
        src={proxied}
        className="border-border bg-background h-full w-full rounded-md border"
        sandbox="allow-same-origin allow-scripts"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxied}
      alt={filename}
      className="border-border h-full w-full rounded-md border object-contain"
      loading="lazy"
    />
  );
}

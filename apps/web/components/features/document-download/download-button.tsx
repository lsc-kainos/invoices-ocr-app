'use client';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDocumentDownload } from './use-document-download';
import type { DocumentStatus } from '@invoices-ocr/shared-types';

type Props = {
  documentId: string;
  filename: string;
  status: DocumentStatus;
  variant?: 'default' | 'icon';
};

export function DownloadButton({ documentId, filename, status, variant = 'default' }: Props) {
  const t = useTranslations('documents.download');
  const { download, isPending } = useDocumentDownload();
  const disabled = status !== 'READY' || isPending(documentId);

  const button = (
    <Button
      variant={variant === 'icon' ? 'ghost' : 'default'}
      size={variant === 'icon' ? 'icon' : 'sm'}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        void download(documentId, filename);
      }}
      aria-label={t('button')}
    >
      <Download className="h-4 w-4" />
      {variant === 'default' && <span className="ml-2">{t('button')}</span>}
    </Button>
  );

  if (status !== 'READY') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{t('disabled_tooltip')}</TooltipContent>
      </Tooltip>
    );
  }
  return button;
}

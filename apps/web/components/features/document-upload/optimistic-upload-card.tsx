'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { OptimisticUpload } from './use-document-upload';

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

interface Props {
  upload: OptimisticUpload;
}

export function OptimisticUploadCard({ upload }: Props) {
  const t = useTranslations('upload');
  const percent = Math.round(upload.progress * 100);
  return (
    <Card className="border-border/60 bg-card p-3.5" data-testid="optimistic-upload-card">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="font-mono text-[10px] tracking-wide uppercase">
          {t('status.QUEUED')}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate text-[13px] font-medium">{upload.filename}</div>
          <div className="text-muted-foreground mt-0.5 font-mono text-[11px]">
            {formatSize(upload.size)} · {t('progress.uploading', { percent })}
          </div>
        </div>
      </div>
      <Progress value={percent} className="mt-3 h-1" />
    </Card>
  );
}

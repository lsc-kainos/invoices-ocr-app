'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { UPLOAD_QUEUED_EVENT } from '../active-uploads/events';

interface UseDocumentUploadResult {
  uploadFiles: (files: File[]) => Promise<void>;
  pending: number;
}

interface ApiError {
  code?: string;
}

export function useDocumentUpload(): UseDocumentUploadResult {
  const t = useTranslations('errors.upload');
  const [pending, setPending] = useState(0);

  const uploadOne = useCallback(
    async (file: File) => {
      const fd = new FormData();
      fd.append('file', file, file.name);
      let res: Response;
      try {
        res = await fetch('/api/upload', { method: 'POST', body: fd });
      } catch {
        toast.error(t('network'));
        return;
      }
      if (res.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(UPLOAD_QUEUED_EVENT));
        }
        return;
      }
      let body: ApiError | null = null;
      try {
        body = (await res.json()) as ApiError;
      } catch {
        body = null;
      }
      if (res.status === 429) {
        toast.error(t('rate_limit'));
        return;
      }
      if (res.status === 413) {
        toast.error(t('too_large'));
        return;
      }
      if (res.status === 400 && body?.code === 'upload.invalid_type') {
        toast.error(t('invalid_type'));
        return;
      }
      toast.error(t('network'));
    },
    [t],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setPending((p) => p + files.length);
      try {
        await Promise.all(files.map((f) => uploadOne(f)));
      } finally {
        setPending((p) => Math.max(0, p - files.length));
      }
    },
    [uploadOne],
  );

  return { uploadFiles, pending };
}

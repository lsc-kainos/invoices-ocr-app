'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { UPLOAD_QUEUED_EVENT } from '../active-uploads/events';

export interface OptimisticUpload {
  clientId: string;
  filename: string;
  size: number;
  progress: number; // 0..1
}

interface UseDocumentUploadResult {
  uploadFiles: (files: File[]) => Promise<void>;
  activeUploads: OptimisticUpload[];
}

interface ApiError {
  code?: string;
}

const ERROR_KEY: Record<string, string> = {
  invalid_type: 'invalid_type_named',
  too_large: 'too_large_named',
  rate_limit: 'rate_limit_named',
  network: 'network_named',
};

function uploadOneViaXhr(
  file: File,
  onProgress: (p: number) => void,
): Promise<{ ok: boolean; status: number; body: ApiError | null }> {
  return new Promise((resolve) => {
    const fd = new FormData();
    fd.append('file', file, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body: ApiError | null = null;
      try {
        body = JSON.parse(xhr.responseText) as ApiError;
      } catch {
        body = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };
    xhr.onerror = () => resolve({ ok: false, status: 0, body: null });
    xhr.send(fd);
  });
}

let counter = 0;
const nextId = () => `up-${++counter}-${Date.now()}`;

export function useDocumentUpload(): UseDocumentUploadResult {
  const t = useTranslations('errors.upload');
  const [activeUploads, setActiveUploads] = useState<OptimisticUpload[]>([]);

  const updateOne = useCallback((id: string, patch: Partial<OptimisticUpload>) => {
    setActiveUploads((prev) => prev.map((u) => (u.clientId === id ? { ...u, ...patch } : u)));
  }, []);

  const removeOne = useCallback((id: string) => {
    setActiveUploads((prev) => prev.filter((u) => u.clientId !== id));
  }, []);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const items: OptimisticUpload[] = files.map((f) => ({
        clientId: nextId(),
        filename: f.name,
        size: f.size,
        progress: 0,
      }));
      setActiveUploads((prev) => [...prev, ...items]);

      await Promise.all(
        items.map(async (item, i) => {
          const file = files[i]!;
          const result = await uploadOneViaXhr(file, (p) =>
            updateOne(item.clientId, { progress: p }),
          );
          if (result.ok) {
            removeOne(item.clientId);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent(UPLOAD_QUEUED_EVENT));
            }
            return;
          }
          const code =
            result.status === 429
              ? 'rate_limit'
              : result.status === 413
                ? 'too_large'
                : result.body?.code === 'upload.invalid_type'
                  ? 'invalid_type'
                  : 'network';
          toast.error(t(ERROR_KEY[code]!, { name: file.name }));
          removeOne(item.clientId);
        }),
      );
    },
    [removeOne, t, updateOne],
  );

  return { uploadFiles, activeUploads };
}

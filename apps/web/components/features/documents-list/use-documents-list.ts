'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { UPLOAD_QUEUED_EVENT } from '../active-uploads/events';

export function useDocumentsList(initial: DocumentSummary[]) {
  const [docs] = useState(initial);
  const router = useRouter();

  useEffect(() => {
    const onQueued = () => router.refresh();
    window.addEventListener(UPLOAD_QUEUED_EVENT, onQueued);
    return () => window.removeEventListener(UPLOAD_QUEUED_EVENT, onQueued);
  }, [router]);

  return { docs };
}

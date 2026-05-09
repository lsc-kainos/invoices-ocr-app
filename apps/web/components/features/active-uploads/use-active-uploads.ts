'use client';

import { useContext } from 'react';
import { ActiveUploadsContext } from './active-uploads-provider';

export function useActiveUploads() {
  const ctx = useContext(ActiveUploadsContext);
  if (!ctx) {
    return { activeUploads: [] };
  }
  return ctx;
}

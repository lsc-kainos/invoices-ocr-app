'use client';
import type { AvailableModel } from '@invoices-ocr/shared-types';
import { cn } from '@/lib/utils';

interface ModelSelectProps {
  models: AvailableModel[];
  value: string;
  onChange: (value: string) => void;
  visionOnly?: boolean;
  className?: string;
}

export function ModelSelect({ models, value, onChange, visionOnly, className }: ModelSelectProps) {
  const filtered = visionOnly ? models.filter((m) => m.vision) : models;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3',
        className,
      )}
    >
      <option value="">—</option>
      {filtered.map((m) => (
        <option key={m.id} value={m.id}>
          {m.id} ({m.provider}){m.vision ? ' ✦' : ''}
        </option>
      ))}
    </select>
  );
}

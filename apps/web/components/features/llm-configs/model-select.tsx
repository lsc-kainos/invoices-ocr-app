'use client';
import type { AvailableModel } from '@invoices-ocr/shared-types';
import { cn } from '@/lib/utils';

interface ModelSelectProps {
  id?: string;
  models: AvailableModel[];
  value: string;
  onChange: (value: string) => void;
  visionOnly?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Refined native <select> — alinhado com Input shadcn (h-9, border, rounded-md).
 */
export function ModelSelect({
  id,
  models,
  value,
  onChange,
  visionOnly,
  className,
  disabled,
}: ModelSelectProps) {
  const filtered = visionOnly ? models.filter((m) => m.vision) : models;

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'border-input bg-background text-foreground h-9 w-full rounded-md border px-3 text-sm outline-none',
        'focus-visible:ring-ring/50 focus-visible:ring-3',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'transition-colors duration-150 ease-out',
        className,
      )}
    >
      <option value="">— Selecione um modelo —</option>
      {filtered.map((m) => (
        <option key={m.id} value={m.id}>
          {m.id} · {m.provider}
          {m.vision ? ' · vision' : ''}
        </option>
      ))}
    </select>
  );
}

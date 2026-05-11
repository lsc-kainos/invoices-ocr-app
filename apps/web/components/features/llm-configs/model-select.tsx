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
 * Brutalist native <select>: bordas pretas grossas, mono, ALL CAPS.
 * Concessão pra inputs: rounded-none (0px), sem cantos arredondados.
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
        'border-foreground bg-background text-foreground font-mono text-xs tracking-wider uppercase',
        'h-10 w-full rounded-none border-2 px-3 py-2 outline-none',
        'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'transition-none',
        className,
      )}
    >
      <option value="">— SELECT MODEL —</option>
      {filtered.map((m) => (
        <option key={m.id} value={m.id}>
          {m.id} · {m.provider.toUpperCase()}
          {m.vision ? ' · VISION' : ''}
        </option>
      ))}
    </select>
  );
}

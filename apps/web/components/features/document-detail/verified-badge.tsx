'use client';

import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface VerifiedBadgeProps {
  verifiedAt: string;
}

export function VerifiedBadge({ verifiedAt }: VerifiedBadgeProps) {
  const t = useTranslations('document.edit');
  const date = new Date(verifiedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;

  return (
    <span
      title={`${t('verified')} · ${formatted}`}
      className="flex items-center gap-1 text-[11px] text-green-500"
    >
      <CheckCircle2 size={12} aria-hidden />
      {t('verified')}
    </span>
  );
}

'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function EmptyListState() {
  const t = useTranslations('documents.list');
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center sm:p-12"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 40%, oklch(0.15 0.06 40 / 0.06) 0%, transparent 60%)',
      }}
    >
      <h2 className="text-lg font-medium sm:text-xl">{t('empty_title')}</h2>
      <Link href="/">
        <Button className="transition-all hover:shadow-[0_0_20px_-5px_var(--primary)]">
          {t('empty_cta')}
        </Button>
      </Link>
    </div>
  );
}

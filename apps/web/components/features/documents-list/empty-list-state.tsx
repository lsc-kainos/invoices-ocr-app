'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function EmptyListState() {
  const t = useTranslations('documents.list');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <h2 className="text-xl font-medium">{t('empty_title')}</h2>
      <Link href="/">
        <Button>{t('empty_cta')}</Button>
      </Link>
    </div>
  );
}

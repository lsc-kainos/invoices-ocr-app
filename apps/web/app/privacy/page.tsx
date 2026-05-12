import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('privacy');
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-foreground mb-6 text-2xl font-bold">{t('title')}</h1>
      <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
        <p>{t('intro')}</p>
        <h2 className="text-foreground mt-6 mb-2 text-lg font-semibold">
          {t('data_collected_title')}
        </h2>
        <p>{t('data_collected')}</p>
        <h2 className="text-foreground mt-6 mb-2 text-lg font-semibold">{t('purpose_title')}</h2>
        <p>{t('purpose')}</p>
        <h2 className="text-foreground mt-6 mb-2 text-lg font-semibold">{t('retention_title')}</h2>
        <p>{t('retention')}</p>
        <h2 className="text-foreground mt-6 mb-2 text-lg font-semibold">{t('rights_title')}</h2>
        <p>{t('rights')}</p>
        <h2 className="text-foreground mt-6 mb-2 text-lg font-semibold">{t('contact_title')}</h2>
        <p>{t('contact')}</p>
      </div>
    </main>
  );
}

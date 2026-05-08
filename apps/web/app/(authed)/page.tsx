import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('home');
  const name = session?.user?.name ?? session?.user?.email ?? '';
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-6 py-16">
      <h1 className="font-serif-italic text-5xl tracking-[-0.03em]">{t('welcome', { name })}</h1>
      <p className="text-muted-foreground text-base">{t('placeholder')}</p>
    </div>
  );
}

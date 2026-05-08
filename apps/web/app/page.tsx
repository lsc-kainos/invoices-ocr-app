import { useTranslations } from 'next-intl';
// Topbar renderizada aqui só para smoke visual da F0.5; F1 introduz
// app/(authed)/layout.tsx que aplica a Topbar nas rotas autenticadas.
import { Topbar } from '@/components/layout/topbar';

export default function Home() {
  const t = useTranslations('home');
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="grid flex-1 place-items-center px-6">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="font-serif-italic text-5xl">{t('skeleton_title')}</h1>
          <p className="text-muted-foreground text-sm">{t('skeleton_caption')}</p>
        </div>
      </main>
    </div>
  );
}

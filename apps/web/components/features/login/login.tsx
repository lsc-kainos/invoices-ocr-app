'use client';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';
import { GoogleLogo } from './google-logo';
import { GithubLogo } from './github-logo';
import { useLogin } from './use-login';

const ERROR_KEYS = [
  'Configuration',
  'AccessDenied',
  'Verification',
  'OAuthAccountNotLinked',
  'Default',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

// Cascata teatral: hero nasce (zoom+fade) → subtítulo desliza → botões CTA
// surgem por último. Tempos pensados para dar ritmo de "apresentação".
//
//   t=0      logo aparece (suave)
//   t=300    headline NASCE (zoom-in + fade) — duração longa
//   t=900    subtítulo desliza pra baixo
//   t=1400   tagline e header do card entram juntos
//   t=1700   subtítulo do card
//   t=2000   botões OAuth (CTA — final da apresentação)
//   t=2400   Termos · Privacidade (rodapé)
const slide = 'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both';

export function Login() {
  const t = useTranslations('login');
  const tErr = useTranslations('auth.errors');
  const params = useSearchParams();
  const errorParam = params.get('error');
  const errorKey: ErrorKey | null = errorParam
    ? (ERROR_KEYS as readonly string[]).includes(errorParam)
      ? (errorParam as ErrorKey)
      : 'Default'
    : null;
  const { signInGoogle, signInGithub, pending } = useLogin();

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Editorial column — desktop only */}
      <div className="border-border bg-background hidden flex-col justify-between border-r px-14 py-10 lg:flex">
        <div className={`${slide} duration-500`}>
          <Logo />
        </div>
        <div className="flex max-w-[420px] flex-col gap-5">
          <h1 className="animate-in fade-in-0 zoom-in-95 fill-mode-both text-foreground text-4xl font-semibold tracking-tight delay-300 duration-1000">
            {t('headline')}
          </h1>
          <p
            className={`${slide} text-muted-foreground text-base leading-relaxed delay-[900ms] duration-700`}
          >
            {t('subtitle')}
          </p>
        </div>
        <span className={`${slide} text-muted-foreground text-xs delay-[1400ms] duration-500`}>
          {t('tagline')}
        </span>
      </div>

      {/* Auth card */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px]">
          <div className={`${slide} mb-8 flex justify-center duration-500 lg:hidden`}>
            <Logo />
          </div>

          <h2
            className={`${slide} text-2xl font-medium tracking-tight delay-[1400ms] duration-700`}
          >
            {t('card.title')}
          </h2>
          <p
            className={`${slide} text-muted-foreground mt-2 mb-6 text-[13px] leading-relaxed delay-[1700ms] duration-700`}
          >
            {t('card.subtitle')}
          </p>

          {errorKey && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-md border px-3 py-2 text-sm"
            >
              {tErr(errorKey)}
            </div>
          )}

          <div className={`${slide} flex flex-col gap-2 delay-[2000ms] duration-700`}>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="justify-center gap-2.5 transition-transform active:scale-[0.98]"
              onClick={signInGoogle}
              disabled={pending !== null}
              aria-label={t('card.google')}
              data-pending={pending === 'google' ? '' : undefined}
            >
              {pending === 'google' ? (
                <Loader2 size={15} className="animate-spin" aria-hidden />
              ) : (
                <GoogleLogo size={15} />
              )}
              {t('card.google')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="justify-center gap-2.5 transition-transform active:scale-[0.98]"
              onClick={signInGithub}
              disabled={pending !== null}
              aria-label={t('card.github')}
              data-pending={pending === 'github' ? '' : undefined}
            >
              {pending === 'github' ? (
                <Loader2 size={15} className="animate-spin" aria-hidden />
              ) : (
                <GithubLogo size={15} />
              )}
              {t('card.github')}
            </Button>
          </div>

          <div
            className={`${slide} border-border text-muted-foreground mt-6 border-t pt-4 text-[11px] leading-relaxed delay-[2400ms] duration-500`}
          >
            <a href="#" className="hover:underline">
              {t('card.terms')}
            </a>{' '}
            ·{' '}
            <a href="#" className="hover:underline">
              {t('card.privacy')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

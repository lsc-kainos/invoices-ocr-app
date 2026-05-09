'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { getCsrfToken } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';
import { GoogleLogo } from './google-logo';
import { GithubLogo } from './github-logo';

const ERROR_KEYS = [
  'Configuration',
  'AccessDenied',
  'Verification',
  'OAuthAccountNotLinked',
  'Default',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

// Cascata teatral em duas fases (apenas desktop):
//
//   FASE 1 (0–1500ms): hero ocupa 100% da tela.
//     t=0     Logo aparece (slide+fade)
//     t=300   HEADLINE nasce (zoom-in-95 + fade, 1000ms)
//     t=900   subtítulo desliza
//     t=1400  tagline
//
//   FASE 2 (1500ms+): grid-template-columns anima [1fr_0fr] →
//   [1fr_1fr] em 1000ms, abrindo espaço pro card. A border-r do hero
//   vira a linha divisória "construída".
//     t=1500  H2 "Entrar"
//     t=2000  subtítulo do card
//     t=2200  botões OAuth (CTA)
//     t=2700  Termos · Privacidade
//
// Botões: <form> POST nativo (NÃO signIn() JS) pra imunidade a stale
// closures + bfcache. Disabled apenas enquanto csrfToken carrega
// (~100ms via getCsrfToken), pra evitar 1ª submissão sem token válido.
const slide = 'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both';
const SPLIT_DELAY_MS = 1500;

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

  const [csrfToken, setCsrfToken] = useState('');
  const [split, setSplit] = useState(false);

  useEffect(() => {
    getCsrfToken().then((token) => setCsrfToken(token ?? ''));
    const id = setTimeout(() => setSplit(true), SPLIT_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      data-phase={split ? 'split' : 'hero-full'}
      className={cn(
        'grid min-h-screen grid-cols-1 transition-[grid-template-columns] duration-1000 ease-out',
        split ? 'lg:grid-cols-[1fr_1fr]' : 'lg:grid-cols-[1fr_0fr]',
      )}
    >
      {/* Editorial column — desktop only */}
      <div className="border-border bg-background hidden flex-col justify-between overflow-hidden border-r px-14 py-10 lg:flex">
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
      <div className="flex items-center justify-center overflow-hidden px-6 py-10">
        <div className="w-full max-w-[360px]">
          {/* Mobile mini hero */}
          <div className="mb-10 flex flex-col gap-3 lg:hidden">
            <div className={`${slide} duration-500`}>
              <Logo />
            </div>
            <h1 className="animate-in fade-in-0 zoom-in-95 fill-mode-both text-foreground text-2xl font-semibold tracking-tight delay-150 duration-700">
              {t('headline')}
            </h1>
            <p
              className={`${slide} text-muted-foreground text-sm leading-relaxed delay-300 duration-500`}
            >
              {t('subtitle')}
            </p>
          </div>

          <h2
            className={`${slide} text-2xl font-medium tracking-tight delay-200 duration-700 lg:delay-[1700ms]`}
          >
            {t('card.title')}
          </h2>
          <p
            className={`${slide} text-muted-foreground mt-2 mb-6 text-[13px] leading-relaxed delay-500 duration-700 lg:delay-[2000ms]`}
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

          <div className={`${slide} flex flex-col gap-2 delay-700 duration-700 lg:delay-[2200ms]`}>
            <form action="/api/auth/signin/google" method="POST" className="contents">
              <input type="hidden" name="csrfToken" value={csrfToken} />
              <input type="hidden" name="callbackUrl" value="/" />
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={!csrfToken}
                className="w-full justify-center gap-2.5 transition-transform active:scale-[0.98]"
                aria-label={t('card.google')}
              >
                <GoogleLogo size={15} />
                {t('card.google')}
              </Button>
            </form>
            <form action="/api/auth/signin/github" method="POST" className="contents">
              <input type="hidden" name="csrfToken" value={csrfToken} />
              <input type="hidden" name="callbackUrl" value="/" />
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={!csrfToken}
                className="w-full justify-center gap-2.5 transition-transform active:scale-[0.98]"
                aria-label={t('card.github')}
              >
                <GithubLogo size={15} />
                {t('card.github')}
              </Button>
            </form>
          </div>

          <div
            className={`${slide} border-border text-muted-foreground mt-6 border-t pt-4 text-[11px] leading-relaxed delay-1000 duration-500 lg:delay-[2700ms]`}
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

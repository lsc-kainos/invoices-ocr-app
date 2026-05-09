'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { getCsrfToken } from 'next-auth/react';
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

// Fluxo de login via <form> POST nativo. Bypassa o signIn() JS client
// do NextAuth — bug intermitente onde onClick handlers morriam após o
// primeiro round-trip OAuth (independente de animação, bfcache, ou
// state cleanup). Form submission é browser-native: 100% imune a stale
// closures, React reconciliation weirdness, ou bfcache event delegation
// quebrada.
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
  useEffect(() => {
    getCsrfToken().then((token) => setCsrfToken(token ?? ''));
  }, []);

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Editorial column — desktop only */}
      <div className="border-border bg-background hidden flex-col justify-between border-r px-14 py-10 lg:flex">
        <Logo />
        <div className="flex max-w-[420px] flex-col gap-4">
          <h1 className="text-foreground text-4xl font-semibold tracking-tight">{t('headline')}</h1>
          <p className="text-muted-foreground text-base leading-relaxed">{t('subtitle')}</p>
        </div>
        <span className="text-muted-foreground text-xs">{t('tagline')}</span>
      </div>

      {/* Auth card */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px]">
          {/* Mobile mini hero */}
          <div className="mb-10 flex flex-col gap-3 lg:hidden">
            <Logo />
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
              {t('headline')}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('subtitle')}</p>
          </div>

          <h2 className="text-2xl font-medium tracking-tight">{t('card.title')}</h2>
          <p className="text-muted-foreground mt-2 mb-6 text-[13px] leading-relaxed">
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

          <div className="flex flex-col gap-2">
            <form action="/api/auth/signin/google" method="POST" className="contents">
              <input type="hidden" name="csrfToken" value={csrfToken} />
              <input type="hidden" name="callbackUrl" value="/" />
              <Button
                type="submit"
                variant="secondary"
                size="lg"
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
                className="w-full justify-center gap-2.5 transition-transform active:scale-[0.98]"
                aria-label={t('card.github')}
              >
                <GithubLogo size={15} />
                {t('card.github')}
              </Button>
            </form>
          </div>

          <div className="border-border text-muted-foreground mt-6 border-t pt-4 text-[11px] leading-relaxed">
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

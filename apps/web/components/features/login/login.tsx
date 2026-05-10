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

  const [csrfToken, setCsrfToken] = useState('');
  useEffect(() => {
    getCsrfToken().then((token) => setCsrfToken(token ?? ''));
  }, []);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (csrfToken) return;
    e.preventDefault();
    const form = e.currentTarget;
    const token = await getCsrfToken();
    if (!token) return;
    setCsrfToken(token);
    const csrfInput = form.querySelector('input[name="csrfToken"]') as HTMLInputElement | null;
    if (csrfInput) {
      csrfInput.value = token;
      form.submit();
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Editorial column - desktop only */}
      <div
        className="border-border/40 bg-background relative hidden flex-col justify-between border-r px-8 py-8 lg:flex lg:px-14 lg:py-10"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 70% 20%, oklch(0.15 0.06 40 / 0.10) 0%, transparent 60%)',
        }}
      >
        <div className={`${slide} duration-500`}>
          <Logo size={28} />
        </div>
        <div className="flex max-w-[420px] flex-col gap-5">
          <h1 className="animate-in fade-in-0 zoom-in-95 fill-mode-both text-foreground text-3xl font-semibold tracking-tight delay-300 duration-1000 lg:text-4xl">
            {t('headline')}
          </h1>
          <p
            className={`${slide} text-muted-foreground text-sm leading-relaxed delay-[900ms] duration-700 lg:text-base`}
          >
            {t('subtitle')}
          </p>
        </div>
        <span className={`${slide} text-muted-foreground text-xs delay-[1400ms] duration-500`}>
          {t('tagline')}
        </span>
      </div>

      {/* Auth card - full width on mobile, centered on desktop */}
      <div className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-[360px]">
          {/* Mobile mini hero */}
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 lg:hidden">
            <div className={`${slide} duration-500`}>
              <Logo size={28} />
            </div>
            <h1 className="animate-in fade-in-0 zoom-in-95 fill-mode-both text-foreground text-xl font-semibold tracking-tight delay-150 duration-700 sm:text-2xl">
              {t('headline')}
            </h1>
            <p
              className={`${slide} text-muted-foreground text-sm leading-relaxed delay-300 duration-500`}
            >
              {t('subtitle')}
            </p>
          </div>

          <h2
            className={`${slide} text-xl font-medium tracking-tight delay-200 duration-700 sm:text-2xl`}
          >
            {t('card.title')}
          </h2>
          <p
            className={`${slide} text-muted-foreground mt-2 mb-6 text-[13px] leading-relaxed delay-500 duration-700`}
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

          <div className={`${slide} flex flex-col gap-2.5 delay-700 duration-700`}>
            <form
              action="/api/auth/signin/google"
              method="POST"
              className="contents"
              onSubmit={handleFormSubmit}
            >
              <input type="hidden" name="csrfToken" value={csrfToken} />
              <input type="hidden" name="callbackUrl" value="/" />
              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 w-full justify-center gap-2.5 transition-all hover:shadow-[0_0_20px_-5px_var(--primary)] active:scale-[0.98]"
                aria-label={t('card.google')}
              >
                <GoogleLogo size={15} />
                {t('card.google')}
              </Button>
            </form>
            <form
              action="/api/auth/signin/github"
              method="POST"
              className="contents"
              onSubmit={handleFormSubmit}
            >
              <input type="hidden" name="csrfToken" value={csrfToken} />
              <input type="hidden" name="callbackUrl" value="/" />
              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 w-full justify-center gap-2.5 transition-all hover:shadow-[0_0_20px_-5px_var(--primary)] active:scale-[0.98]"
                aria-label={t('card.github')}
              >
                <GithubLogo size={15} />
                {t('card.github')}
              </Button>
            </form>
          </div>

          <div
            className={`${slide} border-border/40 text-muted-foreground mt-6 border-t pt-4 text-[11px] leading-relaxed delay-1000 duration-500`}
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

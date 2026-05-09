'use client';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
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
        <Logo />
        <h1 className="text-foreground max-w-[380px] text-4xl font-semibold tracking-tight">
          {t('headline')}
        </h1>
        <span className="text-muted-foreground text-xs">{t('tagline')}</span>
      </div>

      {/* Auth card */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
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
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="justify-center gap-2.5"
              onClick={signInGoogle}
              disabled={pending !== null}
              aria-label={t('card.google')}
            >
              <GoogleLogo size={15} />
              {t('card.google')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="justify-center gap-2.5"
              onClick={signInGithub}
              disabled={pending !== null}
              aria-label={t('card.github')}
            >
              <GithubLogo size={15} />
              {t('card.github')}
            </Button>
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

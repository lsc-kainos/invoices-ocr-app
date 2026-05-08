'use client';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
      {/* Left column */}
      <div className="border-border bg-background relative flex flex-col overflow-hidden border-r px-14 py-8">
        <Logo />
        <div className="flex flex-1 flex-col justify-center gap-7">
          <h1 className="font-serif-italic text-foreground m-0 text-[92px] leading-[0.92] tracking-[-0.045em]">
            {t.rich('headline', { br: () => <br /> })}
          </h1>
          <p className="text-muted-foreground m-0 max-w-[420px] text-sm leading-relaxed">
            {t('subtitle')}
          </p>
          <div className="text-muted-foreground mt-2 flex gap-5 text-xs">
            <span className="inline-flex items-center gap-2">
              <Check size={13} className="text-emerald-500" />
              {t('features.nfe')}
            </span>
            <span className="inline-flex items-center gap-2">
              <Check size={13} className="text-emerald-500" />
              {t('features.nfse')}
            </span>
            <span className="inline-flex items-center gap-2">
              <Check size={13} className="text-emerald-500" />
              {t('features.boleto')}
            </span>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-4 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            {t('meta.operational')}
          </span>
          <span className="bg-border size-[3px] rounded-full" />
          <span>{t('meta.lgpd')}</span>
          <span className="bg-border size-[3px] rounded-full" />
          <span>{t('meta.soc2')}</span>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col px-12 py-8">
        <div className="text-muted-foreground flex justify-end text-xs">
          <a href="#" className="border-border ml-1.5 border-b">
            {t('card.request_access')}
          </a>
        </div>

        <div className="flex w-full max-w-[360px] flex-1 flex-col justify-center self-start">
          <h2 className="text-2xl font-medium tracking-[-0.02em]">{t('card.title')}</h2>
          <p className="text-muted-foreground mt-1.5 mb-6 text-[13px] leading-relaxed">
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

        <div className="text-muted-foreground flex justify-between text-[11px]">
          <span>{t('footer')}</span>
        </div>
      </div>
    </div>
  );
}

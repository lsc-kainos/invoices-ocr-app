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

// Layout SEMPRE em duas colunas (lg:grid-cols-2). Sem split dinâmico —
// a tentativa anterior de animar grid-template-columns de [1fr_0fr] →
// [1fr_1fr] deixava o card clipped no canto direito quando o React
// state ficava preso (bfcache, hidratação fora de ordem, ou Cache-
// Control: no-store ignorado pelo browser).
//
// Cada elemento ainda anima individualmente via cascade de delays —
// posições finais são corretas desde o 1º paint, animação é só
// fade+slide entrando.
//
// Botões: <form> POST nativo (NÃO signIn() JS), sem disabled. Se 1ª
// submissão sair com csrfToken vazio, NextAuth redireciona pra
// /login?error=Configuration; 2ª já tem o token. UX "2º clique" é
// aceitável.
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

  // Se o user clicar antes do useEffect popular o csrfToken, intercepta
  // o submit, busca o token na hora, injeta no input e re-submete. Sem
  // isso, 1º clique sai com csrf vazio → NextAuth rejeita → "página
  // atualiza" e só o 2º clique funciona.
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (csrfToken) return; // happy path: form submete naturalmente
    e.preventDefault();
    // Captura form sincronamente — após await, React limpa e.currentTarget
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

          <h2 className={`${slide} text-2xl font-medium tracking-tight delay-200 duration-700`}>
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

          <div className={`${slide} flex flex-col gap-2 delay-700 duration-700`}>
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
                variant="secondary"
                size="lg"
                className="w-full justify-center gap-2.5 transition-transform active:scale-[0.98]"
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

          <div
            className={`${slide} border-border text-muted-foreground mt-6 border-t pt-4 text-[11px] leading-relaxed delay-1000 duration-500`}
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

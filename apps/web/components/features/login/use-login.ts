'use client';
import { useCallback, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

type Provider = 'google' | 'github';

export function useLogin() {
  const [pending, setPending] = useState<Provider | null>(null);

  // Reset pending quando a página é restaurada do bfcache
  // (usuário clica "voltar" durante o OAuth flow). Sem isso, o
  // state pending fica preso e os botões aparecem disabled/sem
  // spinner ao retornar a /login.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(null);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const handle = useCallback(
    (provider: Provider) => async () => {
      setPending(provider);
      try {
        await signIn(provider, { callbackUrl: '/' });
      } finally {
        setPending(null);
      }
    },
    [],
  );

  return {
    pending,
    signInGoogle: handle('google'),
    signInGithub: handle('github'),
  };
}

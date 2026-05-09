'use client';
import { useCallback, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

type Provider = 'google' | 'github';

export function useLogin() {
  const [pending, setPending] = useState<Provider | null>(null);

  // Reseta pending em qualquer pageshow (fresh nav OR bfcache restore).
  // Cobre todos os caminhos de retorno do OAuth provider quando o user
  // cancela / clica voltar — sem isso, pending podia ficar preso e os
  // botões aparecerem disabled na 2ª tentativa.
  useEffect(() => {
    const reset = () => setPending(null);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
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

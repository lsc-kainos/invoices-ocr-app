import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { useLogin } from '../use-login';

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));

describe('useLogin', () => {
  beforeEach(() => {
    (signIn as ReturnType<typeof vi.fn>).mockReset();
  });

  it('chama signIn(google, {callbackUrl:/}) e seta pending durante o flow', async () => {
    let resolveSignIn: (() => void) | undefined;
    (signIn as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise<void>((r) => (resolveSignIn = r)),
    );
    const { result } = renderHook(() => useLogin());
    expect(result.current.pending).toBeNull();

    act(() => {
      void result.current.signInGoogle();
    });
    // Pending agora deve ser 'google' (state já mutou na chamada de setPending)
    expect(result.current.pending).toBe('google');
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });

    await act(async () => {
      resolveSignIn?.();
    });
    expect(result.current.pending).toBeNull();
  });

  it('reseta pending quando página é restaurada do bfcache (pageshow persisted)', () => {
    (signIn as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise<void>(() => {}), // nunca resolve
    );
    const { result } = renderHook(() => useLogin());

    act(() => {
      void result.current.signInGithub();
    });
    expect(result.current.pending).toBe('github');

    // Simula browser restaurando a página do bfcache
    act(() => {
      const ev = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(ev, 'persisted', { value: true });
      window.dispatchEvent(ev);
    });
    expect(result.current.pending).toBeNull();
  });

  it('NÃO reseta pending em pageshow normal (persisted=false)', () => {
    (signIn as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise<void>(() => {}));
    const { result } = renderHook(() => useLogin());

    act(() => {
      void result.current.signInGoogle();
    });
    expect(result.current.pending).toBe('google');

    act(() => {
      const ev = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(ev, 'persisted', { value: false });
      window.dispatchEvent(ev);
    });
    expect(result.current.pending).toBe('google');
  });
});

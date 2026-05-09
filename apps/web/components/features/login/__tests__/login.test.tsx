import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import messages from '@/messages/pt-BR.json';
import { Login } from '../login';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));

describe('<Login />', () => {
  function setup() {
    return render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <Login />
      </NextIntlClientProvider>,
    );
  }

  it('renderiza headline (desktop hero + mobile mini-hero), subtítulo e botões OAuth', () => {
    setup();
    // Headline e subtítulo aparecem 2x: hero desktop + mini-hero mobile
    expect(screen.getAllByText(messages.login.headline)).toHaveLength(2);
    expect(screen.getAllByText(messages.login.subtitle)).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Continuar com Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com GitHub/i })).toBeInTheDocument();
  });

  it('botões NÃO ficam disabled (sempre clicáveis pra evitar lock fantasma)', () => {
    setup();
    const google = screen.getByRole('button', { name: /Continuar com Google/i });
    const github = screen.getByRole('button', { name: /Continuar com GitHub/i });
    expect(google).not.toBeDisabled();
    expect(github).not.toBeDisabled();
  });

  it('não renderiza pontos removidos (request_access, features-row, meta-rail)', () => {
    setup();
    expect(screen.queryByText(/Solicitar acesso/i)).toBeNull();
    expect(screen.queryByText('NF-e modelo 55')).toBeNull();
    expect(screen.queryByText('Boletos')).toBeNull();
    expect(screen.queryByText(/Sistema operacional/i)).toBeNull();
  });
});

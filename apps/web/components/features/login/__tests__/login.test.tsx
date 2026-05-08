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

  it('renderiza headline e dois botões OAuth', () => {
    setup();
    expect(screen.getByRole('button', { name: /Continuar com Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com GitHub/i })).toBeInTheDocument();
  });

  it('renderiza features (NF-e, NFS-e, Boletos)', () => {
    setup();
    expect(screen.getByText('NF-e modelo 55')).toBeInTheDocument();
    expect(screen.getByText('NFS-e municipal')).toBeInTheDocument();
    expect(screen.getByText('Boletos')).toBeInTheDocument();
  });
});

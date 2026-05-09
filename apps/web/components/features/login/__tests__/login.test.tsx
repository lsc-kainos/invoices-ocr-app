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

  it('renderiza headline, subtítulo e dois botões OAuth', () => {
    setup();
    expect(screen.getByText(messages.login.headline)).toBeInTheDocument();
    expect(screen.getByText(messages.login.subtitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com GitHub/i })).toBeInTheDocument();
  });

  it('cascata teatral: headline (zoom), subtítulo (slide), botões (último)', () => {
    setup();
    const headline = screen.getByText(messages.login.headline);
    const subtitle = screen.getByText(messages.login.subtitle);
    // Headline "nasce" via zoom + fade (não slide)
    expect(headline.className).toMatch(/animate-in/);
    expect(headline.className).toMatch(/zoom-in-95/);
    expect(headline.className).toMatch(/delay-300/);
    expect(headline.className).toMatch(/duration-1000/);
    // Subtítulo entra deslizando depois
    expect(subtitle.className).toMatch(/slide-in-from-bottom/);
    expect(subtitle.className).toMatch(/delay-\[900ms\]/);
    // Botões surgem por último (CTA)
    const googleBtn = screen.getByRole('button', { name: /Continuar com Google/i });
    const buttonGroup = googleBtn.parentElement!;
    expect(buttonGroup.className).toMatch(/animate-in/);
    expect(buttonGroup.className).toMatch(/delay-\[2000ms\]/);
  });

  it('não renderiza pontos removidos (request_access, features-row, meta-rail)', () => {
    setup();
    expect(screen.queryByText(/Solicitar acesso/i)).toBeNull();
    expect(screen.queryByText('NF-e modelo 55')).toBeNull();
    expect(screen.queryByText('Boletos')).toBeNull();
    expect(screen.queryByText(/Sistema operacional/i)).toBeNull();
  });
});

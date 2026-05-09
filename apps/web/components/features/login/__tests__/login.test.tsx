import { render, screen, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, afterEach } from 'vitest';
import messages from '@/messages/pt-BR.json';
import { Login } from '../login';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));

describe('<Login />', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
    // Subtítulo do hero entra deslizando depois
    expect(subtitle.className).toMatch(/slide-in-from-bottom/);
    expect(subtitle.className).toMatch(/delay-\[900ms\]/);
    // Botões surgem por último com delays mobile + desktop responsivos
    const googleBtn = screen.getByRole('button', {
      name: /Continuar com Google/i,
    });
    const buttonGroup = googleBtn.parentElement!;
    expect(buttonGroup.className).toMatch(/animate-in/);
    expect(buttonGroup.className).toMatch(/delay-700/);
    expect(buttonGroup.className).toMatch(/lg:delay-\[2200ms\]/);
  });

  it('inicia em hero-full e transita para split após 1500ms', () => {
    vi.useFakeTimers();
    const { container } = setup();
    const root = container.firstChild as HTMLElement;
    expect(root.dataset.phase).toBe('hero-full');
    expect(root.className).toMatch(/lg:grid-cols-\[1fr_0fr\]/);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(root.dataset.phase).toBe('split');
    expect(root.className).toMatch(/lg:grid-cols-\[1fr_1fr\]/);
  });

  it('não renderiza pontos removidos (request_access, features-row, meta-rail)', () => {
    setup();
    expect(screen.queryByText(/Solicitar acesso/i)).toBeNull();
    expect(screen.queryByText('NF-e modelo 55')).toBeNull();
    expect(screen.queryByText('Boletos')).toBeNull();
    expect(screen.queryByText(/Sistema operacional/i)).toBeNull();
  });
});

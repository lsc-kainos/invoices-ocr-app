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

  it('renderiza headline (desktop + mobile mini-hero), subtítulo e botões OAuth', () => {
    setup();
    // Headline e subtítulo aparecem 2x: hero desktop (lg) + mini-hero mobile
    expect(screen.getAllByText(messages.login.headline)).toHaveLength(2);
    expect(screen.getAllByText(messages.login.subtitle)).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Continuar com Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com GitHub/i })).toBeInTheDocument();
  });

  it('cascata teatral desktop: headline zoom (delay-300), subtítulo (delay-[900ms]), botões (delay-[2200ms])', () => {
    setup();
    const headlines = screen.getAllByText(messages.login.headline);
    const desktopHeadline = headlines.find((h) => h.className.includes('delay-300'))!;
    expect(desktopHeadline.className).toMatch(/animate-in/);
    expect(desktopHeadline.className).toMatch(/zoom-in-95/);
    expect(desktopHeadline.className).toMatch(/duration-1000/);

    const subtitles = screen.getAllByText(messages.login.subtitle);
    const desktopSubtitle = subtitles.find((s) => s.className.includes('delay-[900ms]'))!;
    expect(desktopSubtitle.className).toMatch(/slide-in-from-bottom/);

    const googleBtn = screen.getByRole('button', {
      name: /Continuar com Google/i,
    });
    const buttonGroup = googleBtn.parentElement!;
    expect(buttonGroup.className).toMatch(/animate-in/);
    expect(buttonGroup.className).toMatch(/delay-700/);
    expect(buttonGroup.className).toMatch(/lg:delay-\[2200ms\]/);
  });

  it('mobile mini-hero: headline com delay-150 (text-2xl), subtítulo com delay-300 (text-sm)', () => {
    setup();
    const headlines = screen.getAllByText(messages.login.headline);
    const mobileHeadline = headlines.find((h) => h.className.includes('delay-150'))!;
    expect(mobileHeadline).toBeDefined();
    expect(mobileHeadline.className).toMatch(/zoom-in-95/);
    expect(mobileHeadline.className).toMatch(/text-2xl/);

    const subtitles = screen.getAllByText(messages.login.subtitle);
    const mobileSubtitle = subtitles.find(
      (s) => s.className.includes('delay-300') && s.className.includes('text-sm'),
    )!;
    expect(mobileSubtitle).toBeDefined();
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

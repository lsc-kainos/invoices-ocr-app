import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import messages from '@/messages/pt-BR.json';
import { Login } from '../login';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));
vi.mock('next-auth/react', () => ({
  getCsrfToken: vi.fn(async () => 'csrf-stub'),
}));

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
    expect(screen.getAllByText(messages.login.headline)).toHaveLength(2);
    expect(screen.getAllByText(messages.login.subtitle)).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Continuar com Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar com GitHub/i })).toBeInTheDocument();
  });

  it('cada botão está dentro de form POST pra /api/auth/signin/{provider}', () => {
    const { container } = setup();
    const forms = container.querySelectorAll('form');
    expect(forms).toHaveLength(2);
    const actions = Array.from(forms).map((f) => f.getAttribute('action'));
    expect(actions).toContain('/api/auth/signin/google');
    expect(actions).toContain('/api/auth/signin/github');
    for (const f of Array.from(forms)) {
      expect(f.getAttribute('method')?.toUpperCase()).toBe('POST');
    }
  });

  it('forms têm hidden inputs csrfToken e callbackUrl=/', () => {
    const { container } = setup();
    const forms = container.querySelectorAll('form');
    for (const f of Array.from(forms)) {
      const callback = f.querySelector('input[name="callbackUrl"]') as HTMLInputElement;
      const csrf = f.querySelector('input[name="csrfToken"]') as HTMLInputElement;
      expect(callback?.value).toBe('/');
      // csrf é populado por useEffect; pode estar vazio na 1ª render
      expect(csrf).toBeInTheDocument();
    }
  });

  it('botões são type=submit (não onClick — evita lock fantasma)', () => {
    setup();
    const google = screen.getByRole('button', { name: /Continuar com Google/i });
    const github = screen.getByRole('button', { name: /Continuar com GitHub/i });
    expect(google.getAttribute('type')).toBe('submit');
    expect(github.getAttribute('type')).toBe('submit');
  });

  it('não renderiza pontos removidos (request_access, features-row, meta-rail)', () => {
    setup();
    expect(screen.queryByText(/Solicitar acesso/i)).toBeNull();
    expect(screen.queryByText('NF-e modelo 55')).toBeNull();
    expect(screen.queryByText('Boletos')).toBeNull();
    expect(screen.queryByText(/Sistema operacional/i)).toBeNull();
  });
});

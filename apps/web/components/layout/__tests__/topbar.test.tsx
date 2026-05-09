import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import { Topbar } from '../topbar';

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

const user = {
  id: 'u',
  name: 'L',
  email: 'l@x.com',
  image: null,
  role: 'USER' as const,
};

function renderTopbar() {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <Topbar user={user} />
    </NextIntlClientProvider>,
  );
}

describe('<Topbar />', () => {
  it('renderiza o wordmark Invoices', () => {
    renderTopbar();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  it('Desktop nav: Início, Chat e Minhas notas são links ativos', () => {
    renderTopbar();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(within(nav).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: 'Minhas notas' })).toHaveAttribute(
      'href',
      '/documents',
    );
  });

  it('Minhas notas é link ativo apontando para /documents', () => {
    renderTopbar();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(within(nav).getByRole('link', { name: 'Minhas notas' })).toHaveAttribute(
      'href',
      '/documents',
    );
  });

  it('Chat agora é link ativo apontando para /chat', () => {
    renderTopbar();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(within(nav).getByRole('link', { name: 'Chat' })).toHaveAttribute('href', '/chat');
  });

  it('Desktop nav só aparece em lg+ (hidden lg:flex)', () => {
    renderTopbar();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(nav.className).toMatch(/hidden/);
    expect(nav.className).toMatch(/lg:flex/);
  });

  it('Mobile hamburger trigger existe (lg:hidden) com aria-label', () => {
    renderTopbar();
    const trigger = screen.getByRole('button', {
      name: messages.topbar.nav.menu_label,
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toMatch(/lg:hidden/);
  });

  it('NÃO renderiza search nem workspace switcher (simplificado)', () => {
    renderTopbar();
    expect(screen.queryByPlaceholderText(/Buscar/i)).toBeNull();
    expect(screen.queryByText('Pessoal')).toBeNull();
  });

  it('renderiza UserMenu trigger com aria-label', () => {
    renderTopbar();
    expect(
      screen.getByRole('button', { name: messages.topbar.user_menu_label }),
    ).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import messages from '@/messages/pt-BR.json';
import { UserMenu } from '../user-menu';

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

describe('<UserMenu />', () => {
  it('mostra nome+email no dropdown e item Sair', async () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <UserMenu user={{ name: 'L', email: 'l@x.com', image: null }} />
      </NextIntlClientProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: messages.topbar.user_menu_label }));
    expect(screen.getByText('l@x.com')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument();
  });

  it('NÃO mostra mais seção de admin para role ADMIN (movida para topbar)', async () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <UserMenu user={{ name: 'L', email: 'l@x.com', image: null, role: 'ADMIN' }} />
      </NextIntlClientProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: messages.topbar.user_menu_label }));
    expect(screen.queryByRole('menuitem', { name: /Área Admin/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /Admin/i })).toBeNull();
  });
});

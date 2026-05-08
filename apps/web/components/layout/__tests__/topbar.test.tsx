import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/pt-BR.json';
import { Topbar } from '../topbar';

function renderTopbar() {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <Topbar />
    </NextIntlClientProvider>,
  );
}

describe('<Topbar />', () => {
  it('renderiza o wordmark Invoices', () => {
    renderTopbar();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  it('mostra os 3 itens de nav todos com aria-disabled e pointer-events bloqueados', () => {
    renderTopbar();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    const labels = ['Início', 'Minhas notas', 'Chat'];
    for (const label of labels) {
      const item = within(nav).getByText(label);
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item.className).toMatch(/pointer-events-none/);
    }
  });

  it('renderiza o input de busca como disabled e readOnly', () => {
    renderTopbar();
    const input = screen.getByPlaceholderText(/Buscar/i) as HTMLInputElement;
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('readonly');
  });

  it('renderiza o avatar do usuário como placeholder com "?" e sem dropdown', () => {
    renderTopbar();
    const avatarLabel = screen.getByLabelText(messages.topbar.user_menu_label);
    expect(avatarLabel).toHaveAttribute('aria-disabled', 'true');
    expect(within(avatarLabel).getByText('?')).toBeInTheDocument();
  });
});

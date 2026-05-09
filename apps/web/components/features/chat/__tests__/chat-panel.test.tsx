import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import { ChatPanel } from '../chat-panel';

function renderPanel(props: Partial<React.ComponentProps<typeof ChatPanel>> = {}) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <ChatPanel
        messages={[]}
        loading={false}
        onSend={vi.fn()}
        suggestions={['sugestão 1']}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('<ChatPanel />', () => {
  it('renderiza empty state quando não há mensagens', () => {
    renderPanel();
    expect(screen.getByText(messages.chat.empty_state_title)).toBeInTheDocument();
  });

  it('renderiza mensagens quando há lista', () => {
    renderPanel({
      messages: [{ id: '1', role: 'USER', content: 'Olá', createdAt: '2026-05-09' }],
    });
    expect(screen.getByText('Olá')).toBeInTheDocument();
  });

  it('tem input de texto', () => {
    renderPanel();
    expect(document.querySelector('textarea, input[type="text"]')).toBeInTheDocument();
  });
});

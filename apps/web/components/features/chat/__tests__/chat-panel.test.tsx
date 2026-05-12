import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('não força scroll automático quando o usuário está lendo mensagens antigas', () => {
    const scrollTo = vi.fn();
    const { rerender } = renderPanel({
      messages: [{ id: '1', role: 'USER', content: 'Mensagem antiga', createdAt: '2026-05-09' }],
    });
    const scrollContainer = screen.getByTestId('chat-messages-scroll');

    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, value: 1200 },
      scrollTop: { configurable: true, value: 100, writable: true },
      scrollTo: { configurable: true, value: scrollTo },
    });

    fireEvent.scroll(scrollContainer);
    scrollTo.mockClear();

    rerender(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <ChatPanel
          messages={[
            { id: '1', role: 'USER', content: 'Mensagem antiga', createdAt: '2026-05-09' },
            { id: '2', role: 'ASSISTANT', content: 'Nova resposta', createdAt: '2026-05-09' },
          ]}
          loading={false}
          onSend={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

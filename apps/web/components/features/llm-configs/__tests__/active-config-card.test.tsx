import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import type { LlmConfigDto } from '@invoices-ocr/shared-types';
import messages from '@/messages/pt-BR.json';
import { ActiveConfigCard } from '../active-config-card';

const BASE: LlmConfigDto = {
  id: 'cfg-active',
  key: 'EXTRACTOR',
  version: 12,
  model: 'gpt-4o',
  prompt: 'Prompt rendered into the card pre.',
  params: { temperature: 0.2 },
  active: true,
  notes: null,
  createdAt: '2026-05-01T12:34:56.000Z',
  createdBy: 'user-1',
  createdByEmail: 'admin@paggo.test',
};

function setup(config: LlmConfigDto | undefined) {
  const onCloneFromActive = vi.fn();
  const onTest = vi.fn();
  const onCreateFirst = vi.fn();
  render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <ActiveConfigCard
        config={config}
        configKey="EXTRACTOR"
        onCloneFromActive={onCloneFromActive}
        onTest={onTest}
        onCreateFirst={onCreateFirst}
      />
    </NextIntlClientProvider>,
  );
  return { onCloneFromActive, onTest, onCreateFirst };
}

describe('<ActiveConfigCard />', () => {
  it('renders the prompt body and exposes "Nova versão a partir desta" + "Testar"', () => {
    const { onCloneFromActive, onTest } = setup(BASE);

    // Prompt body is rendered
    const pre = screen.getByTestId('active-prompt');
    expect(pre.textContent).toContain('Prompt rendered into the card pre.');

    // Version badge / metadata
    expect(screen.getByText(/v12/)).toBeInTheDocument();
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    expect(screen.getByText(/admin@paggo.test/)).toBeInTheDocument();

    // Action buttons
    fireEvent.click(screen.getByRole('button', { name: /Nova versão a partir desta/i }));
    expect(onCloneFromActive).toHaveBeenCalledWith(BASE);

    fireEvent.click(screen.getByRole('button', { name: /Testar/i }));
    expect(onTest).toHaveBeenCalledWith(BASE);
  });

  it('renders empty state with CTA when no active config', () => {
    const { onCreateFirst } = setup(undefined);

    expect(screen.queryByTestId('active-config-card')).toBeNull();
    expect(screen.getByText(/Sem versão ativa para EXTRACTOR/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Criar primeira versão/i }));
    expect(onCreateFirst).toHaveBeenCalledWith('EXTRACTOR');
  });
});

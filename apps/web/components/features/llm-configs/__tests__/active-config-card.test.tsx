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

describe('<ActiveConfigCard /> (brutalist)', () => {
  it('renders the prompt body, version manchete, and exposes Fork + Test', () => {
    const { onCloneFromActive, onTest } = setup(BASE);

    // Prompt body is rendered
    const pre = screen.getByTestId('active-prompt');
    expect(pre.textContent).toContain('Prompt rendered into the card pre.');

    // Brutalist version display (V12.) + metadata strip (v12)
    expect(screen.getByTestId('active-version').textContent).toBe('V12.');
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    // creator email surfaces inside the BY. {who} pattern
    expect(screen.getByText(/admin@paggo.test/)).toBeInTheDocument();

    // Action buttons — selected by testid to remain resilient to copy/case changes
    fireEvent.click(screen.getByTestId('active-fork'));
    expect(onCloneFromActive).toHaveBeenCalledWith(BASE);

    fireEvent.click(screen.getByTestId('active-test'));
    expect(onTest).toHaveBeenCalledWith(BASE);
  });

  it('renders empty state with CTA when no active config', () => {
    const { onCreateFirst } = setup(undefined);

    // Active card not in DOM, but empty container is
    expect(screen.queryByTestId('active-config-card')).toBeNull();
    expect(screen.getByTestId('active-config-empty')).toBeInTheDocument();
    expect(screen.getByText(/Sem versão ativa para EXTRACTOR/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('active-create-first'));
    expect(onCreateFirst).toHaveBeenCalledWith('EXTRACTOR');
  });

  it('does NOT decorate hover with blurred shadows — uses shadow-brutal utility', () => {
    setup(BASE);
    const card = screen.getByTestId('active-config-card');
    // Sanity check that brutalist shadow utility is present (no blur, hard offset)
    expect(card.className).toMatch(/shadow-brutal/);
  });
});

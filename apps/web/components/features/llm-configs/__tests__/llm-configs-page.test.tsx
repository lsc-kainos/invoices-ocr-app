import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AvailableModel, LlmConfigDto } from '@invoices-ocr/shared-types';
import messages from '@/messages/pt-BR.json';
import { LlmConfigsPage } from '../llm-configs-page';

// Stub toast to avoid timer/portal noise.
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const MODELS: AvailableModel[] = [
  { id: 'gpt-4o', provider: 'openai', requires: 'OPENAI_API_KEY', vision: true },
];

function makeConfig(partial: Partial<LlmConfigDto>): LlmConfigDto {
  return {
    id: `cfg-${partial.version ?? 1}`,
    key: 'EXTRACTOR',
    version: 1,
    model: 'gpt-4o',
    prompt: 'P',
    params: { temperature: 0.2 },
    active: false,
    notes: null,
    createdAt: '2026-05-01T12:00:00.000Z',
    createdBy: 'user-1',
    createdByEmail: 'admin@paggo.test',
    ...partial,
  };
}

function installFetchMock(initialConfigs: LlmConfigDto[]) {
  let configs = [...initialConfigs];
  let nextVersion = configs.length === 0 ? 1 : Math.max(...configs.map((c) => c.version)) + 1;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';

    if (url === '/api/admin/llm-configs' && method === 'GET') {
      return new Response(JSON.stringify(configs), { status: 200 });
    }
    if (url === '/api/admin/llm-configs/available-models' && method === 'GET') {
      return new Response(JSON.stringify(MODELS), { status: 200 });
    }
    if (url === '/api/admin/llm-configs' && method === 'POST') {
      const body = JSON.parse((init?.body as string) ?? '{}');
      const created: LlmConfigDto = makeConfig({
        id: `cfg-new-${nextVersion}`,
        version: nextVersion,
        key: body.key,
        model: body.model,
        prompt: body.prompt,
        params: body.params,
        active: false,
        notes: body.notes ?? null,
      });
      configs = [...configs, created];
      nextVersion += 1;
      return new Response(JSON.stringify(created), { status: 200 });
    }
    return new Response('not handled', { status: 500 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <LlmConfigsPage />
    </NextIntlClientProvider>,
  );
}

describe('<LlmConfigsPage /> (brutalist)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows active card with prompt + history rows below it', async () => {
    installFetchMock([
      makeConfig({ id: 'cfg-1', version: 1, active: false, prompt: 'old prompt' }),
      makeConfig({ id: 'cfg-2', version: 2, active: true, prompt: 'ACTIVE PROMPT' }),
    ]);

    renderPage();

    // Active card appears with the active prompt
    await waitFor(() => {
      expect(screen.getByTestId('active-prompt').textContent).toContain('ACTIVE PROMPT');
    });

    // History contains the older non-active version, NOT the active one
    expect(screen.getByTestId('history-row-cfg-1')).toBeInTheDocument();
    expect(screen.queryByTestId('history-row-cfg-2')).toBeNull();
  });

  it('after creating a new version, it appears in the history list', async () => {
    installFetchMock([makeConfig({ id: 'cfg-1', version: 1, active: true, prompt: 'base' })]);

    renderPage();

    // Wait for active card
    await waitFor(() => {
      expect(screen.getByTestId('active-prompt')).toBeInTheDocument();
    });

    // Click FORK (was "Nova versão a partir desta") via testid — resilient to copy
    fireEvent.click(screen.getByTestId('active-fork'));

    // Submit the editor (pre-populated fields). Submit button has aria-label="Criar"
    // (keeps backwards-compat for /Criar/i regex selectors).
    const submit = await screen.findByRole('button', { name: /Criar/i });
    fireEvent.click(submit);

    // New row v2 should appear in history (active stays as v1 until activated)
    await waitFor(() => {
      const row = screen.queryByTestId('history-row-cfg-new-2');
      expect(row).not.toBeNull();
    });
    const row = screen.getByTestId('history-row-cfg-new-2');
    expect(within(row).getByText(/v2/)).toBeInTheDocument();
  });

  it('renders tabs as brutalist buttons (EXTRACTOR active by default)', async () => {
    installFetchMock([makeConfig({ id: 'cfg-1', version: 1, active: true })]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('tab-EXTRACTOR')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('tab-CHAT')).toHaveAttribute('aria-selected', 'false');
    });

    fireEvent.click(screen.getByTestId('tab-CHAT'));
    expect(screen.getByTestId('tab-CHAT')).toHaveAttribute('aria-selected', 'true');
  });
});

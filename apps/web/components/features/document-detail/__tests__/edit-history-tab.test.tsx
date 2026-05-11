import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import messages from '@/messages/pt-BR.json';
import { EditHistoryTab } from '../edit-history-tab';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function withIntl(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('<EditHistoryTab />', () => {
  it('renderiza empty state quando não há edições', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    render(withIntl(<EditHistoryTab documentId="d1" verifiedAt={null} />));

    await waitFor(() => {
      expect(screen.getByText('Nenhuma edição manual registrada.')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/documents/d1/edits');
  });

  it('renderiza loading state inicialmente', () => {
    // Promise pendente — fica em loading.
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    render(withIntl(<EditHistoryTab documentId="d1" verifiedAt={null} />));
    expect(screen.getByText('Carregando edições…')).toBeInTheDocument();
  });

  it('renderiza diff de campos entre before e after', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: 'e1',
            createdAt: '2026-05-11T03:14:00.000Z',
            editor: { name: 'Alice Silva', email: 'alice@paggo.test' },
            before: {
              core: { total: '100,00', invoiceNumber: 'NF-1' },
              narrative: 'original',
            },
            after: {
              core: { total: '110,00', invoiceNumber: 'NF-1' },
              narrative: 'updated',
            },
          },
          {
            id: 'e2',
            createdAt: '2026-05-10T20:00:00.000Z',
            editor: { name: null, email: 'bob@paggo.test' },
            before: { core: { total: '90,00' } },
            after: { core: { total: '100,00' } },
          },
        ]),
        { status: 200 },
      ),
    );

    render(withIntl(<EditHistoryTab documentId="d1" verifiedAt={null} />));

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    // Editor 2 falls back to email when name is null
    expect(screen.getByText('bob@paggo.test')).toBeInTheDocument();

    // Edit 1: detecta os campos que mudaram (total e narrative) — não mostra invoiceNumber (igual)
    // core.total aparece em ambas as edições (2 nós), narrative só na primeira
    expect(screen.getAllByText('core.total').length).toBe(2);
    expect(screen.getByText('narrative')).toBeInTheDocument();
    expect(screen.queryByText('core.invoiceNumber')).toBeNull();

    // Valores antes/depois aparecem (100,00 aparece tanto como 'after' do edit 2 quanto 'before' do edit 1)
    expect(screen.getAllByText('100,00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('110,00')).toBeInTheDocument();
    expect(screen.getByText('original')).toBeInTheDocument();
    expect(screen.getByText('updated')).toBeInTheDocument();

    // Labels antes/depois (use getAllByText pois aparece múltiplas vezes)
    expect(screen.getAllByText(/— antes:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/— depois:/).length).toBeGreaterThan(0);
  });

  it('mostra mensagem de erro se a request falhar', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));
    render(withIntl(<EditHistoryTab documentId="d1" verifiedAt={null} />));

    await waitFor(() => {
      expect(screen.getByText('Não foi possível carregar o histórico.')).toBeInTheDocument();
    });
  });
});

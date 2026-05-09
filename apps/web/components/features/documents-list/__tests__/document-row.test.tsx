import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import { DocumentRow } from '../document-row';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));
vi.mock('../../document-download/use-document-download', () => ({
  useDocumentDownload: () => ({ download: vi.fn(), isPending: () => false }),
}));

const doc = {
  id: 'd1',
  filename: 'nf.pdf',
  status: 'READY' as const,
  mime: 'application/pdf',
  size: 100,
  summary: null,
  failureReason: null,
  retryCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('<DocumentRow />', () => {
  it('click na linha → push para detalhe', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <DocumentRow doc={doc} />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByText('nf.pdf'));
    expect(push).toHaveBeenCalledWith('/documents/d1');
  });

  it('click no botão NÃO push para detalhe', () => {
    push.mockClear();
    render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <DocumentRow doc={doc} />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Download/i }));
    expect(push).not.toHaveBeenCalled();
  });
});

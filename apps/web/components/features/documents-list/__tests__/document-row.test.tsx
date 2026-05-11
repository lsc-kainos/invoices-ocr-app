import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import { DocumentRow } from '../document-row';

// Next/navigation mock not needed anymore for DocumentRow
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
  documentType: null,
  confidence: null,
  rejectionReason: null,
  verifiedAt: null,
  verifiedBy: null,
};

describe('<DocumentRow />', () => {
  it('renderiza um link para o detalhe do documento', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <DocumentRow doc={doc} />
      </NextIntlClientProvider>,
    );
    const link = screen.getByRole('link', { name: doc.filename });
    expect(link).toHaveAttribute('href', `/documents/${doc.id}`);
  });

  it('renderiza botão de download separado do link', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <DocumentRow doc={doc} />
      </NextIntlClientProvider>,
    );
    // Download button exists and is not inside the navigation link
    const link = screen.getByRole('link', { name: doc.filename });
    const downloadBtn = screen.getByRole('button', { name: /Download/i });
    expect(downloadBtn).not.toBeNull();
    // Download button should NOT be a descendant of the link
    expect(link.contains(downloadBtn)).toBe(false);
  });
});

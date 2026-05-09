import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { UploadCard } from '../upload-card';
import messages from '../../../../messages/pt-BR.json';

const retryMock = vi.fn();
vi.mock('../use-document-retry', () => ({
  useDocumentRetry: () => ({ retry: retryMock, isPending: () => false }),
}));

const wrap = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="pt-BR" messages={messages}>
    {ui}
  </NextIntlClientProvider>
);

const baseDoc = {
  id: 'd1',
  filename: 'nf.pdf',
  mime: 'application/pdf',
  size: 1024,
  status: 'FAILED' as const,
  summary: null,
  failureReason: 'parse_failure' as const,
  retryCount: 1,
  createdAt: '',
  updatedAt: '',
};

describe('UploadCard — retry button', () => {
  it('FAILED renderiza botão "Tentar de novo" e chama retry no clique', async () => {
    render(wrap(<UploadCard doc={baseDoc} />));
    const btn = screen.getByRole('button', { name: /tentar de novo/i });
    await userEvent.click(btn);
    expect(retryMock).toHaveBeenCalledWith('d1', 'nf.pdf');
  });

  it('OCR_RUNNING + retryCount>0 mostra "Tentando de novo automaticamente"', () => {
    render(
      wrap(
        <UploadCard
          doc={{ ...baseDoc, status: 'OCR_RUNNING', retryCount: 1, failureReason: null }}
        />,
      ),
    );
    expect(screen.getByText(/tentando de novo automaticamente/i)).toBeInTheDocument();
  });

  it('OCR_RUNNING substitui progress numérico por status spinner', () => {
    const { container } = render(
      wrap(
        <UploadCard
          doc={{ ...baseDoc, status: 'OCR_RUNNING', retryCount: 0, failureReason: null }}
        />,
      ),
    );
    expect(container.querySelector('[data-testid="ocr-spinner"]')).toBeInTheDocument();
  });
});

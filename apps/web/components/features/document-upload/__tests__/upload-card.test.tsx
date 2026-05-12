import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { UploadCard } from '../upload-card';
import { useDocumentRetry } from '../use-document-retry';
import messages from '../../../../messages/pt-BR.json';

const retryMock = vi.fn();
vi.mock('../use-document-retry');

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
  duplicateOfId: null,
  duplicateReason: null,
  possibleDuplicateOfId: null,
  duplicateMatchStrength: null,
  documentType: null,
  confidence: null,
  rejectionReason: null,
  verifiedAt: null,
  verifiedBy: null,
  createdAt: '',
  updatedAt: '',
};

describe('UploadCard — retry button', () => {
  beforeEach(() => {
    vi.mocked(useDocumentRetry).mockReturnValue({ retry: retryMock, isPending: () => false });
  });

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

  it('isPending desativa o botão e mostra "Reenviando…"', async () => {
    vi.mocked(useDocumentRetry).mockReturnValueOnce({
      retry: retryMock,
      isPending: (id) => id === 'd1',
    });
    render(wrap(<UploadCard doc={baseDoc} />));
    const btn = screen.getByRole('button', { name: /reenviando/i });
    expect(btn).toBeDisabled();
  });

  it('botão de retry desabilitado captura pointer-events (não vaza pro link sobreposto)', () => {
    vi.mocked(useDocumentRetry).mockReturnValueOnce({
      retry: retryMock,
      isPending: (id) => id === 'd1',
    });
    render(wrap(<UploadCard doc={baseDoc} />));
    const btn = screen.getByRole('button', { name: /reenviando/i });
    expect(btn).toBeDisabled();
    // Garante que o clique no botão disabled continua sendo capturado por ele
    // (e não passa pro Link sobreposto via stretched-link). O shadcn Button base
    // aplica disabled:pointer-events-none — sobrescrevemos com disabled:pointer-events-auto.
    expect(btn.className).toMatch(/disabled:pointer-events-auto/);
    expect(btn.className).toMatch(/disabled:cursor-not-allowed/);
  });

  it('FAILED sem failureReason não renderiza botão de retry', () => {
    render(wrap(<UploadCard doc={{ ...baseDoc, failureReason: null }} />));
    expect(screen.queryByRole('button', { name: /tentar de novo/i })).not.toBeInTheDocument();
  });
});

describe('UploadCard — link de detalhe', () => {
  beforeEach(() => {
    vi.mocked(useDocumentRetry).mockReturnValue({ retry: retryMock, isPending: () => false });
    retryMock.mockReset();
  });

  it('READY renderiza link para /documents/{id}', () => {
    render(wrap(<UploadCard doc={{ ...baseDoc, status: 'READY', failureReason: null }} />));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/documents/d1');
  });

  it('FAILED renderiza link para /documents/{id}', () => {
    render(wrap(<UploadCard doc={baseDoc} />));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/documents/d1');
  });

  it('REJECTED renderiza link para /documents/{id}', () => {
    render(
      wrap(
        <UploadCard
          doc={{
            ...baseDoc,
            status: 'REJECTED',
            failureReason: null,
            rejectionReason: 'not_invoice',
          }}
        />,
      ),
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/documents/d1');
  });

  it('QUEUED não renderiza link', () => {
    render(
      wrap(
        <UploadCard doc={{ ...baseDoc, status: 'QUEUED', failureReason: null, retryCount: 0 }} />,
      ),
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('OCR_RUNNING não renderiza link', () => {
    render(
      wrap(
        <UploadCard
          doc={{ ...baseDoc, status: 'OCR_RUNNING', failureReason: null, retryCount: 0 }}
        />,
      ),
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('botão de retry em FAILED tem stopPropagation (não dispara navegação)', async () => {
    const user = userEvent.setup();
    const navHandler = vi.fn();
    render(<div onClick={navHandler}>{wrap(<UploadCard doc={baseDoc} />)}</div>);
    const btn = screen.getByRole('button', { name: /tentar de novo/i });
    await user.click(btn);
    expect(retryMock).toHaveBeenCalledWith('d1', 'nf.pdf');
    expect(navHandler).not.toHaveBeenCalled();
  });
});

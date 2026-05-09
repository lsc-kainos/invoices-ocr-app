import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';
import messages from '@/messages/pt-BR.json';
import { DownloadButton } from '../download-button';

vi.mock('../use-document-download', () => ({
  useDocumentDownload: () => ({ download: vi.fn(), isPending: () => false }),
}));

const wrap = (ui: React.ReactNode) => (
  <TooltipProvider>
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  </TooltipProvider>
);

describe('<DownloadButton />', () => {
  it('disabled quando status !== READY', () => {
    render(wrap(<DownloadButton documentId="d1" filename="a.pdf" status="QUEUED" />));
    expect(screen.getByRole('button', { name: /Download/i })).toBeDisabled();
  });
  it('habilitado quando READY', () => {
    render(wrap(<DownloadButton documentId="d1" filename="a.pdf" status="READY" />));
    expect(screen.getByRole('button', { name: /Download/i })).not.toBeDisabled();
  });
  it('e.stopPropagation no click — smoke test', () => {
    render(wrap(<DownloadButton documentId="d1" filename="a.pdf" status="READY" />));
    const btn = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(btn);
    // smoke: no throw
  });
});

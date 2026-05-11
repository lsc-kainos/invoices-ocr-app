import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { DocumentSummary, InvoiceSummary } from '@invoices-ocr/shared-types';
import messages from '@/messages/pt-BR.json';
import { buildDocumentsSummary, DocumentsSummaryCard } from '../documents-summary-card';

function makeSummary(total: string | null, invoiceDate: string | null): InvoiceSummary {
  return {
    core: {
      invoiceNumber: null,
      invoiceDate,
      dueDate: null,
      sellerName: null,
      sellerAddress: null,
      clientName: null,
      clientAddress: null,
      tax: null,
      discount: null,
      total,
      paymentMethod: null,
    },
    items: [],
    extras: [],
    narrative: '',
  };
}

function makeDoc(id: string, total: string | null, invoiceDate: string | null): DocumentSummary {
  return {
    id,
    filename: `${id}.pdf`,
    status: 'READY',
    mime: 'application/pdf',
    size: 100,
    summary: makeSummary(total, invoiceDate),
    failureReason: null,
    retryCount: 0,
    contentHash: null,
    duplicateOfId: null,
    duplicateReason: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    documentType: null,
    confidence: null,
    rejectionReason: null,
    verifiedAt: null,
    verifiedBy: null,
  };
}

const wrap = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="pt-BR" messages={messages}>
    {ui}
  </NextIntlClientProvider>
);

describe('<DocumentsSummaryCard />', () => {
  it('agrupa os totais por mês e normaliza formatos de moeda comuns', () => {
    const buckets = buildDocumentsSummary([
      makeDoc('brl', 'R$ 1.234,50', '2026-04-10'),
      makeDoc('decimal', '100,00', '10/04/2026'),
      makeDoc('usd', '$ 1,234.50', '2026-05-01'),
      makeDoc('thousand', '1.234', '2026-05-15'),
    ]);

    expect(buckets).toHaveLength(12);
    expect(buckets.find((bucket) => bucket.key === '2026-04')).toMatchObject({
      total: 1334.5,
      count: 2,
    });
    expect(buckets.find((bucket) => bucket.key === '2026-05')).toMatchObject({
      total: 2468.5,
      count: 2,
    });
  });

  it('renderiza total, gráfico e métricas do período', () => {
    render(
      wrap(
        <DocumentsSummaryCard
          docs={[
            makeDoc('jan', 'R$ 1.000,00', '2026-01-05'),
            makeDoc('fev', 'R$ 2.000,00', '2026-02-05'),
          ]}
        />,
      ),
    );

    expect(screen.getByText('Valores por mês')).toBeVisible();
    expect(screen.getByText('R$ 3.000,00')).toBeVisible();
    expect(screen.getByRole('img', { name: /gráfico de barras/i })).toBeVisible();
    expect(screen.getByText('Notas somadas')).toBeVisible();
    expect(screen.getAllByText('2')).toHaveLength(2);
  });
});

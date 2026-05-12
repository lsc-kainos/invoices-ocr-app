import { DocumentSemanticDuplicateService } from './document-semantic-duplicate.service';
import type { InvoiceSummaryResult } from '../ocr/schemas/invoice-summary.schema';

function result(
  over: Partial<InvoiceSummaryResult> = {},
): InvoiceSummaryResult {
  return {
    documentType: 'nf-e',
    confidence: 0.95,
    summary: {
      core: {
        accessKey: null,
        invoiceNumber: null,
        invoiceDate: null,
        dueDate: null,
        sellerName: null,
        sellerAddress: null,
        clientName: null,
        clientAddress: null,
        tax: null,
        discount: null,
        total: null,
        paymentMethod: null,
      },
      items: [],
      extras: [],
      narrative: '',
    },
    extractedText: '',
    ...over,
  };
}

describe('DocumentSemanticDuplicateService', () => {
  const svc = new DocumentSemanticDuplicateService();

  it('gera assinatura por chave NF-e no core', () => {
    const signature = svc.computeSignature(
      result({
        summary: {
          ...result().summary,
          core: {
            ...result().summary.core,
            accessKey: '3526 0412 3456 7800 0190 5500 1000 0231 1711 2345 6789',
          },
        },
      }),
    );

    expect(signature).toEqual({
      semanticHash: 'NFKEY:35260412345678000190550010000231171123456789',
      reason: 'nfe_access_key',
      matchStrength: 'strong',
    });
  });

  it('gera assinatura por chave NF-e em extras contextualizados', () => {
    const signature = svc.computeSignature(
      result({
        summary: {
          ...result().summary,
          extras: [
            {
              label: 'Chave de acesso NF-e',
              value: '35260412345678000190550010000231171123456789',
              mono: true,
            },
          ],
        },
      }),
    );

    expect(signature?.semanticHash).toBe(
      'NFKEY:35260412345678000190550010000231171123456789',
    );
  });

  it('ignora sequências de 44 dígitos sem contexto de chave/NF-e', () => {
    const signature = svc.computeSignature(
      result({
        extractedText: 'Protocolo 35260412345678000190550010000231171123456789',
      }),
    );

    expect(signature).toBeNull();
  });

  it('gera assinatura forte DOCID quando há IDs fiscais de emitente e destinatário', () => {
    const signature = svc.computeSignature(
      result({
        documentType: 'invoice',
        summary: {
          ...result().summary,
          core: {
            ...result().summary.core,
            invoiceDate: '2026-05-11',
            sellerName: 'ACME Ltda',
            clientName: 'Kainos Labs',
            total: 'R$ 1.234,56',
          },
          extras: [
            {
              label: 'CNPJ emitente',
              value: '12.345.678/0001-90',
              mono: true,
            },
            {
              label: 'CNPJ destinatario',
              value: '98.765.432/0001-10',
              mono: true,
            },
          ],
        },
      }),
    );

    expect(signature).toEqual({
      semanticHash: expect.stringMatching(/^DOCID:v1:[0-9a-f]{64}$/),
      reason: 'document_identity',
      matchStrength: 'strong',
    });
  });

  it('normaliza moeda, data e IDs fiscais para a mesma assinatura', () => {
    const first = svc.computeSignature(
      result({
        documentType: 'invoice',
        summary: {
          ...result().summary,
          core: {
            ...result().summary.core,
            invoiceDate: '11/05/2026',
            sellerName: 'ACME Ltda',
            clientName: 'Kainos Labs',
            total: 'R$ 1.234,56',
          },
          extras: [
            { label: 'CNPJ emitente', value: '12.345.678/0001-90', mono: true },
            {
              label: 'CNPJ destinatario',
              value: '98.765.432/0001-10',
              mono: true,
            },
          ],
        },
      }),
    );
    const second = svc.computeSignature(
      result({
        documentType: 'invoice',
        summary: {
          ...result().summary,
          core: {
            ...result().summary.core,
            invoiceDate: '2026-05-11',
            sellerName: 'Acme LTDA.',
            clientName: 'Kainos Labs',
            total: '1,234.56',
          },
          extras: [
            { label: 'Issuer tax id', value: '12345678000190', mono: true },
            { label: 'Recipient tax id', value: '98765432000110', mono: true },
          ],
        },
      }),
    );

    expect(first?.semanticHash).toBe(second?.semanticHash);
  });

  it('marca assinatura com nomes livres como needs_confirmation', () => {
    const signature = svc.computeSignature(
      result({
        documentType: 'invoice',
        summary: {
          ...result().summary,
          core: {
            ...result().summary.core,
            invoiceDate: '11/05/2026',
            sellerName: 'Ácme LTDA.',
            clientName: 'Kainos Labs',
            total: '1234,56',
          },
        },
      }),
    );

    expect(signature).toEqual({
      semanticHash: expect.stringMatching(/^DOCID:v1:[0-9a-f]{64}$/),
      reason: 'document_identity',
      matchStrength: 'needs_confirmation',
    });
  });

  it('boleto com linha digitável contextualizada gera assinatura forte', () => {
    const signature = svc.computeSignature(
      result({
        documentType: 'boleto',
        summary: {
          ...result().summary,
          core: {
            ...result().summary.core,
            dueDate: '11/05/2026',
            sellerName: 'Banco Exemplo',
            clientName: 'Kainos Labs',
            total: '250,00',
          },
          extras: [
            {
              label: 'Linha digitável',
              value: '00190.00009 01234.567890 12345.678901 1 12345678901234',
              mono: true,
            },
          ],
        },
      }),
    );

    expect(signature).toEqual({
      semanticHash: expect.stringMatching(/^DOCID:v1:[0-9a-f]{64}$/),
      reason: 'boleto_identifier',
      matchStrength: 'strong',
    });
  });
});

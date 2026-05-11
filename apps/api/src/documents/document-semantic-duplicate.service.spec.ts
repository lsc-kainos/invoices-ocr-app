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
});

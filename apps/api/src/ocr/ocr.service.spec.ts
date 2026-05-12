import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OcrService, DOCUMENT_OPS } from './ocr.service';
import { OCR_PROVIDER } from './providers/ocr-provider.interface';
import { STORAGE_SERVICE } from '../storage/storage.service';
import type { InvoiceSummaryResult } from './schemas/invoice-summary.schema';
import { DocumentSemanticDuplicateService } from '../documents/document-semantic-duplicate.service';

const happy: InvoiceSummaryResult = {
  documentType: 'invoice',
  confidence: 0.9,
  summary: {
    core: {
      invoiceNumber: null,
      accessKey: null,
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
  extractedText: 'hi',
};

describe('OcrService', () => {
  let svc: OcrService;
  let docs: {
    markRunning: jest.Mock;
    markReady: jest.Mock;
    markFailed: jest.Mock;
    markRejected: jest.Mock;
    findReadySemanticDuplicate: jest.Mock;
    markDuplicate: jest.Mock;
    findByIdInternal: jest.Mock;
  };
  let storage: { read: jest.Mock };
  let provider: { extract: jest.Mock };

  beforeEach(async () => {
    docs = {
      markRunning: jest.fn().mockResolvedValue(undefined),
      markReady: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      markRejected: jest.fn().mockResolvedValue(undefined),
      findReadySemanticDuplicate: jest.fn().mockResolvedValue(null),
      markDuplicate: jest.fn().mockResolvedValue(undefined),
      findByIdInternal: jest.fn().mockResolvedValue({
        id: 'd1',
        mime: 'image/jpeg',
        storagePath: 'u/d1/o.jpg',
      }),
    };
    storage = {
      read: jest.fn().mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff])),
    };
    provider = { extract: jest.fn() };
    const mod = await Test.createTestingModule({
      providers: [
        OcrService,
        { provide: DOCUMENT_OPS, useValue: docs },
        { provide: STORAGE_SERVICE, useValue: storage },
        { provide: OCR_PROVIDER, useValue: provider },
        DocumentSemanticDuplicateService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(0.6) },
        },
      ],
    }).compile();
    svc = mod.get(OcrService);
  });

  it('happy: markRunning → extract → markReady', async () => {
    provider.extract.mockResolvedValue(happy);
    await svc.process('d1');
    expect(docs.markRunning).toHaveBeenCalledWith('d1');
    expect(provider.extract).toHaveBeenCalledTimes(1);
    expect(docs.markReady).toHaveBeenCalledWith(
      'd1',
      happy.summary,
      happy.extractedText,
      null,
    );
    expect(docs.markFailed).not.toHaveBeenCalled();
  });

  it('erro transiente → lança para BullMQ retry (sem markFailed interno)', async () => {
    const err: Error & { status?: number } = new Error('rl');
    err.status = 429;
    provider.extract.mockRejectedValue(err);
    await expect(svc.process('d1')).rejects.toThrow('rl');
    expect(docs.markFailed).not.toHaveBeenCalled();
  });

  it('erro não-transiente (ZodError) → FAILED imediato sem retry', async () => {
    const err = new Error('bad');
    (err as { name: string }).name = 'ZodError';
    provider.extract.mockRejectedValue(err);
    await svc.process('d1');
    expect(provider.extract).toHaveBeenCalledTimes(1);
    expect(docs.markFailed).toHaveBeenCalledWith('d1', 'parse_failure');
  });

  it('doc não encontrado → markFailed("unknown")', async () => {
    docs.findByIdInternal.mockResolvedValue(null);
    await svc.process('d1');
    expect(docs.markFailed).toHaveBeenCalledWith('d1', 'unknown');
    expect(provider.extract).not.toHaveBeenCalled();
  });

  // O branch PDF (mime=application/pdf) chama pdfToImage que carrega
  // pdfjs-dist via dynamic import com cleanup async fora do await — gera
  // "import after Jest env torn down" em CI. Cobertura real desse caminho
  // vive no E2E (apps/api/test/documents.e2e-spec.ts) e no spec dedicado de
  // pdfToImage (skip por default; RUN_PDF_INTEGRATION=1 ativa local).

  it('allowed type + high confidence → markReady', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'invoice',
      confidence: 0.9,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.markReady).toHaveBeenCalledWith(
      'd1',
      result.summary,
      result.extractedText,
      null,
    );
    expect(docs.markRejected).not.toHaveBeenCalled();
  });

  it('allowed type + low confidence → markRejected(low_confidence)', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'invoice',
      confidence: 0.4,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.markRejected).toHaveBeenCalledWith(
      'd1',
      'low_confidence',
      result,
    );
    expect(docs.findReadySemanticDuplicate).not.toHaveBeenCalled();
    expect(docs.markReady).not.toHaveBeenCalled();
  });

  it('NF-e nova vira READY com semanticHash', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'nf-e',
      summary: {
        ...happy.summary,
        core: {
          ...happy.summary.core,
          accessKey: '35260412345678000190550010000231171123456789',
        },
      },
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.findReadySemanticDuplicate).toHaveBeenCalledWith(
      'd1',
      'NFKEY:35260412345678000190550010000231171123456789',
    );
    expect(docs.markReady).toHaveBeenCalledWith(
      'd1',
      result.summary,
      result.extractedText,
      'NFKEY:35260412345678000190550010000231171123456789',
    );
  });

  it('NF-e com chave já existente vira DUPLICATE', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'nf-e',
      summary: {
        ...happy.summary,
        core: {
          ...happy.summary.core,
          accessKey: '35260412345678000190550010000231171123456789',
        },
      },
    };
    docs.findReadySemanticDuplicate.mockResolvedValue({ id: 'original-doc' });
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.markDuplicate).toHaveBeenCalledWith(
      'd1',
      'original-doc',
      'nfe_access_key',
      result,
      'NFKEY:35260412345678000190550010000231171123456789',
    );
    expect(docs.markReady).not.toHaveBeenCalled();
  });

  it('invoice com IDs fiscais iguais a documento READY vira DUPLICATE', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'invoice',
      summary: {
        ...happy.summary,
        core: {
          ...happy.summary.core,
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
    };
    docs.findReadySemanticDuplicate.mockResolvedValue({ id: 'original-doc' });
    provider.extract.mockResolvedValue(result);

    await svc.process('d1');

    const semanticHash = docs.findReadySemanticDuplicate.mock.calls[0][1];
    expect(semanticHash).toMatch(/^DOCID:v1:[0-9a-f]{64}$/);
    expect(docs.markDuplicate).toHaveBeenCalledWith(
      'd1',
      'original-doc',
      'document_identity',
      result,
      semanticHash,
    );
    expect(docs.markReady).not.toHaveBeenCalled();
  });

  it('invoice com nomes livres igual a READY fica READY com possibleDuplicateOfId', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'invoice',
      summary: {
        ...happy.summary,
        core: {
          ...happy.summary.core,
          invoiceDate: '11/05/2026',
          sellerName: 'ACME Ltda',
          clientName: 'Kainos Labs',
          total: 'R$ 1.234,56',
        },
      },
    };
    docs.findReadySemanticDuplicate.mockResolvedValue({ id: 'candidate-doc' });
    provider.extract.mockResolvedValue(result);

    await svc.process('d1');

    const semanticHash = docs.findReadySemanticDuplicate.mock.calls[0][1];
    expect(docs.markDuplicate).not.toHaveBeenCalled();
    expect(docs.markReady).toHaveBeenCalledWith(
      'd1',
      result.summary,
      result.extractedText,
      semanticHash,
      {
        possibleDuplicateOfId: 'candidate-doc',
        duplicateMatchStrength: 'needs_confirmation',
        duplicateReason: 'document_identity',
      },
    );
  });

  it('boleto com identificador forte igual a READY vira DUPLICATE', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'boleto',
      summary: {
        ...happy.summary,
        core: {
          ...happy.summary.core,
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
    };
    docs.findReadySemanticDuplicate.mockResolvedValue({
      id: 'boleto-original',
    });
    provider.extract.mockResolvedValue(result);

    await svc.process('d1');

    const semanticHash = docs.findReadySemanticDuplicate.mock.calls[0][1];
    expect(docs.markDuplicate).toHaveBeenCalledWith(
      'd1',
      'boleto-original',
      'boleto_identifier',
      result,
      semanticHash,
    );
  });

  it('unknown type → markRejected(unsupported_type)', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'unknown',
      confidence: 0.9,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.markRejected).toHaveBeenCalledWith(
      'd1',
      'unsupported_type',
      result,
    );
    expect(docs.findReadySemanticDuplicate).not.toHaveBeenCalled();
    expect(docs.markReady).not.toHaveBeenCalled();
  });

  it('rejected: persists partial summary', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'unknown',
      confidence: 0.9,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.markRejected).toHaveBeenCalledWith(
      'd1',
      'unsupported_type',
      result,
    );
  });
});

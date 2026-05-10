import { Test } from '@nestjs/testing';
import { OcrService, DOCUMENT_OPS } from './ocr.service';
import { OCR_PROVIDER } from './providers/ocr-provider.interface';
import { STORAGE_SERVICE } from '../storage/storage.service';
import type { InvoiceSummaryResult } from './schemas/invoice-summary.schema';

const happy: InvoiceSummaryResult = {
  documentType: 'invoice',
  confidence: 0.9,
  summary: {
    core: {
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
  extractedText: 'hi',
};

describe('OcrService', () => {
  let svc: OcrService;
  let docs: {
    markRunning: jest.Mock;
    markReady: jest.Mock;
    markFailed: jest.Mock;
    findByIdInternal: jest.Mock;
  };
  let storage: { read: jest.Mock };
  let provider: { extract: jest.Mock };

  beforeEach(async () => {
    docs = {
      markRunning: jest.fn().mockResolvedValue(undefined),
      markReady: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
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
});

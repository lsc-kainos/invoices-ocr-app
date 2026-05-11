import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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
    markRejected: jest.Mock;
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
    await svc.process('d1', 'user1');
    expect(docs.markRunning).toHaveBeenCalledWith('d1');
    expect(docs.findByIdInternal).toHaveBeenCalledWith('d1', 'user1');
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
    await expect(svc.process('d1', 'user1')).rejects.toThrow('rl');
    expect(docs.markFailed).not.toHaveBeenCalled();
  });

  it('erro não-transiente (ZodError) → FAILED imediato sem retry', async () => {
    const err = new Error('bad');
    (err as { name: string }).name = 'ZodError';
    provider.extract.mockRejectedValue(err);
    await svc.process('d1', 'user1');
    expect(provider.extract).toHaveBeenCalledTimes(1);
    expect(docs.markFailed).toHaveBeenCalledWith('d1', 'parse_failure');
  });

  it('doc não encontrado → markFailed("unknown")', async () => {
    docs.findByIdInternal.mockResolvedValue(null);
    await svc.process('d1', 'user1');
    expect(docs.findByIdInternal).toHaveBeenCalledWith('d1', 'user1');
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
    await svc.process('d1', 'user1');
    expect(docs.markReady).toHaveBeenCalledWith(
      'd1',
      result.summary,
      result.extractedText,
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
    await svc.process('d1', 'user1');
    expect(docs.markRejected).toHaveBeenCalledWith(
      'd1',
      'low_confidence',
      result,
    );
    expect(docs.markReady).not.toHaveBeenCalled();
  });

  it('unknown type → markRejected(unsupported_type)', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'unknown',
      confidence: 0.9,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1', 'user1');
    expect(docs.markRejected).toHaveBeenCalledWith(
      'd1',
      'unsupported_type',
      result,
    );
    expect(docs.markReady).not.toHaveBeenCalled();
  });

  it('rejected: persists partial summary', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'unknown',
      confidence: 0.9,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1', 'user1');
    expect(docs.markRejected).toHaveBeenCalledWith(
      'd1',
      'unsupported_type',
      result,
    );
  });
});

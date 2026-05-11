import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OcrService, DOCUMENT_OPS } from './ocr.service';
import { OCR_PROVIDER } from './providers/ocr-provider.interface';
import { STORAGE_SERVICE } from '../storage/storage.service';
import type { InvoiceSummaryResult } from './schemas/invoice-summary.schema';
import { DocumentDuplicateService } from '../documents/document-duplicate.service';

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

function withNfeAccessKey(accessKey: string): InvoiceSummaryResult {
  return {
    ...happy,
    documentType: 'nf-e',
    summary: {
      ...happy.summary,
      core: {
        ...happy.summary.core,
        total: 'R$ 184.520,00',
        invoiceNumber: '0023117',
        invoiceDate: '2026-04-22',
      },
      extras: [
        { label: 'CNPJ Emitente', value: '12.345.678/0001-90', mono: true },
        { label: 'CNPJ Destinatário', value: '98.765.432/0001-10', mono: true },
        { label: 'Chave NF-e', value: accessKey, mono: true },
      ],
    },
    extractedText: `CHAVE: ${accessKey}`,
  };
}

function withPartiesAndTotalOnly(): InvoiceSummaryResult {
  return {
    ...happy,
    confidence: 0.91,
    summary: {
      ...happy.summary,
      core: {
        ...happy.summary.core,
        total: 'R$ 12.450,00',
        invoiceNumber: null,
        invoiceDate: null,
      },
      extras: [
        { label: 'CNPJ Prestador', value: '11.222.333/0001-44', mono: true },
        { label: 'CNPJ Tomador', value: '55.666.777/0001-88', mono: true },
      ],
    },
    extractedText:
      'PRESTADOR: 11.222.333/0001-44 TOMADOR: 55.666.777/0001-88 TOTAL: R$ 12.450,00',
  };
}

describe('OcrService', () => {
  let svc: OcrService;
  let docs: {
    markRunning: jest.Mock;
    markReady: jest.Mock;
    markFailed: jest.Mock;
    markRejected: jest.Mock;
    findByIdInternal: jest.Mock;
    findReadyDuplicate: jest.Mock;
    markDuplicate: jest.Mock;
  };
  let storage: { read: jest.Mock };
  let provider: { extract: jest.Mock };

  beforeEach(async () => {
    docs = {
      markRunning: jest.fn().mockResolvedValue(undefined),
      markReady: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      markRejected: jest.fn().mockResolvedValue(undefined),
      markDuplicate: jest.fn().mockResolvedValue(undefined),
      findReadyDuplicate: jest.fn().mockResolvedValue(null),
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
        DocumentDuplicateService,
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

  it('documento novo vira READY com assinatura semântica', async () => {
    const result = withNfeAccessKey(
      '35260412345678000190550010000231171123456789',
    );
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.findReadyDuplicate).toHaveBeenCalledWith(
      'd1',
      'NFKEY:35260412345678000190550010000231171123456789',
    );
    expect(docs.markReady).toHaveBeenCalledWith(
      'd1',
      result.summary,
      result.extractedText,
      'NFKEY:35260412345678000190550010000231171123456789',
    );
    expect(docs.markDuplicate).not.toHaveBeenCalled();
  });

  it('mesma chave NF-e vira DUPLICATE', async () => {
    const result = withNfeAccessKey(
      '35260412345678000190550010000231171123456789',
    );
    docs.findReadyDuplicate.mockResolvedValue({ id: 'original-doc' });
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.markDuplicate).toHaveBeenCalledWith(
      'd1',
      'original-doc',
      'nf_access_key',
      result,
      'NFKEY:35260412345678000190550010000231171123456789',
    );
    expect(docs.markReady).not.toHaveBeenCalled();
  });

  it('mesmo emissor/recebedor/valor com regra mínima válida vira DUPLICATE', async () => {
    const result = withPartiesAndTotalOnly();
    docs.findReadyDuplicate.mockResolvedValue({ id: 'original-doc' });
    provider.extract.mockResolvedValue(result);
    await svc.process('d1');
    expect(docs.findReadyDuplicate).toHaveBeenCalledWith(
      'd1',
      expect.stringMatching(/^PARTIES_TOTAL:/),
    );
    expect(docs.markDuplicate).toHaveBeenCalledWith(
      'd1',
      'original-doc',
      'minimal_parties_total',
      result,
      expect.stringMatching(/^PARTIES_TOTAL:/),
    );
    expect(docs.markReady).not.toHaveBeenCalled();
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
    expect(docs.markReady).not.toHaveBeenCalled();
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

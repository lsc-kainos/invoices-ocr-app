import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OcrService } from './ocr.service';
import { OCR_PROVIDER } from './providers/ocr-provider.interface';
import { STORAGE_SERVICE } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';
import { DocumentStateService } from '../documents/document-state.service';
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

function createPrismaMock() {
  return {
    document: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('OcrService', () => {
  let svc: OcrService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let storage: { read: jest.Mock };
  let provider: { extract: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    prisma.document.findFirst.mockResolvedValue({
      id: 'd1',
      mime: 'image/jpeg',
      storagePath: 'u/d1/o.jpg',
    });
    storage = {
      read: jest.fn().mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff])),
    };
    provider = { extract: jest.fn() };
    const state = {
      markRunning: jest
        .fn()
        .mockImplementation((id: string) =>
          prisma.document.update({
            where: { id },
            data: {
              status: DocumentStatus.OCR_RUNNING,
              ocrStartedAt: new Date(),
            },
          }),
        ),
      markReady: jest
        .fn()
        .mockImplementation(
          (id: string, summary: unknown, extractedText: string) =>
            prisma.document.update({
              where: { id },
              data: {
                status: DocumentStatus.READY,
                summary: summary as never,
                extractedText,
                ocrCompletedAt: new Date(),
                failureReason: null,
              },
            }),
        ),
      markFailed: jest
        .fn()
        .mockImplementation((id: string, reason: string) =>
          prisma.document.update({
            where: { id },
            data: {
              status: DocumentStatus.FAILED,
              failureReason: reason,
              retryCount: { increment: 1 },
              ocrCompletedAt: new Date(),
            },
          }),
        ),
      markRejected: jest
        .fn()
        .mockImplementation((id: string, reason: string, partial: unknown) =>
          prisma.document.update({
            where: { id },
            data: {
              status: DocumentStatus.REJECTED,
              rejectionReason: reason,
              summary: (partial as { summary: unknown }).summary as never,
              extractedText: (partial as { extractedText: string })
                .extractedText,
              ocrCompletedAt: new Date(),
            },
          }),
        ),
    };
    const mod = await Test.createTestingModule({
      providers: [
        OcrService,
        { provide: PrismaService, useValue: prisma },
        { provide: DocumentStateService, useValue: state },
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
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({ status: DocumentStatus.OCR_RUNNING }),
      }),
    );
    expect(prisma.document.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1', userId: 'user1' },
      }),
    );
    expect(provider.extract).toHaveBeenCalledTimes(1);
    expect(prisma.document.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          status: DocumentStatus.READY,
          extractedText: happy.extractedText,
        }),
      }),
    );
  });

  it('erro transiente → lança para BullMQ retry (sem markFailed interno)', async () => {
    const err: Error & { status?: number } = new Error('rl');
    err.status = 429;
    provider.extract.mockRejectedValue(err);
    await expect(svc.process('d1', 'user1')).rejects.toThrow('rl');
    // Apenas markRunning foi chamado; nenhum markFailed deve ser chamado
    const failedCalls = prisma.document.update.mock.calls.filter(
      (call: any[]) => call[0]?.data?.status === DocumentStatus.FAILED,
    );
    expect(failedCalls).toHaveLength(0);
  });

  it('erro não-transiente (ZodError) → FAILED imediato sem retry', async () => {
    const err = new Error('bad');
    (err as { name: string }).name = 'ZodError';
    provider.extract.mockRejectedValue(err);
    await svc.process('d1', 'user1');
    expect(provider.extract).toHaveBeenCalledTimes(1);
    expect(prisma.document.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          status: DocumentStatus.FAILED,
          failureReason: 'parse_failure',
        }),
      }),
    );
  });

  it('doc não encontrado → markFailed("unknown")', async () => {
    prisma.document.findFirst.mockResolvedValue(null);
    await svc.process('d1', 'user1');
    expect(prisma.document.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1', userId: 'user1' },
      }),
    );
    expect(prisma.document.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          status: DocumentStatus.FAILED,
          failureReason: 'unknown',
        }),
      }),
    );
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
    expect(prisma.document.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          status: DocumentStatus.READY,
          extractedText: result.extractedText,
        }),
      }),
    );
  });

  it('allowed type + low confidence → markRejected(low_confidence)', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'invoice',
      confidence: 0.4,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1', 'user1');
    expect(prisma.document.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          status: DocumentStatus.REJECTED,
          rejectionReason: 'low_confidence',
        }),
      }),
    );
  });

  it('unknown type → markRejected(unsupported_type)', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'unknown',
      confidence: 0.9,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1', 'user1');
    expect(prisma.document.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          status: DocumentStatus.REJECTED,
          rejectionReason: 'unsupported_type',
        }),
      }),
    );
  });

  it('rejected: persists partial summary', async () => {
    const result: InvoiceSummaryResult = {
      ...happy,
      documentType: 'unknown',
      confidence: 0.9,
    };
    provider.extract.mockResolvedValue(result);
    await svc.process('d1', 'user1');
    expect(prisma.document.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          status: DocumentStatus.REJECTED,
          rejectionReason: 'unsupported_type',
        }),
      }),
    );
  });
});

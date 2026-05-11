import { Test } from '@nestjs/testing';
import { OcrProcessor } from './ocr.processor';
import { OcrService } from '../ocr.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';

describe('OcrProcessor', () => {
  let processor: OcrProcessor;
  let ocr: { process: jest.Mock };
  let prisma: { document: { update: jest.Mock } };

  beforeEach(async () => {
    ocr = { process: jest.fn().mockResolvedValue(undefined) };
    prisma = { document: { update: jest.fn().mockResolvedValue(undefined) } };
    const mod = await Test.createTestingModule({
      providers: [
        OcrProcessor,
        { provide: OcrService, useValue: ocr },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    processor = mod.get(OcrProcessor);
  });

  it('delega para OcrService.process com documentId e userId', async () => {
    const fakeJob = { data: { documentId: 'doc-xyz', userId: 'u1' } } as never;
    await processor.process(fakeJob);
    expect(ocr.process).toHaveBeenCalledWith('doc-xyz', 'u1');
  });

  it('propaga exceção do OcrService (erros transientes chegam ao BullMQ)', async () => {
    ocr.process.mockRejectedValue(new Error('timeout'));
    const fakeJob = { data: { documentId: 'doc-xyz', userId: 'u1' } } as never;
    await expect(processor.process(fakeJob)).rejects.toThrow('timeout');
  });

  it('onFailed marca documento como FAILED com transient_exhausted', async () => {
    const fakeJob = {
      data: { documentId: 'doc-xyz', userId: 'u1' },
      attemptsMade: 3,
    } as never;
    await processor.onFailed(fakeJob, new Error('timeout'));
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-xyz' },
      data: {
        status: DocumentStatus.FAILED,
        failureReason: 'transient_exhausted',
        retryCount: { increment: 1 },
        ocrCompletedAt: expect.any(Date),
      },
    });
  });
});

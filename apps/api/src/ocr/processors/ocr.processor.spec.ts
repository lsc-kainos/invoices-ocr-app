import { Test } from '@nestjs/testing';
import { OcrProcessor } from './ocr.processor';
import { OcrService } from '../ocr.service';
import { DOCUMENT_OPS } from '../ocr.service';

describe('OcrProcessor', () => {
  let processor: OcrProcessor;
  let ocr: { process: jest.Mock };
  let docs: { markFailed: jest.Mock };

  beforeEach(async () => {
    ocr = { process: jest.fn().mockResolvedValue(undefined) };
    docs = { markFailed: jest.fn().mockResolvedValue(undefined) };
    const mod = await Test.createTestingModule({
      providers: [
        OcrProcessor,
        { provide: OcrService, useValue: ocr },
        { provide: DOCUMENT_OPS, useValue: docs },
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

  it('onFailed chama markFailed com transient_exhausted', async () => {
    const fakeJob = {
      data: { documentId: 'doc-xyz', userId: 'u1' },
      attemptsMade: 3,
    } as never;
    await processor.onFailed(fakeJob, new Error('timeout'));
    expect(docs.markFailed).toHaveBeenCalledWith(
      'doc-xyz',
      'transient_exhausted',
    );
  });
});

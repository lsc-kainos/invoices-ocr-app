import { Test } from '@nestjs/testing';
import { DocumentUploadedHandler } from './document-uploaded.handler';
import { OcrService } from '../ocr.service';
import { DocumentUploadedEvent } from '../../documents/events/document-uploaded.event';

describe('DocumentUploadedHandler', () => {
  let handler: DocumentUploadedHandler;
  let ocr: { process: jest.Mock };

  beforeEach(async () => {
    ocr = { process: jest.fn().mockResolvedValue(undefined) };
    const mod = await Test.createTestingModule({
      providers: [
        DocumentUploadedHandler,
        { provide: OcrService, useValue: ocr },
      ],
    }).compile();
    handler = mod.get(DocumentUploadedHandler);
  });

  it('chama OcrService.process com documentId', async () => {
    await handler.handle(new DocumentUploadedEvent('doc-xyz'));
    expect(ocr.process).toHaveBeenCalledWith('doc-xyz');
  });

  it('exceção do service não propaga', async () => {
    ocr.process.mockRejectedValue(new Error('boom'));
    await expect(
      handler.handle(new DocumentUploadedEvent('doc-xyz')),
    ).resolves.toBeUndefined();
  });
});

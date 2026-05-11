import { Test } from '@nestjs/testing';
import type { User } from '@prisma/client';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import type { UpdateDocumentSummaryDto } from './dto/update-document-summary.dto';

describe('DocumentsController', () => {
  let ctrl: DocumentsController;
  let svc: {
    create: jest.Mock;
    list: jest.Mock;
    findOne: jest.Mock;
    streamFile: jest.Mock;
    retry: jest.Mock;
    updateSummary: jest.Mock;
  };

  beforeEach(async () => {
    svc = {
      create: jest.fn(),
      list: jest.fn(),
      findOne: jest.fn(),
      streamFile: jest.fn(),
      retry: jest.fn(),
      updateSummary: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: svc }],
    }).compile();
    ctrl = mod.get(DocumentsController);
  });

  it('POST chama service.create com user.id e file', async () => {
    svc.create.mockResolvedValue({ id: 'd1' });
    const file = {
      buffer: Buffer.from('x'),
      originalname: 'a.jpg',
      size: 1,
    } as unknown as Express.Multer.File;
    const r = await ctrl.create({ id: 'u1' } as User, file);
    expect(svc.create).toHaveBeenCalledWith('u1', file);
    expect(r).toEqual({ id: 'd1' });
  });

  it('GET passa query parseada', async () => {
    svc.list.mockResolvedValue([]);
    await ctrl.list({ id: 'u1' } as User, {
      status: ['QUEUED'] as never,
    });
    expect(svc.list).toHaveBeenCalledWith('u1', { status: ['QUEUED'] });
  });

  it('GET :id passa user.id', async () => {
    svc.findOne.mockResolvedValue({ id: 'd1' });
    await ctrl.findOne({ id: 'u1' } as User, 'd1');
    expect(svc.findOne).toHaveBeenCalledWith('u1', 'd1');
  });

  it('GET :id/file chama streamFile (rota Public)', async () => {
    const res = {} as never;
    svc.streamFile.mockResolvedValue(undefined);
    await ctrl.getFile('d1', 'token', res);
    expect(svc.streamFile).toHaveBeenCalledWith('d1', 'token', res);
  });

  describe('POST :id/retry', () => {
    it('chama service.retry com user.id e param id', async () => {
      const summary = { id: 'doc1', status: 'QUEUED' } as never;
      svc.retry.mockResolvedValue(summary);
      const result = await ctrl.retry({ id: 'u1' } as never, 'doc1');
      expect(svc.retry).toHaveBeenCalledWith('u1', 'doc1');
      expect(result).toBe(summary);
    });
  });

  describe('PATCH :id/summary', () => {
    it('chama service.updateSummary com user.id, id e body.summary', async () => {
      const detail = { id: 'd1', status: 'READY' } as never;
      svc.updateSummary.mockResolvedValue(detail);
      const body = {
        summary: { core: {}, items: [], extras: [], narrative: 'edited' },
      } as unknown as UpdateDocumentSummaryDto;
      const result = await ctrl.updateSummary({ id: 'u1' } as User, 'd1', body);
      expect(svc.updateSummary).toHaveBeenCalledWith('u1', 'd1', body.summary);
      expect(result).toBe(detail);
    });
  });
});

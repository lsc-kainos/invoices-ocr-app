// file-type é ESM-only e usa dynamic import real — não funciona no Jest sem
// --experimental-vm-modules. Mockamos detectFileType com magic bytes inline.
jest.mock('./helpers/detect-file-type', () => ({
  detectFileType: jest.fn().mockImplementation((buf: Buffer) => {
    if (buf[0] === 0xff && buf[1] === 0xd8)
      return Promise.resolve({ ext: 'jpg', mime: 'image/jpeg' });
    if (buf[0] === 0x89 && buf[1] === 0x50)
      return Promise.resolve({ ext: 'png', mime: 'image/png' });
    if (buf[0] === 0x25 && buf[1] === 0x50)
      return Promise.resolve({ ext: 'pdf', mime: 'application/pdf' });
    if (buf[0] === 0x50 && buf[1] === 0x4b)
      return Promise.resolve({ ext: 'zip', mime: 'application/zip' });
    return Promise.resolve(undefined);
  }),
}));

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE } from '../storage/storage.service';
import { OCR_QUEUE_NAME } from '../ocr/queues/ocr.queue';
import type { Document } from '@prisma/client';
import { DocumentStatus, Prisma } from '@prisma/client';
import type { InvoiceSummary } from '../ocr/schemas/invoice-summary.schema';

const SECRET = 'a'.repeat(32);

const buildJpeg = () =>
  Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
    Buffer.alloc(50, 0),
  ]);
const buildDocx = () => Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);

const file = (
  buffer: Buffer,
  originalname = 'nota.jpg',
): Express.Multer.File => ({
  buffer,
  originalname,
  size: buffer.length,
  fieldname: 'file',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  stream: undefined as never,
  destination: '',
  filename: originalname,
  path: '',
});

const baseDoc = (over: Partial<Document>): Document => {
  const now = new Date();
  return {
    id: 'd1',
    userId: 'user1',
    filename: 'n.jpg',
    mime: 'image/jpeg',
    size: 100,
    storagePath: 'user1/d1/original.jpg',
    status: 'READY',
    failureReason: null,
    retryCount: 0,
    summary: null,
    extractedText: 'hello',
    ocrStartedAt: now,
    ocrCompletedAt: now,
    createdAt: now,
    updatedAt: now,
    documentType: null,
    confidence: null,
    rejectionReason: null,
    verifiedAt: null,
    verifiedBy: null,
    contentHash: null,
    duplicateOfId: null,
    ...over,
  };
};

const makeRes = () => ({ setHeader: jest.fn(), end: jest.fn() });

describe('DocumentsService', () => {
  let svc: DocumentsService;
  let prisma: {
    document: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    documentEdit: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let storage: { put: jest.Mock; read: jest.Mock };
  let ocrQueue: { add: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    prisma = {
      document: {
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: Partial<Document> }) =>
            Promise.resolve(baseDoc({ id: 'd1', status: 'QUEUED', ...data })),
          ),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest
          .fn()
          .mockImplementation(
            ({
              where,
              data,
            }: {
              where: { id: string };
              data: Partial<Document>;
            }) => Promise.resolve(baseDoc({ id: where.id, ...data })),
          ),
        delete: jest.fn().mockResolvedValue(undefined),
      },
      documentEdit: {
        create: jest.fn().mockResolvedValue({ id: 'edit1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
        ),
    };
    storage = {
      put: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue(Buffer.from('x')),
    };
    ocrQueue = {
      add: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const cfg = {
      getOrThrow: (k: string) =>
        ({ STORAGE_URL_SECRET: SECRET, UPLOAD_MAX_BYTES: 10_485_760 })[k] as
          | string
          | number,
    } as unknown as ConfigService;

    const mod = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: STORAGE_SERVICE, useValue: storage },
        { provide: getQueueToken(OCR_QUEUE_NAME), useValue: ocrQueue },
        { provide: ConfigService, useValue: cfg },
      ],
    }).compile();
    svc = mod.get(DocumentsService);
  });

  describe('create', () => {
    it('upload novo enfileira OCR e salva contentHash', async () => {
      const buffer = buildJpeg();
      const expectedHash = createHash('sha256').update(buffer).digest('hex');

      const dto = await svc.create('user1', file(buffer));

      expect(storage.put).toHaveBeenCalled();
      expect(prisma.document.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1',
            contentHash: expectedHash,
            status: {
              in: [
                DocumentStatus.READY,
                DocumentStatus.REJECTED,
                DocumentStatus.DUPLICATE,
              ],
            },
          }),
        }),
      );
      expect(prisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentHash: expectedHash,
          status: DocumentStatus.QUEUED,
        }),
      });
      expect(prisma.document.update).toHaveBeenCalled();
      expect(ocrQueue.add).toHaveBeenCalledWith(
        'process',
        { documentId: dto.id },
        expect.objectContaining({ jobId: dto.id, attempts: 3 }),
      );
      expect(dto.status).toBeDefined();
    });

    it('hash duplicado cria DUPLICATE sem storage.put nem OCR', async () => {
      const buffer = buildJpeg();
      const expectedHash = createHash('sha256').update(buffer).digest('hex');
      prisma.document.findFirst.mockResolvedValue(
        baseDoc({
          id: 'original1',
          status: DocumentStatus.READY,
          contentHash: expectedHash,
          storagePath: 'user1/original1/original.jpg',
        }),
      );
      prisma.document.create.mockResolvedValueOnce(
        baseDoc({
          id: 'dup1',
          status: DocumentStatus.DUPLICATE,
          contentHash: expectedHash,
          duplicateOfId: 'original1',
          storagePath: 'duplicate:original1',
        }),
      );

      const dto = await svc.create('user1', file(buffer));

      expect(dto.status).toBe(DocumentStatus.DUPLICATE);
      expect(storage.put).not.toHaveBeenCalled();
      expect(ocrQueue.add).not.toHaveBeenCalled();
      expect(prisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: DocumentStatus.DUPLICATE,
          contentHash: expectedHash,
          duplicateOfId: 'original1',
          storagePath: 'duplicate:original1',
        }),
      });
    });

    it('corrida por unique constraint retorna duplicata sem enfileirar OCR', async () => {
      const buffer = buildJpeg();
      const expectedHash = createHash('sha256').update(buffer).digest('hex');
      prisma.document.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          baseDoc({
            id: 'original-race',
            status: DocumentStatus.QUEUED,
            contentHash: expectedHash,
            storagePath: 'pending',
          }),
        );
      prisma.document.create
        .mockRejectedValueOnce(
          new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
            meta: { target: ['userId', 'contentHash'] },
          }),
        )
        .mockResolvedValueOnce(
          baseDoc({
            id: 'dup-race',
            status: DocumentStatus.DUPLICATE,
            contentHash: expectedHash,
            duplicateOfId: 'original-race',
            storagePath: 'duplicate:original-race',
          }),
        );

      const dto = await svc.create('user1', file(buffer));

      expect(dto.status).toBe(DocumentStatus.DUPLICATE);
      expect(storage.put).not.toHaveBeenCalled();
      expect(ocrQueue.add).not.toHaveBeenCalled();
      expect(prisma.document.findFirst).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1',
            contentHash: expectedHash,
            status: { not: DocumentStatus.DUPLICATE },
          }),
        }),
      );
      expect(prisma.document.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          status: DocumentStatus.DUPLICATE,
          duplicateOfId: 'original-race',
          contentHash: expectedHash,
        }),
      });
    });

    it('magic bytes inválidos → BadRequest sem put', async () => {
      await expect(
        svc.create('user1', file(buildDocx(), 'a.docx')),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.put).not.toHaveBeenCalled();
      expect(prisma.document.create).not.toHaveBeenCalled();
    });

    it('size > limit → PayloadTooLarge', async () => {
      const huge = file(Buffer.concat([buildJpeg(), Buffer.alloc(200, 0)]));
      const cfgHuge = {
        getOrThrow: (k: string) =>
          ({ STORAGE_URL_SECRET: SECRET, UPLOAD_MAX_BYTES: 100 })[k] as
            | string
            | number,
      } as unknown as ConfigService;
      const mod = await Test.createTestingModule({
        providers: [
          DocumentsService,
          { provide: PrismaService, useValue: prisma },
          { provide: STORAGE_SERVICE, useValue: storage },
          { provide: getQueueToken(OCR_QUEUE_NAME), useValue: ocrQueue },
          { provide: ConfigService, useValue: cfgHuge },
        ],
      }).compile();
      const svcHuge = mod.get(DocumentsService);
      await expect(svcHuge.create('user1', huge)).rejects.toBeInstanceOf(
        PayloadTooLargeException,
      );
    });
  });

  describe('list', () => {
    it('sempre filtra por userId', async () => {
      await svc.list('user1', {});
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user1' }),
          take: 50,
          orderBy: { updatedAt: 'desc' },
        }),
      );
    });

    it('passa status[] no where', async () => {
      await svc.list('user1', {
        status: ['QUEUED', 'OCR_RUNNING'] as never,
      });
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['QUEUED', 'OCR_RUNNING'] },
          }),
        }),
      );
    });

    it('passa updatedSince no where', async () => {
      await svc.list('user1', { updatedSince: '2026-05-01T00:00:00Z' });
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            updatedAt: { gt: expect.any(Date) },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('cross-user → NotFound', async () => {
      prisma.document.findFirst.mockResolvedValue(null);
      await expect(svc.findOne('userB', 'd1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('encontrado: retorna detail com fileUrl assinado', async () => {
      prisma.document.findFirst.mockResolvedValue(
        baseDoc({ id: 'd1', userId: 'user1' }),
      );
      const dto = await svc.findOne('user1', 'd1');
      expect(dto.fileUrl).toMatch(
        /^\/api\/v1\/documents\/d1\/file\?token=\d+\.[0-9a-f]+$/,
      );
    });
  });

  describe('streamFile', () => {
    it('token inválido → Unauthorized', async () => {
      prisma.document.findUnique.mockResolvedValue(
        baseDoc({ id: 'd1', userId: 'user1' }),
      );
      const exp = Math.floor(Date.now() / 1000) + 600;
      const res = makeRes();
      await expect(
        svc.streamFile('d1', `${exp}.deadbeef`, res as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('token expirado → Unauthorized', async () => {
      prisma.document.findUnique.mockResolvedValue(
        baseDoc({ id: 'd1', userId: 'user1' }),
      );
      const expiredExp = Math.floor(Date.now() / 1000) - 1;
      const sig = createHmac('sha256', SECRET)
        .update(`d1.user1.${expiredExp}`)
        .digest('hex');
      const res = makeRes();
      await expect(
        svc.streamFile('d1', `${expiredExp}.${sig}`, res as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('token válido: stream do volume com mime correto', async () => {
      prisma.document.findUnique.mockResolvedValue(
        baseDoc({ id: 'd1', userId: 'user1' }),
      );
      const exp = Math.floor(Date.now() / 1000) + 600;
      const sig = createHmac('sha256', SECRET)
        .update(`d1.user1.${exp}`)
        .digest('hex');
      const res = makeRes();
      await svc.streamFile('d1', `${exp}.${sig}`, res as never);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(res.end).toHaveBeenCalled();
    });

    it('token de outro user → Unauthorized', async () => {
      prisma.document.findUnique.mockResolvedValue(
        baseDoc({ id: 'd1', userId: 'realOwner' }),
      );
      const exp = Math.floor(Date.now() / 1000) + 600;
      // token forjado para usuário diferente
      const sig = createHmac('sha256', SECRET)
        .update(`d1.attacker.${exp}`)
        .digest('hex');
      const res = makeRes();
      await expect(
        svc.streamFile('d1', `${exp}.${sig}`, res as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('mark*', () => {
    it('markRunning seta OCR_RUNNING + ocrStartedAt', async () => {
      await svc.markRunning('d1');
      expect(prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'd1' },
          data: expect.objectContaining({ status: 'OCR_RUNNING' }),
        }),
      );
    });

    it('markReady seta READY + summary + extractedText + ocrCompletedAt', async () => {
      await svc.markReady(
        'd1',
        { core: {} as never, items: [], extras: [], narrative: '' },
        'text',
      );
      expect(prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'READY',
            extractedText: 'text',
          }),
        }),
      );
    });

    it('markFailed seta FAILED + failureReason + retryCount++', async () => {
      await svc.markFailed('d1', 'rate_limit');
      expect(prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'rate_limit',
          }),
        }),
      );
    });
  });

  describe('retry', () => {
    it('FAILED → QUEUED + emite document.uploaded', async () => {
      const doc = {
        id: 'doc1',
        userId: 'u1',
        status: DocumentStatus.FAILED,
        failureReason: 'rate_limit',
        filename: 'nf.pdf',
        mime: 'application/pdf',
        size: 100,
        storagePath: 'u1/doc1/original.pdf',
        summary: null,
        extractedText: null,
        retryCount: 1,
        ocrStartedAt: null,
        ocrCompletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never;

      prisma.document.findFirst.mockResolvedValue(doc);
      prisma.document.update.mockResolvedValue({
        ...(doc as object),
        status: DocumentStatus.QUEUED,
        failureReason: null,
      });

      const result = await svc.retry('u1', 'doc1');

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc1' },
        data: {
          status: DocumentStatus.QUEUED,
          failureReason: null,
          ocrStartedAt: null,
          ocrCompletedAt: null,
        },
      });
      expect(ocrQueue.add).toHaveBeenCalledWith(
        'process',
        { documentId: 'doc1' },
        expect.objectContaining({ jobId: 'doc1', attempts: 3 }),
      );
      expect(result.status).toBe('QUEUED');
    });

    it('doc inexistente ou de outro user → NotFoundException', async () => {
      prisma.document.findFirst.mockResolvedValue(null);
      await expect(svc.retry('u1', 'doc1')).rejects.toThrow(NotFoundException);
      expect(ocrQueue.add).not.toHaveBeenCalled();
    });

    it('status ≠ FAILED → ConflictException', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc1',
        userId: 'u1',
        status: DocumentStatus.OCR_RUNNING,
      });
      await expect(svc.retry('u1', 'doc1')).rejects.toThrow(ConflictException);
      expect(ocrQueue.add).not.toHaveBeenCalled();
    });

    it('falha no enqueue Redis → restaura FAILED e relança erro', async () => {
      const doc = {
        id: 'doc1',
        userId: 'u1',
        status: DocumentStatus.FAILED,
        failureReason: 'rate_limit',
        filename: 'nf.pdf',
        mime: 'application/pdf',
        size: 100,
        storagePath: 'u1/doc1/original.pdf',
        summary: null,
        extractedText: null,
        retryCount: 1,
        ocrStartedAt: null,
        ocrCompletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never;

      prisma.document.findFirst.mockResolvedValue(doc);
      prisma.document.update
        .mockResolvedValueOnce({
          ...(doc as object),
          status: DocumentStatus.QUEUED,
        })
        .mockResolvedValueOnce({
          ...(doc as object),
          status: DocumentStatus.FAILED,
        });

      const redisErr = new Error('Redis connection refused');
      ocrQueue.add.mockRejectedValue(redisErr);

      await expect(svc.retry('u1', 'doc1')).rejects.toThrow(
        'Redis connection refused',
      );

      expect(prisma.document.update).toHaveBeenCalledTimes(2);
      expect(prisma.document.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: 'doc1' },
          data: expect.objectContaining({
            status: DocumentStatus.FAILED,
            failureReason: 'queue_error',
          }),
        }),
      );
    });
  });

  describe('updateSummary', () => {
    it('doc not found or wrong user → NotFoundException', async () => {
      prisma.document.findFirst.mockResolvedValue(null);
      await expect(
        svc.updateSummary('u1', 'doc1', {} as InvoiceSummary),
      ).rejects.toThrow(NotFoundException);
    });

    it('status !== READY → BadRequestException', async () => {
      prisma.document.findFirst.mockResolvedValue(
        baseDoc({ status: 'OCR_RUNNING' }),
      );
      await expect(
        svc.updateSummary('u1', 'doc1', {} as InvoiceSummary),
      ).rejects.toThrow(BadRequestException);
    });

    it('success: creates DocumentEdit + updates Document with verifiedAt/By', async () => {
      const oldSummary = { core: {}, items: [], extras: [], narrative: 'old' };
      const newSummary = { core: {}, items: [], extras: [], narrative: 'new' };
      prisma.document.findFirst.mockResolvedValue(
        baseDoc({ status: 'READY', summary: oldSummary }),
      );
      prisma.document.update.mockResolvedValue(
        baseDoc({
          summary: newSummary,
          verifiedAt: new Date(),
          verifiedBy: 'u1',
        }),
      );

      const result = await svc.updateSummary(
        'u1',
        'doc1',
        newSummary as unknown as InvoiceSummary,
      );

      expect(prisma.documentEdit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentId: expect.any(String),
          editedBy: 'u1',
          before: oldSummary,
          after: newSummary,
        }),
      });
      expect(prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            summary: newSummary,
            verifiedBy: 'u1',
          }),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('listEdits', () => {
    it('doc not found or wrong user → NotFoundException', async () => {
      prisma.document.findFirst.mockResolvedValue(null);
      await expect(svc.listEdits('userB', 'd1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.documentEdit.findMany).not.toHaveBeenCalled();
    });

    it('doc sem edits → array vazio', async () => {
      prisma.document.findFirst.mockResolvedValue(
        baseDoc({ id: 'd1', userId: 'user1' }),
      );
      prisma.documentEdit.findMany.mockResolvedValue([]);
      const result = await svc.listEdits('user1', 'd1');
      expect(result).toEqual([]);
      expect(prisma.documentEdit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            documentId: 'd1',
            document: { userId: 'user1' },
          }),
          orderBy: { createdAt: 'desc' },
          include: expect.objectContaining({
            editor: { select: { name: true, email: true } },
          }),
        }),
      );
    });

    it('doc com edits → mapeia para DTO ordenado desc', async () => {
      prisma.document.findFirst.mockResolvedValue(
        baseDoc({ id: 'd1', userId: 'user1' }),
      );
      const newer = new Date('2026-05-11T03:00:00Z');
      const older = new Date('2026-05-10T03:00:00Z');
      prisma.documentEdit.findMany.mockResolvedValue([
        {
          id: 'edit2',
          createdAt: newer,
          before: { core: { total: '100,00' } },
          after: { core: { total: '110,00' } },
          editor: { name: 'Alice', email: 'alice@example.com' },
        },
        {
          id: 'edit1',
          createdAt: older,
          before: { core: { total: '90,00' } },
          after: { core: { total: '100,00' } },
          editor: { name: null, email: 'bob@example.com' },
        },
      ]);

      const result = await svc.listEdits('user1', 'd1');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'edit2',
        createdAt: newer.toISOString(),
        editor: { name: 'Alice', email: 'alice@example.com' },
        before: { core: { total: '100,00' } },
        after: { core: { total: '110,00' } },
      });
      expect(result[1].editor).toEqual({
        name: null,
        email: 'bob@example.com',
      });
    });
  });
});

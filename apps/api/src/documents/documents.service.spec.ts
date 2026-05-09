/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE } from '../storage/storage.service';
import type { Document } from '@prisma/client';
import { DocumentStatus } from '@prisma/client';
import { DocumentUploadedEvent } from './events/document-uploaded.event';

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
  };
  let storage: { put: jest.Mock; read: jest.Mock };
  let events: { emit: jest.Mock };

  beforeEach(async () => {
    prisma = {
      document: {
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: Partial<Document> }) =>
            Promise.resolve(baseDoc({ ...data, id: 'd1', status: 'QUEUED' })),
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
    };
    storage = {
      put: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue(Buffer.from('x')),
    };
    events = { emit: jest.fn() };
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
        { provide: EventEmitter2, useValue: events },
        { provide: ConfigService, useValue: cfg },
      ],
    }).compile();
    svc = mod.get(DocumentsService);
  });

  describe('create', () => {
    it('happy path: persiste arquivo + row + emite evento', async () => {
      const dto = await svc.create('user1', file(buildJpeg()));
      expect(storage.put).toHaveBeenCalled();
      expect(prisma.document.create).toHaveBeenCalled();
      expect(prisma.document.update).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        'document.uploaded',
        expect.objectContaining({ documentId: dto.id }),
      );
      expect(dto.status).toBeDefined();
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
          { provide: EventEmitter2, useValue: events },
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
      } as never);

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
      expect(events.emit).toHaveBeenCalledWith(
        DocumentUploadedEvent.NAME,
        expect.objectContaining({ documentId: 'doc1' }),
      );
      expect(result.status).toBe('QUEUED');
    });

    it('doc inexistente ou de outro user → NotFoundException', async () => {
      prisma.document.findFirst.mockResolvedValue(null);
      await expect(svc.retry('u1', 'doc1')).rejects.toThrow(NotFoundException);
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('status ≠ FAILED → ConflictException', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc1',
        userId: 'u1',
        status: DocumentStatus.OCR_RUNNING,
      } as never);
      await expect(svc.retry('u1', 'doc1')).rejects.toThrow(ConflictException);
      expect(events.emit).not.toHaveBeenCalled();
    });
  });
});

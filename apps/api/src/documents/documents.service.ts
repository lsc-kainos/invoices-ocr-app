import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { DocumentStatus, Prisma } from '@prisma/client';
import { detectFileType } from './helpers/detect-file-type';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../storage/storage.service';
import type {
  InvoiceSummary,
  InvoiceSummaryResult,
} from '../ocr/schemas/invoice-summary.schema';
import type { DocumentOps, ReadyDuplicateSuggestion } from '../ocr/ocr.service';
import { OCR_QUEUE_NAME, type OcrJobData } from '../ocr/queues/ocr.queue';
import { sanitizeFilename } from './helpers/sanitize-filename';
import { mimeToExt } from './helpers/mime-to-ext';
import { maskFilename } from './helpers/mask-filename';
import { encodeRFC5987 } from './helpers/encode-rfc5987';
import {
  type DocumentSummaryDto,
  toSummaryDto,
} from './dto/document-summary.dto';
import { type DocumentDetailDto, toDetailDto } from './dto/document-detail.dto';
import { type DocumentEditDto, toEditDto } from './dto/document-edit.dto';
import type { ListDocumentsQueryDto } from './dto/list-documents.query.dto';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;
const DEDUP_ORIGINAL_STATUSES = [
  DocumentStatus.QUEUED,
  DocumentStatus.OCR_RUNNING,
  DocumentStatus.READY,
  DocumentStatus.REJECTED,
] as const;
const FINAL_DEDUP_STATUSES = [
  DocumentStatus.READY,
  DocumentStatus.REJECTED,
  DocumentStatus.DUPLICATE,
] as const;

@Injectable()
export class DocumentsService implements DocumentOps {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly urlSecret: string;
  private readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @InjectQueue(OCR_QUEUE_NAME) private readonly ocrQueue: Queue<OcrJobData>,
    cfg: ConfigService,
  ) {
    this.urlSecret = cfg.getOrThrow<string>('STORAGE_URL_SECRET');
    this.maxBytes = cfg.getOrThrow<number>('UPLOAD_MAX_BYTES');
  }

  async create(
    userId: string,
    file: Express.Multer.File,
  ): Promise<DocumentSummaryDto> {
    const detected = await detectFileType(file.buffer);
    if (
      !detected ||
      !ALLOWED_MIME.includes(detected.mime as (typeof ALLOWED_MIME)[number])
    ) {
      throw new BadRequestException({ code: 'upload.invalid_type' });
    }
    if (file.size > this.maxBytes) {
      throw new PayloadTooLargeException({ code: 'upload.too_large' });
    }

    const safeName = sanitizeFilename(file.originalname);
    const ext = mimeToExt(detected.mime);
    const contentHash = createHash('sha256').update(file.buffer).digest('hex');

    const duplicate = await this.findFinalDuplicate(userId, contentHash);
    if (duplicate) {
      const duplicateDoc = await this.createDuplicateDocument({
        userId,
        filename: safeName,
        mime: detected.mime,
        size: file.size,
        contentHash,
        original: duplicate,
      });
      this.logger.log(
        `Duplicate document created docId=${duplicateDoc.id} original=${this.canonicalDuplicateId(duplicate)} user=${userId} filename=${maskFilename(safeName)}`,
      );
      return toSummaryDto(duplicateDoc);
    }

    let created;
    try {
      // 2 etapas: cria row → put no volume → update storagePath final.
      // Permite usar o id gerado pelo Prisma no path do volume.
      created = await this.prisma.document.create({
        data: {
          userId,
          filename: safeName,
          mime: detected.mime,
          size: file.size,
          storagePath: 'pending',
          contentHash,
          status: DocumentStatus.QUEUED,
        },
      });
    } catch (err) {
      if (!this.isContentHashUniqueError(err)) throw err;
      return this.createDuplicateAfterRace({
        userId,
        filename: safeName,
        mime: detected.mime,
        size: file.size,
        contentHash,
      });
    }

    const storagePath = `${userId}/${created.id}/original.${ext}`;
    try {
      await this.storage.put(storagePath, file.buffer);
    } catch (err) {
      await this.prisma.document
        .delete({ where: { id: created.id } })
        .catch(() => undefined);
      throw err;
    }

    const updated = await this.prisma.document.update({
      where: { id: created.id },
      data: { storagePath },
    });

    await this.ocrQueue.add(
      'process',
      { documentId: updated.id },
      {
        jobId: updated.id,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 7 * 86400 },
      },
    );
    this.logger.log(
      `Document created docId=${updated.id} user=${userId} filename=${maskFilename(safeName)}`,
    );
    return toSummaryDto(updated);
  }

  private async findFinalDuplicate(userId: string, contentHash: string) {
    return this.prisma.document.findFirst({
      where: {
        userId,
        contentHash,
        status: { in: [...FINAL_DEDUP_STATUSES] },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findDuplicateRaceOriginal(userId: string, contentHash: string) {
    return this.prisma.document.findFirst({
      where: {
        userId,
        contentHash,
        status: { in: [...DEDUP_ORIGINAL_STATUSES] },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private canonicalDuplicateId(
    doc: Awaited<ReturnType<DocumentsService['findFinalDuplicate']>>,
  ): string {
    if (!doc) throw new NotFoundException();
    return doc.duplicateOfId ?? doc.id;
  }

  private async createDuplicateDocument(args: {
    userId: string;
    filename: string;
    mime: string;
    size: number;
    contentHash: string;
    original: NonNullable<
      Awaited<ReturnType<DocumentsService['findFinalDuplicate']>>
    >;
  }) {
    const duplicateOfId = this.canonicalDuplicateId(args.original);
    return this.prisma.document.create({
      data: {
        userId: args.userId,
        filename: args.filename,
        mime: args.mime,
        size: args.size,
        storagePath: `duplicate:${duplicateOfId}`,
        contentHash: args.contentHash,
        duplicateOfId,
        duplicateReason: 'content_hash',
        possibleDuplicateOfId: null,
        duplicateMatchStrength: 'strong',
        status: DocumentStatus.DUPLICATE,
      },
    });
  }

  private async createDuplicateAfterRace(args: {
    userId: string;
    filename: string;
    mime: string;
    size: number;
    contentHash: string;
  }): Promise<DocumentSummaryDto> {
    const original = await this.findDuplicateRaceOriginal(
      args.userId,
      args.contentHash,
    );
    if (!original) {
      this.logger.warn(
        `Content hash unique constraint hit but no original was found user=${args.userId}`,
      );
      throw new ConflictException({
        code: 'documents.duplicate_race_unresolved',
      });
    }
    const duplicateDoc = await this.createDuplicateDocument({
      ...args,
      original,
    });
    this.logger.log(
      `Duplicate document created after race docId=${duplicateDoc.id} original=${this.canonicalDuplicateId(original)} user=${args.userId} filename=${maskFilename(args.filename)}`,
    );
    return toSummaryDto(duplicateDoc);
  }

  private isContentHashUniqueError(err: unknown): boolean {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
    if (err.code !== 'P2002') return false;
    const target = err.meta?.target;
    if (Array.isArray(target)) return target.includes('contentHash');
    return typeof target === 'string' && target.includes('contentHash');
  }

  async list(
    userId: string,
    q: ListDocumentsQueryDto,
  ): Promise<DocumentSummaryDto[]> {
    const rows = await this.prisma.document.findMany({
      where: {
        userId,
        ...(q.status?.length ? { status: { in: q.status } } : {}),
        ...(q.updatedSince
          ? { updatedAt: { gt: new Date(q.updatedSince) } }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: q.limit ?? 50,
    });
    return rows.map(toSummaryDto);
  }

  async findOne(userId: string, id: string): Promise<DocumentDetailDto> {
    const doc = await this.prisma.document.findFirst({
      where: { id, userId },
    });
    if (!doc) throw new NotFoundException();
    return toDetailDto(doc, this.signFileUrl(doc.id, userId));
  }

  async retry(userId: string, id: string): Promise<DocumentSummaryDto> {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException();
    if (doc.status !== DocumentStatus.FAILED) {
      throw new ConflictException({ code: 'documents.retry.invalid_status' });
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.QUEUED,
        failureReason: null,
        ocrStartedAt: null,
        ocrCompletedAt: null,
      },
    });

    try {
      await this.ocrQueue.remove(id).catch(() => undefined);
      await this.ocrQueue.add(
        'process',
        { documentId: updated.id },
        {
          jobId: updated.id,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { age: 86400, count: 1000 },
          removeOnFail: { age: 7 * 86400 },
        },
      );
    } catch (err) {
      await this.prisma.document
        .update({
          where: { id },
          data: { status: DocumentStatus.FAILED, failureReason: 'queue_error' },
        })
        .catch(() => undefined);
      throw err;
    }
    this.logger.log(`Document retry docId=${id} user=${userId}`);
    return toSummaryDto(updated);
  }

  signFileUrl(docId: string, userId: string): string {
    const exp = Math.floor(Date.now() / 1000) + 15 * 60;
    const sig = createHmac('sha256', this.urlSecret)
      .update(`${docId}.${userId}.${exp}`)
      .digest('hex');
    return `/api/v1/documents/${docId}/file?token=${exp}.${sig}`;
  }

  async streamFile(id: string, token: string, res: Response): Promise<void> {
    const [expStr, sig] = (token ?? '').split('.');
    const exp = Number(expStr);
    if (!exp || exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException();
    }

    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException();

    const expected = createHmac('sha256', this.urlSecret)
      .update(`${id}.${doc.userId}.${exp}`)
      .digest('hex');
    const sigBuf = Buffer.from(sig ?? '', 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException();
    }

    const storageDoc = await this.resolveStorageDocument(doc);

    let buffer: Buffer;
    try {
      buffer = await this.storage.read(storageDoc.storagePath);
    } catch (err) {
      // Arquivo físico sumiu (volume recriado, perdido em redeploy sem volume,
      // etc.). Marca como FAILED para a UI parar de tentar ler e oferecer retry.
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'ENOENT') {
        await this.prisma.document.update({
          where: { id: storageDoc.id },
          data: {
            status: DocumentStatus.FAILED,
            failureReason: 'storage_missing',
          },
        });
        this.logger.warn(
          `Document file missing on disk docId=${storageDoc.id} path=${storageDoc.storagePath} → marked FAILED`,
        );
        throw new NotFoundException({ code: 'storage_missing' });
      }
      throw err;
    }
    res.setHeader('Content-Type', doc.mime);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeRFC5987(doc.filename)}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=900');
    res.end(buffer);
  }

  private async resolveStorageDocument(
    doc: NonNullable<
      Awaited<ReturnType<PrismaService['document']['findUnique']>>
    >,
  ) {
    if (doc.status !== DocumentStatus.DUPLICATE || !doc.duplicateOfId) {
      return doc;
    }
    const original = await this.prisma.document.findUnique({
      where: { id: doc.duplicateOfId },
    });
    if (!original) {
      throw new NotFoundException({ code: 'duplicate_original_missing' });
    }
    return original;
  }

  // ---- DocumentOps (consumido pelo OcrService) ----

  async markRunning(id: string): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.OCR_RUNNING,
        ocrStartedAt: new Date(),
      },
    });
  }

  async markReady(
    id: string,
    summary: InvoiceSummary,
    extractedText: string,
    semanticHash: string | null = null,
    duplicateSuggestion: ReadyDuplicateSuggestion | null = null,
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.READY,
        summary: summary as never,
        extractedText,
        semanticHash,
        ocrCompletedAt: new Date(),
        failureReason: null,
        duplicateOfId: null,
        duplicateReason: duplicateSuggestion?.duplicateReason ?? null,
        possibleDuplicateOfId:
          duplicateSuggestion?.possibleDuplicateOfId ?? null,
        duplicateMatchStrength:
          duplicateSuggestion?.duplicateMatchStrength ?? null,
      },
    });
  }

  async findReadySemanticDuplicate(
    id: string,
    semanticHash: string,
  ): Promise<{ id: string } | null> {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!doc) return null;

    return this.prisma.document.findFirst({
      where: {
        userId: doc.userId,
        semanticHash,
        status: DocumentStatus.READY,
        id: { not: id },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markDuplicate(
    id: string,
    duplicateOfId: string,
    reason: string,
    partial: InvoiceSummaryResult,
    semanticHash: string,
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.DUPLICATE,
        duplicateOfId,
        duplicateReason: reason,
        possibleDuplicateOfId: null,
        duplicateMatchStrength: 'strong',
        semanticHash,
        documentType: partial.documentType,
        confidence: partial.confidence,
        summary: partial.summary as never,
        extractedText: partial.extractedText,
        failureReason: null,
        rejectionReason: null,
        ocrCompletedAt: new Date(),
      },
    });
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.FAILED,
        failureReason: reason,
        retryCount: { increment: 1 },
        ocrCompletedAt: new Date(),
      },
    });
  }

  async markRejected(
    id: string,
    reason: 'low_confidence' | 'unsupported_type',
    partial: InvoiceSummaryResult,
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.REJECTED,
        documentType: partial.documentType,
        confidence: partial.confidence,
        rejectionReason: reason,
        summary: partial.summary as never,
        extractedText: partial.extractedText,
        ocrCompletedAt: new Date(),
      },
    });
  }

  async updateSummary(
    userId: string,
    id: string,
    summary: InvoiceSummary,
  ): Promise<DocumentDetailDto> {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException();
    if (doc.status !== DocumentStatus.READY) {
      throw new BadRequestException({ code: 'documents.update.not_ready' });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.documentEdit.create({
        data: {
          documentId: id,
          editedBy: userId,
          before: doc.summary ?? {},
          after: summary,
        },
      });
      return tx.document.update({
        where: { id },
        data: {
          summary: summary,
          verifiedAt: new Date(),
          verifiedBy: userId,
        },
      });
    });

    return toDetailDto(updated, this.signFileUrl(id, userId));
  }

  async listEdits(
    userId: string,
    documentId: string,
  ): Promise<DocumentEditDto[]> {
    // Ownership check explícito antes de listar — não exibir histórico de
    // documento de outro user, mesmo se o ID for adivinhado.
    const owns = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true },
    });
    if (!owns) throw new NotFoundException();

    const rows = await this.prisma.documentEdit.findMany({
      where: { documentId, document: { userId } },
      include: { editor: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEditDto);
  }

  async findByIdInternal(
    id: string,
  ): Promise<{ id: string; mime: string; storagePath: string } | null> {
    return this.prisma.document.findUnique({
      where: { id },
      select: { id: true, mime: true, storagePath: true },
    });
  }
}

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { DocumentStatus } from '@prisma/client';
import { detectFileType } from './helpers/detect-file-type';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../storage/storage.service';
import type { InvoiceSummary } from '../ocr/schemas/invoice-summary.schema';
import type { DocumentOps } from '../ocr/ocr.service';
import { DocumentUploadedEvent } from './events/document-uploaded.event';
import { sanitizeFilename } from './helpers/sanitize-filename';
import { mimeToExt } from './helpers/mime-to-ext';
import { maskFilename } from './helpers/mask-filename';
import { encodeRFC5987 } from './helpers/encode-rfc5987';
import {
  type DocumentSummaryDto,
  toSummaryDto,
} from './dto/document-summary.dto';
import { type DocumentDetailDto, toDetailDto } from './dto/document-detail.dto';
import type { ListDocumentsQueryDto } from './dto/list-documents.query.dto';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;

@Injectable()
export class DocumentsService implements DocumentOps {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly urlSecret: string;
  private readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly events: EventEmitter2,
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

    // 2 etapas: cria row → put no volume → update storagePath final.
    // Permite usar o id gerado pelo Prisma no path do volume.
    const created = await this.prisma.document.create({
      data: {
        userId,
        filename: safeName,
        mime: detected.mime,
        size: file.size,
        storagePath: 'pending',
        status: DocumentStatus.QUEUED,
      },
    });

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

    this.events.emit(
      DocumentUploadedEvent.NAME,
      new DocumentUploadedEvent(updated.id),
    );
    this.logger.log(
      `Document created docId=${updated.id} user=${userId} filename=${maskFilename(safeName)}`,
    );
    return toSummaryDto(updated);
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
      take: 50,
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

    const buffer = await this.storage.read(doc.storagePath);
    res.setHeader('Content-Type', doc.mime);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeRFC5987(doc.filename)}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=900');
    res.end(buffer);
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
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.READY,
        summary: summary as never,
        extractedText,
        ocrCompletedAt: new Date(),
        failureReason: null,
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

  async findByIdInternal(
    id: string,
  ): Promise<{ id: string; mime: string; storagePath: string } | null> {
    return this.prisma.document.findUnique({
      where: { id },
      select: { id: true, mime: true, storagePath: true },
    });
  }
}

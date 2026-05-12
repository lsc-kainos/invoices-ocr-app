import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DocumentStatus } from '@prisma/client';
import { detectFileType } from './helpers/detect-file-type';
import { PrismaService } from '../prisma/prisma.service';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../storage/storage.service';
import type { InvoiceSummary } from '../ocr/schemas/invoice-summary.schema';
import { sanitizeFilename } from './helpers/sanitize-filename';
import { mimeToExt } from './helpers/mime-to-ext';
import { maskFilename } from './helpers/mask-filename';
import { FileDeliveryService } from './file-delivery.service';
import {
  type DocumentSummaryDto,
  toSummaryDto,
} from './dto/document-summary.dto';
import { type DocumentDetailDto, toDetailDto } from './dto/document-detail.dto';
import { type DocumentEditDto, toEditDto } from './dto/document-edit.dto';
import type { ListDocumentsQueryDto } from './dto/list-documents.query.dto';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly events: EventEmitter2,
    private readonly fileDelivery: FileDeliveryService,
    cfg: ConfigService,
  ) {
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

    this.events.emit('document.created', {
      documentId: updated.id,
      userId,
    });
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
      take: q.limit ?? 50,
    });
    return rows.map(toSummaryDto);
  }

  async findOne(userId: string, id: string): Promise<DocumentDetailDto> {
    const doc = await this.prisma.document.findFirst({
      where: { id, userId },
    });
    if (!doc) throw new NotFoundException();
    return toDetailDto(doc, this.fileDelivery.signUrl(doc.id, userId));
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
      this.events.emit('document.created', {
        documentId: updated.id,
        userId: doc.userId,
      });
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

    return toDetailDto(updated, this.fileDelivery.signUrl(id, userId));
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
    userId: string,
  ): Promise<{ id: string; mime: string; storagePath: string } | null> {
    return this.prisma.document.findFirst({
      where: { id, userId },
      select: { id: true, mime: true, storagePath: true },
    });
  }
}

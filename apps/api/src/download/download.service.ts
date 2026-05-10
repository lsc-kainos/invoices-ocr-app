import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import archiver from 'archiver';
import { Readable } from 'node:stream';
import { ChatRole, DocumentStatus } from '@prisma/client';
import type { InvoiceSummary } from '@invoices-ocr/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../storage/storage.service';
import { mimeToExt } from './helpers/mime-to-ext';
import { sanitizeFilenameForZip } from './helpers/sanitize-filename';
import { buildExtractedTextFile } from './helpers/extracted-text-file';
import { buildChatTranscript } from './helpers/chat-transcript';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async buildArchive(
    userId: string,
    documentId: string,
  ): Promise<{ stream: Readable; filename: string }> {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      select: {
        id: true,
        filename: true,
        mime: true,
        storagePath: true,
        status: true,
        extractedText: true,
        summary: true,
      },
    });
    if (!doc) throw new NotFoundException();
    if (doc.status !== DocumentStatus.READY) {
      throw new ConflictException({ code: 'document_not_ready' });
    }

    const session = await this.prisma.chatSession.findFirst({
      where: { userId, documentId: doc.id },
      include: {
        messages: {
          where: { role: { not: ChatRole.TOOL } },
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true, createdAt: true },
        },
      },
    });

    const extractedBuf = buildExtractedTextFile(doc.extractedText);
    const summary = doc.summary as InvoiceSummary | null;
    const narrative = summary?.narrative;
    const narrativeBuf = buildExtractedTextFile(
      typeof narrative === 'string' ? narrative : null,
    );
    const transcriptStr = buildChatTranscript(doc, session);

    let originalBuf: Buffer;
    try {
      originalBuf = await this.storage.read(doc.storagePath);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      // Arquivo físico sumiu — marca FAILED e devolve 404. UI mostra
      // mensagem clara em vez de "tente de novo" indefinido.
      if (code === 'ENOENT') {
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: DocumentStatus.FAILED,
            failureReason: 'storage_missing',
          },
        });
        this.logger.warn({
          event: 'download.storage_missing',
          documentId,
          path: doc.storagePath,
        });
        throw new NotFoundException({ code: 'storage_missing' });
      }
      this.logger.error({ event: 'download.storage_failed', documentId, err });
      throw new ServiceUnavailableException({ code: 'storage_unavailable' });
    }

    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('warning', (err: Error & { code?: string }) => {
      if (err.code !== 'ENOENT')
        this.logger.warn({ event: 'download.zip_warning', err });
    });
    archive.on('error', (err) => {
      this.logger.error({ event: 'download.zip_error', documentId, err });
    });
    archive.on('end', () => {
      this.logger.log({
        event: 'download.completed',
        userId,
        documentId,
        bytes: archive.pointer(),
      });
    });

    const ext = mimeToExt(doc.mime);
    archive.append(originalBuf, { name: `original.${ext}` });
    archive.append(extractedBuf, { name: 'extracted-text.txt' });
    archive.append(narrativeBuf, { name: 'narrative.txt' });
    archive.append(transcriptStr, { name: 'chat-transcript.md' });
    void archive.finalize();

    return {
      stream: archive,
      filename: `${sanitizeFilenameForZip(doc.filename)}.zip`,
    };
  }
}

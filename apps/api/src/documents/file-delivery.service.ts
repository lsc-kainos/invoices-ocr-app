import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../storage/storage.service';
import { encodeRFC5987 } from './helpers/encode-rfc5987';
import type { Response } from 'express';

@Injectable()
export class FileDeliveryService {
  private readonly urlSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    cfg: ConfigService,
  ) {
    this.urlSecret = cfg.getOrThrow<string>('STORAGE_URL_SECRET');
  }

  signUrl(docId: string, userId: string): string {
    const exp = Math.floor(Date.now() / 1000) + 15 * 60;
    const sig = createHmac('sha256', this.urlSecret)
      .update(`${docId}.${userId}.${exp}`)
      .digest('hex');
    return `/api/v1/documents/${docId}/file?token=${exp}.${sig}`;
  }

  async streamFile(id: string, token: string, res: Response): Promise<void> {
    const [expStr, sig] = (token ?? '').split('.');
    const exp = Number(expStr);

    // Validação do token PRIMEIRO, antes de tocar no banco.
    // Qualquer falha retorna 404 genérico para evitar enumeração de IDs.
    if (!exp || exp < Math.floor(Date.now() / 1000)) {
      throw new NotFoundException();
    }

    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException();

    const expected = createHmac('sha256', this.urlSecret)
      .update(`${id}.${doc.userId}.${exp}`)
      .digest('hex');
    const sigBuf = Buffer.from(sig ?? '', 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new NotFoundException();
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
}

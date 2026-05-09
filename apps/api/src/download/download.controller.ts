import { Controller, Get, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DownloadService } from './download.service';

@Controller('api/v1/documents')
export class DownloadController {
  constructor(private readonly download: DownloadService) {}

  @Get(':id/download')
  @Throttle({ download: { ttl: 60_000, limit: 10 } })
  async downloadDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { stream, filename } = await this.download.buildArchive(
      user.id,
      documentId,
    );

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');

    stream.pipe(res);
  }
}

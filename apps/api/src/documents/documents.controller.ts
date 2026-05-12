import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { DocumentsService } from './documents.service';
import { FileDeliveryService } from './file-delivery.service';
import { ListDocumentsQueryDto } from './dto/list-documents.query.dto';
import { UpdateDocumentSummaryDto } from './dto/update-document-summary.dto';
import type { DocumentSummaryDto } from './dto/document-summary.dto';
import type { DocumentDetailDto } from './dto/document-detail.dto';
import type { DocumentEditDto } from './dto/document-edit.dto';

const TEN_MB = 10 * 1024 * 1024;

@Controller('api/v1/documents')
@SkipThrottle({ benchmark: true })
export class DocumentsController {
  constructor(
    private readonly docs: DocumentsService,
    private readonly fileDelivery: FileDeliveryService,
  ) {}

  @Post()
  @Throttle({ upload: { ttl: 60_000, limit: 30 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TEN_MB } }))
  create(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentSummaryDto> {
    return this.docs.create(user.id, file);
  }

  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 1200 } })
  @SkipThrottle({ upload: true, ocr: true })
  list(
    @CurrentUser() user: User,
    @Query() query: ListDocumentsQueryDto,
  ): Promise<DocumentSummaryDto[]> {
    return this.docs.list(user.id, query);
  }

  @Get(':id')
  @Throttle({ default: { ttl: 60_000, limit: 1200 } })
  @SkipThrottle({ upload: true, ocr: true })
  findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<DocumentDetailDto> {
    return this.docs.findOne(user.id, id);
  }

  @Get(':id/edits')
  @Throttle({ default: { ttl: 60_000, limit: 600 } })
  @SkipThrottle({ upload: true, ocr: true })
  listEdits(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<DocumentEditDto[]> {
    return this.docs.listEdits(user.id, id);
  }

  @Post(':id/retry')
  @Throttle({ upload: { ttl: 60_000, limit: 30 } })
  retry(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<DocumentSummaryDto> {
    return this.docs.retry(user.id, id);
  }

  @Patch(':id/summary')
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  updateSummary(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateDocumentSummaryDto,
  ): Promise<DocumentDetailDto> {
    return this.docs.updateSummary(user.id, id, body.summary);
  }

  @Public()
  @Get(':id/file')
  @Throttle({ default: { ttl: 60_000, limit: 300 } })
  @SkipThrottle({ upload: true, ocr: true })
  getFile(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    return this.fileDelivery.streamFile(id, token, res);
  }
}

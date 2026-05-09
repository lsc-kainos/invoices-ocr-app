import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { DocumentsService } from './documents.service';
import { ListDocumentsQueryDto } from './dto/list-documents.query.dto';
import type { DocumentSummaryDto } from './dto/document-summary.dto';
import type { DocumentDetailDto } from './dto/document-detail.dto';

const TEN_MB = 10 * 1024 * 1024;

@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Post()
  @Throttle({ upload: { ttl: 60_000, limit: 5 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TEN_MB } }))
  create(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentSummaryDto> {
    return this.docs.create(user.id, file);
  }

  @Get()
  list(
    @CurrentUser() user: User,
    @Query() query: ListDocumentsQueryDto,
  ): Promise<DocumentSummaryDto[]> {
    return this.docs.list(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<DocumentDetailDto> {
    return this.docs.findOne(user.id, id);
  }

  @Post(':id/retry')
  @Throttle({ upload: { ttl: 60_000, limit: 5 } })
  retry(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<DocumentSummaryDto> {
    return this.docs.retry(user.id, id);
  }

  @Public()
  @Get(':id/file')
  getFile(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    return this.docs.streamFile(id, token, res);
  }
}

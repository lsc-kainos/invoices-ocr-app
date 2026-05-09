import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto, ListSessionsQueryDto } from './dto';

@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('sessions')
  @Throttle({ chat: { ttl: 60_000, limit: 15 } })
  async createSession(@CurrentUser() user: { id: string }) {
    return this.chat.createSession(user.id);
  }

  @Get('sessions')
  @Throttle({ chat: { ttl: 60_000, limit: 15 } })
  async listSessions(
    @CurrentUser() user: { id: string },
    @Query() q: ListSessionsQueryDto,
  ) {
    return this.chat.listSessions(user.id, q.limit);
  }

  @Get('sessions/:id/messages')
  @Throttle({ chat: { ttl: 60_000, limit: 15 } })
  async listMessages(
    @CurrentUser() user: { id: string },
    @Param('id') sessionId: string,
    @Query('includeTool') includeTool?: string,
  ) {
    return this.chat.listMessages(user.id, sessionId, includeTool === 'true');
  }

  @Post('sessions/:id/messages')
  @Throttle({ chat: { ttl: 60_000, limit: 15 } })
  async sendWorkspaceMessage(
    @CurrentUser() user: { id: string },
    @Param('id') sessionId: string,
    @Body() body: SendMessageDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const wantsStream =
      req.headers.accept?.includes('text/event-stream') &&
      this.chat.streamingEnabled;
    if (wantsStream) {
      const result = await this.chat.sendWorkspaceMessage(
        user.id,
        sessionId,
        body.content,
      );
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Accel-Buffering', 'no');
      res.write(`data: ${JSON.stringify({ delta: result.content })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }
    return this.chat.sendWorkspaceMessage(user.id, sessionId, body.content);
  }

  @Get('documents/:documentId/messages')
  @Throttle({ chat: { ttl: 60_000, limit: 15 } })
  async listDocumentMessages(
    @CurrentUser() user: { id: string },
    @Param('documentId') documentId: string,
    @Query('includeTool') includeTool?: string,
  ) {
    return this.chat.listDocumentMessages(
      user.id,
      documentId,
      includeTool === 'true',
    );
  }

  @Post('documents/:documentId/messages')
  @Throttle({ chat: { ttl: 60_000, limit: 15 } })
  async sendDocumentMessage(
    @CurrentUser() user: { id: string },
    @Param('documentId') documentId: string,
    @Body() body: SendMessageDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const wantsStream =
      req.headers.accept?.includes('text/event-stream') &&
      this.chat.streamingEnabled;
    if (wantsStream) {
      const result = await this.chat.sendDocumentMessage(
        user.id,
        documentId,
        body.content,
      );
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Accel-Buffering', 'no');
      res.write(`data: ${JSON.stringify({ delta: result.content })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }
    return this.chat.sendDocumentMessage(user.id, documentId, body.content);
  }

  @Delete('documents/:documentId/messages')
  @Throttle({ chat: { ttl: 60_000, limit: 15 } })
  @HttpCode(204)
  async clearDocumentMessages(
    @CurrentUser() user: { id: string },
    @Param('documentId') documentId: string,
  ) {
    await this.chat.clearDocumentMessages(user.id, documentId);
  }
}

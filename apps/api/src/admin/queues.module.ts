import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { RequestHandler, Request, Response, NextFunction } from 'express';
import { OCR_QUEUE_NAME } from '../ocr/queues/ocr.queue';

function createBasicAuth(user: string, password: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers['authorization'];
    if (!header?.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      res.status(401).end('Unauthorized');
      return;
    }
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
    const colon = decoded.indexOf(':');
    const u = decoded.slice(0, colon);
    const p = decoded.slice(colon + 1);
    if (u !== user || p !== password) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      res.status(401).end('Unauthorized');
      return;
    }
    next();
  };
}

@Module({
  imports: [
    BullBoardModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({
        route: '/admin/queues',
        adapter: ExpressAdapter,
        middleware: createBasicAuth(
          cfg.getOrThrow<string>('BULL_BOARD_BASIC_AUTH_USER'),
          cfg.getOrThrow<string>('BULL_BOARD_BASIC_AUTH_PASSWORD'),
        ),
      }),
      inject: [ConfigService],
    }),
    BullBoardModule.forFeature({
      name: OCR_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
  ],
})
export class QueuesAdminModule {}

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OCR_QUEUE_NAME, type OcrJobData } from './queues/ocr.queue';

@Injectable()
export class OcrEventListener {
  constructor(
    @InjectQueue(OCR_QUEUE_NAME) private readonly queue: Queue<OcrJobData>,
  ) {}

  @OnEvent('document.created')
  async handleDocumentCreated(payload: {
    documentId: string;
    userId: string;
  }): Promise<void> {
    await this.queue.add('process', payload, {
      jobId: payload.documentId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 7 * 86400 },
    });
  }
}

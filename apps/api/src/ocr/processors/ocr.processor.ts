import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OcrService } from '../ocr.service';
import type { OcrJobData } from '../queues/ocr.queue';
import { OCR_QUEUE_NAME } from '../queues/ocr.queue';

@Processor(OCR_QUEUE_NAME, { concurrency: 2 })
export class OcrProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    private readonly ocr: OcrService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<OcrJobData>): Promise<void> {
    await this.ocr.process(job.data.documentId, job.data.userId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<OcrJobData>, err: Error): Promise<void> {
    this.logger.error(
      `OCR job esgotou tentativas docId=${job.data.documentId} attempts=${job.attemptsMade}`,
      err.message,
    );
    await this.prisma.document.update({
      where: { id: job.data.documentId },
      data: {
        status: DocumentStatus.FAILED,
        failureReason: 'transient_exhausted',
        retryCount: { increment: 1 },
        ocrCompletedAt: new Date(),
      },
    });
  }
}

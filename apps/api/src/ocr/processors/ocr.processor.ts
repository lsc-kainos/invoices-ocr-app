import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OcrService } from '../ocr.service';
import type { OcrJobData } from '../queues/ocr.queue';
import { OCR_QUEUE_NAME } from '../queues/ocr.queue';

@Processor(OCR_QUEUE_NAME, { concurrency: 2 })
export class OcrProcessor extends WorkerHost {
  constructor(private readonly ocr: OcrService) {
    super();
  }

  async process(job: Job<OcrJobData>): Promise<void> {
    await this.ocr.process(job.data.documentId);
  }
}

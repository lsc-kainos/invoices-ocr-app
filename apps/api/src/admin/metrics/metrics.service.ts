import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { OCR_QUEUE_NAME } from '../../ocr/queues/ocr.queue';
import type {
  MetricsResponseDto,
  DocumentMetrics,
  ChatMetrics,
  QueueMetrics,
  UserMetrics,
  DailyPoint,
} from './dto/metrics-response.dto';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(OCR_QUEUE_NAME) private readonly ocrQueue: Queue,
  ) {}

  async getMetrics(): Promise<MetricsResponseDto> {
    const [documents, chat, queue, users, timeSeries] = await Promise.all([
      this.getDocumentMetrics(),
      this.getChatMetrics(),
      this.getQueueMetrics(),
      this.getUserMetrics(),
      this.getTimeSeries(),
    ]);

    return {
      documents,
      chat,
      queue,
      users,
      timeSeries,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getDocumentMetrics(): Promise<DocumentMetrics> {
    const [statusGroups, total, retried, avgResult] = await Promise.all([
      this.prisma.document.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.document.count(),
      this.prisma.document.count({ where: { retryCount: { gt: 0 } } }),
      // $queryRaw returns BigInt for aggregates — must convert via Number()
      this.prisma.$queryRaw<[{ avg_ms: number | null }]>`
        SELECT AVG(
          EXTRACT(EPOCH FROM ("ocrCompletedAt" - "ocrStartedAt")) * 1000
        )::float AS avg_ms
        FROM "Document"
        WHERE "ocrStartedAt" IS NOT NULL
          AND "ocrCompletedAt" IS NOT NULL
          AND status = 'READY'
      `,
    ]);

    const byStatus: DocumentMetrics['byStatus'] = {
      READY: 0,
      FAILED: 0,
      REJECTED: 0,
      QUEUED: 0,
      OCR_RUNNING: 0,
    };
    for (const g of statusGroups) {
      byStatus[g.status] = g._count.status;
    }

    return {
      total,
      byStatus,
      avgOcrDurationMs: avgResult[0]?.avg_ms ?? null,
      retryRate: total > 0 ? retried / total : 0,
    };
  }

  private async getChatMetrics(): Promise<ChatMetrics> {
    const since30d = new Date(Date.now() - THIRTY_DAYS_MS);

    const [totalMessages, totalSessions, activeSessions] = await Promise.all([
      // Exclude TOOL role messages — they inflate the user-visible count
      this.prisma.chatMessage.count({
        where: { role: { in: ['USER', 'ASSISTANT'] } },
      }),
      this.prisma.chatSession.count(),
      this.prisma.chatSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: since30d } },
      }),
    ]);

    return {
      totalMessages,
      totalSessions,
      activeUsers30d: activeSessions.length,
    };
  }

  private async getQueueMetrics(): Promise<QueueMetrics> {
    try {
      const counts = await this.ocrQueue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused',
      );
      return {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
        paused: counts.paused ?? 0,
      };
    } catch (err) {
      // Redis unavailable — return zeros so the rest of the metrics page still renders
      this.logger.warn('Queue metrics unavailable (Redis unreachable)', err);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      };
    }
  }

  private async getUserMetrics(): Promise<UserMetrics> {
    const since30d = new Date(Date.now() - THIRTY_DAYS_MS);
    const [total, new30d] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: since30d } } }),
    ]);
    return { total, new30d };
  }

  private async getTimeSeries(): Promise<DailyPoint[]> {
    const since = new Date(Date.now() - FOURTEEN_DAYS_MS);

    // $queryRaw returns BigInt for COUNT — explicit Number() conversion required
    const rows = await this.prisma.$queryRaw<
      Array<{ day: Date; count: bigint; success_count: bigint }>
    >`
      SELECT
        DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day,
        COUNT(*)                                            AS count,
        COUNT(*) FILTER (WHERE status = 'READY')           AS success_count
      FROM "Document"
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return this.backfill14Days(
      rows.map((r) => ({
        date: r.day.toISOString().slice(0, 10),
        count: Number(r.count),
        successCount: Number(r.success_count),
      })),
    );
  }

  private backfill14Days(rows: DailyPoint[]): DailyPoint[] {
    const byDate = new Map(rows.map((r) => [r.date, r]));
    const result: DailyPoint[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      result.push(byDate.get(key) ?? { date: key, count: 0, successCount: 0 });
    }

    return result;
  }
}

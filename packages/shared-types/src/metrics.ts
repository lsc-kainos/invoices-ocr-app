export interface DailyPoint {
  date: string; // 'YYYY-MM-DD'
  count: number;
  successCount: number;
}

export interface DocumentMetrics {
  total: number;
  byStatus: Record<'READY' | 'FAILED' | 'REJECTED' | 'QUEUED' | 'OCR_RUNNING', number>;
  avgOcrDurationMs: number | null;
  retryRate: number; // 0–1 fraction of docs that ever needed a retry
}

export interface ChatMetrics {
  totalMessages: number;
  totalSessions: number;
  activeUsers30d: number;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface UserMetrics {
  total: number;
  new30d: number;
}

export interface MetricsResponseDto {
  documents: DocumentMetrics;
  chat: ChatMetrics;
  queue: QueueMetrics;
  users: UserMetrics;
  timeSeries: DailyPoint[]; // 14 entries oldest→newest, missing days backfilled to 0
  generatedAt: string; // ISO timestamp
}

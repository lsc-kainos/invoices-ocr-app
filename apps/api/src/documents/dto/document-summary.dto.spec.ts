import { toSummaryDto } from './document-summary.dto';

describe('toSummaryDto', () => {
  const baseDoc = {
    id: 'doc1',
    userId: 'u1',
    filename: 'nf.pdf',
    mime: 'application/pdf',
    size: 1024,
    storagePath: 'u1/doc1/original.pdf',
    status: 'FAILED' as const,
    failureReason: 'rate_limit',
    retryCount: 2,
    summary: null,
    extractedText: null,
    ocrStartedAt: null,
    ocrCompletedAt: null,
    documentType: null,
    confidence: null,
    rejectionReason: null,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: new Date('2026-05-09T00:00:00Z'),
    updatedAt: new Date('2026-05-09T00:00:01Z'),
  };

  it('mapeia retryCount do row Prisma', () => {
    const dto = toSummaryDto(baseDoc);
    expect(dto.retryCount).toBe(2);
  });

  it('mantém retryCount=0 em doc novo', () => {
    const dto = toSummaryDto({ ...baseDoc, retryCount: 0 });
    expect(dto.retryCount).toBe(0);
  });
});

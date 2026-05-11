import { toSummaryDto } from './document-summary.dto';

describe('toSummaryDto', () => {
  const baseDoc = {
    id: 'doc1',
    userId: 'u1',
    filename: 'nf.pdf',
    mime: 'application/pdf',
    size: 1024,
    storagePath: 'u1/doc1/original.pdf',
    contentHash: null,
    semanticHash: null,
    duplicateOfId: null,
    duplicateReason: null,
    possibleDuplicateOfId: null,
    duplicateMatchStrength: null,
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

  it('mapeia vínculo com documento original quando é duplicado', () => {
    const dto = toSummaryDto({
      ...baseDoc,
      duplicateOfId: 'doc-original',
      duplicateReason: 'nfe_access_key',
    });
    expect(dto.duplicateOfId).toBe('doc-original');
    expect(dto.duplicateReason).toBe('nfe_access_key');
  });

  it('mapeia sugestão de duplicata sem alterar status', () => {
    const dto = toSummaryDto({
      ...baseDoc,
      status: 'READY',
      possibleDuplicateOfId: 'doc-original',
      duplicateReason: 'document_identity',
      duplicateMatchStrength: 'needs_confirmation',
    });
    expect(dto.status).toBe('READY');
    expect(dto.possibleDuplicateOfId).toBe('doc-original');
    expect(dto.duplicateReason).toBe('document_identity');
    expect(dto.duplicateMatchStrength).toBe('needs_confirmation');
  });

  it('mantém retryCount=0 em doc novo', () => {
    const dto = toSummaryDto({ ...baseDoc, retryCount: 0 });
    expect(dto.retryCount).toBe(0);
  });
});

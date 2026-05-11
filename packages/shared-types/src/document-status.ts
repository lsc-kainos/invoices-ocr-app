// Espelha o enum DocumentStatus do Prisma como union de strings.
// Evita o web depender do client gerado para um tipo trivial.
export type DocumentStatus = 'QUEUED' | 'OCR_RUNNING' | 'READY' | 'FAILED' | 'REJECTED';

export const DOCUMENT_STATUSES: ReadonlyArray<DocumentStatus> = [
  'QUEUED',
  'OCR_RUNNING',
  'READY',
  'FAILED',
  'REJECTED',
];

export const ACTIVE_DOCUMENT_STATUSES: ReadonlyArray<DocumentStatus> = ['QUEUED', 'OCR_RUNNING'];

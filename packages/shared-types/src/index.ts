export const SHARED_TYPES_PACKAGE_VERSION = '0.0.0';

// Role do User. Espelha o enum gerado pelo Prisma na API, mas declarado
// como string literal aqui pra que o web possa importar sem depender de
// @prisma/client. Mantém objeto-as-const pra preservar uso `Role.ADMIN`.
export type Role = 'USER' | 'ADMIN';
export const Role = { USER: 'USER', ADMIN: 'ADMIN' } as const satisfies Record<string, Role>;

export type { DocumentStatus } from './document-status';
export { DOCUMENT_STATUSES, ACTIVE_DOCUMENT_STATUSES } from './document-status';
export type { InvoiceCore, InvoiceItem, InvoiceExtra, InvoiceSummary } from './invoice-summary';
export type { DocumentSummary } from './document-summary';
export type { DocumentDetail } from './document-detail';

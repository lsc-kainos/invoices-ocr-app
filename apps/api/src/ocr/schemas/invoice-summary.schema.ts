import { z } from 'zod';

export const documentTypeSchema = z.enum([
  'nf-e',
  'nfs-e',
  'boleto',
  'invoice',
  'receipt',
  'unknown',
]);

export type DocumentType = z.infer<typeof documentTypeSchema>;

export const invoiceCoreSchema = z.object({
  // Keep this field required (nullable when absent) for OpenAI Structured
  // Outputs strict JSON Schema compatibility: every object property must be
  // listed in `required`, otherwise the API rejects the response_format schema.
  accessKey: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  invoiceDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  sellerName: z.string().nullable(),
  sellerAddress: z.string().nullable(),
  clientName: z.string().nullable(),
  clientAddress: z.string().nullable(),
  tax: z.string().nullable(),
  discount: z.string().nullable(),
  total: z.string().nullable(),
  paymentMethod: z.string().nullable(),
});

export const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.string().nullable(),
  unitPrice: z.string().nullable(),
  totalPrice: z.string().nullable(),
});

export const invoiceExtraSchema = z.object({
  label: z.string(),
  value: z.string(),
  mono: z.boolean().nullable(),
});

export const invoiceSummarySchema = z.object({
  documentType: documentTypeSchema,
  confidence: z.number().min(0).max(1),
  summary: z.object({
    core: invoiceCoreSchema,
    items: z.array(invoiceItemSchema),
    extras: z.array(invoiceExtraSchema),
    narrative: z.string(),
  }),
  extractedText: z.string(),
});

export type InvoiceCore = z.infer<typeof invoiceCoreSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type InvoiceExtra = z.infer<typeof invoiceExtraSchema>;
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>['summary'];
export type InvoiceSummaryResult = z.infer<typeof invoiceSummarySchema>;

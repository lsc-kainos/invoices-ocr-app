import { z } from 'zod';

export const invoiceCoreSchema = z.object({
  tipo: z.enum(['NF-e', 'NFS-e', 'Boleto', 'Recibo', 'Outro']).nullable(),
  numero: z.string().nullable(),
  dataEmissao: z.string().nullable(),
  cnpjEmitente: z.string().nullable(),
  razaoSocial: z.string().nullable(),
  cnpjDestinatario: z.string().nullable(),
  razaoSocialDestinatario: z.string().nullable(),
  valorTotal: z.string().nullable(),
  chaveAcesso: z.string().nullable(),
  cfop: z.string().nullable(),
});

export const invoiceExtraSchema = z.object({
  label: z.string(),
  value: z.string(),
  mono: z.boolean().nullable(),
});

export const invoiceSummarySchema = z.object({
  summary: z.object({
    core: invoiceCoreSchema,
    extras: z.array(invoiceExtraSchema),
  }),
  extractedText: z.string(),
});

export type InvoiceCore = z.infer<typeof invoiceCoreSchema>;
export type InvoiceExtra = z.infer<typeof invoiceExtraSchema>;
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>['summary'];
export type InvoiceSummaryResult = z.infer<typeof invoiceSummarySchema>;

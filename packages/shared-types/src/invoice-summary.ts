export type InvoiceTipo = 'NF-e' | 'NFS-e' | 'Boleto' | 'Recibo' | 'Outro';

export interface InvoiceCore {
  tipo: InvoiceTipo | null;
  numero: string | null;
  dataEmissao: string | null;
  cnpjEmitente: string | null;
  razaoSocial: string | null;
  cnpjDestinatario: string | null;
  razaoSocialDestinatario: string | null;
  valorTotal: string | null;
  chaveAcesso: string | null;
  cfop: string | null;
}

export interface InvoiceExtra {
  label: string;
  value: string;
  mono: boolean | null;
}

export interface InvoiceSummary {
  core: InvoiceCore;
  extras: InvoiceExtra[];
}

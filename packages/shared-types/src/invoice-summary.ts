export interface InvoiceCore {
  sellerTaxId?: string | null;
  clientTaxId?: string | null;
  accessKey?: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  sellerName: string | null;
  sellerAddress: string | null;
  clientName: string | null;
  clientAddress: string | null;
  tax: string | null;
  discount: string | null;
  total: string | null;
  totalAmountCents?: number | null;
  paymentMethod: string | null;
}

export interface InvoiceItem {
  description: string;
  quantity: string | null;
  unitPrice: string | null;
  totalPrice: string | null;
}

export interface InvoiceExtra {
  label: string;
  value: string;
  mono: boolean | null;
}

export interface InvoiceSummary {
  core: InvoiceCore;
  items: InvoiceItem[];
  extras: InvoiceExtra[];
  narrative: string;
}

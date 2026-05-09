import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { OcrProvider } from './ocr-provider.interface';
import type { InvoiceSummaryResult } from '../schemas/invoice-summary.schema';

// TODO(f2.5): rewrite mock fixtures with realistic universal-schema data
const FIXTURES: InvoiceSummaryResult[] = [
  {
    summary: {
      core: {
        invoiceNumber: '0023117',
        invoiceDate: '2026-04-22',
        dueDate: null,
        sellerName: 'Construtora Vega Ltda.',
        sellerAddress: null,
        clientName: 'Cliente Mock S/A',
        clientAddress: null,
        tax: null,
        discount: null,
        total: 'R$ 184.520,00',
        paymentMethod: null,
      },
      items: [],
      narrative: '',
      extras: [
        { label: 'CNPJ Emitente', value: '12.345.678/0001-90', mono: true },
        { label: 'CNPJ Destinatário', value: '98.765.432/0001-10', mono: true },
        {
          label: 'Chave NF-e',
          value: '35260412345678000190550010000231171123456789',
          mono: true,
        },
        { label: 'CFOP', value: '5102', mono: true },
        {
          label: 'Natureza da operação',
          value: 'Venda de mercadoria',
          mono: null,
        },
        {
          label: 'Protocolo de autorização',
          value: '135260023456789',
          mono: true,
        },
      ],
    },
    extractedText:
      'NOTA FISCAL ELETRÔNICA\nEMITENTE: Construtora Vega Ltda.\nCNPJ: 12.345.678/0001-90\nDESTINATÁRIO: Cliente Mock S/A\nCNPJ: 98.765.432/0001-10\nVALOR TOTAL: R$ 184.520,00\nCHAVE: 3526 0412 3456 7800 0190 5500 1000 0231 1711 2345 6789',
  },
  {
    summary: {
      core: {
        invoiceNumber: '0007789',
        invoiceDate: '2026-04-15',
        dueDate: null,
        sellerName: 'Servicos Mock Ltda',
        sellerAddress: null,
        clientName: 'Tomador Mock Ltda',
        clientAddress: null,
        tax: null,
        discount: null,
        total: 'R$ 12.450,00',
        paymentMethod: null,
      },
      items: [],
      narrative: '',
      extras: [
        { label: 'CNPJ Prestador', value: '11.222.333/0001-44', mono: true },
        { label: 'CNPJ Tomador', value: '55.666.777/0001-88', mono: true },
        { label: 'Código de serviço', value: '17.01', mono: null },
        {
          label: 'Município de prestação',
          value: 'São Paulo / SP',
          mono: null,
        },
      ],
    },
    extractedText:
      'NOTA FISCAL DE SERVIÇOS ELETRÔNICA\nPRESTADOR: Servicos Mock Ltda\nCNPJ: 11.222.333/0001-44\nTOMADOR: Tomador Mock Ltda\nVALOR DO SERVIÇO: R$ 12.450,00',
  },
  {
    summary: {
      core: {
        invoiceNumber: '042',
        invoiceDate: '2026-03-30',
        dueDate: null,
        sellerName: 'Mock Generic Vendor',
        sellerAddress: null,
        clientName: null,
        clientAddress: null,
        tax: null,
        discount: null,
        total: '$ 1,234.50',
        paymentMethod: 'Pix',
      },
      items: [],
      narrative: '',
      extras: [
        { label: 'Forma de pagamento', value: 'À vista — Pix', mono: null },
      ],
    },
    extractedText:
      'RECIBO #042\nVENDOR: Mock Generic Vendor\nDATE: 2026-03-30\nTOTAL: $ 1,234.50\nPAYMENT: Pix',
  },
];

@Injectable()
export class MockOcrProvider implements OcrProvider {
  async extract(buffer: Buffer, _mime: string): Promise<InvoiceSummaryResult> {
    void _mime;
    const hash = createHash('sha1').update(buffer).digest('hex');
    const idx = parseInt(hash.slice(0, 8), 16) % FIXTURES.length;
    const fixture = FIXTURES[idx];
    await new Promise((resolve) => setTimeout(resolve, 800));
    return fixture;
  }
}

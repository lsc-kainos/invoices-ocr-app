import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { OcrProvider } from './ocr-provider.interface';
import type { InvoiceSummaryResult } from '../schemas/invoice-summary.schema';

const FIXTURES: InvoiceSummaryResult[] = [
  {
    summary: {
      core: {
        tipo: 'NF-e',
        numero: '0023117',
        dataEmissao: '2026-04-22',
        cnpjEmitente: '12.345.678/0001-90',
        razaoSocial: 'Construtora Vega Ltda.',
        cnpjDestinatario: '98.765.432/0001-10',
        razaoSocialDestinatario: 'Cliente Mock S/A',
        valorTotal: 'R$ 184.520,00',
        chaveAcesso: '35260412345678000190550010000231171123456789',
        cfop: '5102',
      },
      extras: [
        { label: 'Natureza da operação', value: 'Venda de mercadoria' },
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
        tipo: 'NFS-e',
        numero: '0007789',
        dataEmissao: '2026-04-15',
        cnpjEmitente: '11.222.333/0001-44',
        razaoSocial: 'Servicos Mock Ltda',
        cnpjDestinatario: '55.666.777/0001-88',
        razaoSocialDestinatario: 'Tomador Mock Ltda',
        valorTotal: 'R$ 12.450,00',
        chaveAcesso: null,
        cfop: null,
      },
      extras: [
        { label: 'Código de serviço', value: '17.01' },
        { label: 'Município de prestação', value: 'São Paulo / SP' },
      ],
    },
    extractedText:
      'NOTA FISCAL DE SERVIÇOS ELETRÔNICA\nPRESTADOR: Servicos Mock Ltda\nCNPJ: 11.222.333/0001-44\nTOMADOR: Tomador Mock Ltda\nVALOR DO SERVIÇO: R$ 12.450,00',
  },
  {
    summary: {
      core: {
        tipo: 'Recibo',
        numero: '042',
        dataEmissao: '2026-03-30',
        cnpjEmitente: null,
        razaoSocial: 'Mock Generic Vendor',
        cnpjDestinatario: null,
        razaoSocialDestinatario: null,
        valorTotal: '$ 1,234.50',
        chaveAcesso: null,
        cfop: null,
      },
      extras: [{ label: 'Forma de pagamento', value: 'À vista — Pix' }],
    },
    extractedText:
      'RECIBO #042\nVENDOR: Mock Generic Vendor\nDATE: 2026-03-30\nTOTAL: $ 1,234.50\nPAYMENT: Pix',
  },
];

@Injectable()
export class MockOcrProvider implements OcrProvider {
  async extract(buffer: Buffer, _mime: string): Promise<InvoiceSummaryResult> {
    const hash = createHash('sha1').update(buffer).digest('hex');
    const idx = parseInt(hash.slice(0, 8), 16) % FIXTURES.length;
    const fixture = FIXTURES[idx]!;
    await new Promise((resolve) => setTimeout(resolve, 800));
    return fixture;
  }
}

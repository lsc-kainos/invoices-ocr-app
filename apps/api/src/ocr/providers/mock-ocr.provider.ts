import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { OcrProvider } from './ocr-provider.interface';
import type { InvoiceSummaryResult } from '../schemas/invoice-summary.schema';

const FIXTURES: InvoiceSummaryResult[] = [
  {
    documentType: 'nf-e',
    confidence: 0.95,
    summary: {
      core: {
        accessKey: '35260412345678000190550010000231171123456789',
        invoiceNumber: '0023117',
        invoiceDate: '2026-04-22',
        dueDate: null,
        sellerName: 'Construtora Vega Ltda.',
        sellerAddress:
          'Av. das Indústrias, 1.450 — Distrito Industrial, Guarulhos / SP — CEP 07222-000',
        clientName: 'Cliente Mock S/A',
        clientAddress:
          'Rua Anhanguera, 320 — Centro, São Paulo / SP — CEP 01135-000',
        tax: null,
        discount: null,
        total: 'R$ 184.520,00',
        paymentMethod: null,
      },
      items: [
        {
          description: 'Vergalhão de aço CA-50 Ø 10 mm — 12 m',
          quantity: '800 barras',
          unitPrice: 'R$ 98,00',
          totalPrice: 'R$ 78.400,00',
        },
        {
          description: 'Bloco de concreto estrutural 19×19×39 cm',
          quantity: '12.000 unid.',
          unitPrice: 'R$ 3,85',
          totalPrice: 'R$ 46.200,00',
        },
        {
          description: 'Cimento Portland CP-II-F-32 saco 50 kg',
          quantity: '1.200 sacos',
          unitPrice: 'R$ 49,95',
          totalPrice: 'R$ 59.940,00',
        },
      ],
      narrative:
        'Nota Fiscal Eletrônica referente à venda de materiais de construção para obra residencial em São Paulo. ' +
        'Os itens incluem vergalhões de aço, blocos de concreto estrutural e cimento Portland, todos com entrega prevista para 2026-04-25. ' +
        'O frete está incluso no valor total conforme CIF acordado em contrato. ' +
        'Autorização emitida pela SEFAZ-SP, protocolo 135260023456789.',
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
    documentType: 'nfs-e',
    confidence: 0.92,
    summary: {
      core: {
        accessKey: null,
        invoiceNumber: '0007789',
        invoiceDate: '2026-04-15',
        dueDate: null,
        sellerName: 'Servicos Mock Ltda',
        sellerAddress:
          'Rua Funchal, 418 — 8º andar — Vila Olímpia, São Paulo / SP — CEP 04551-060',
        clientName: 'Tomador Mock Ltda',
        clientAddress:
          'Alameda Santos, 745 — Jardim Paulista, São Paulo / SP — CEP 01419-001',
        tax: null,
        discount: null,
        total: 'R$ 12.450,00',
        paymentMethod: null,
      },
      items: [
        {
          description:
            'Desenvolvimento de software — horas de engenharia sênior',
          quantity: '60 h',
          unitPrice: 'R$ 175,00',
          totalPrice: 'R$ 10.500,00',
        },
        {
          description: 'Suporte técnico e manutenção corretiva — Abril/2026',
          quantity: '1 mês',
          unitPrice: 'R$ 1.950,00',
          totalPrice: 'R$ 1.950,00',
        },
      ],
      narrative:
        'Nota Fiscal de Serviços Eletrônica emitida pelo prestador Servicos Mock Ltda referente a consultoria de TI realizada em abril de 2026. ' +
        'Os serviços abrangem desenvolvimento de software sob demanda e suporte técnico mensal contratado. ' +
        'ISS retido na fonte conforme legislação municipal de São Paulo (alíquota 2%). ' +
        'Pagamento acordado em até 30 dias via transferência bancária (TED/PIX).',
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
    documentType: 'receipt',
    confidence: 0.88,
    summary: {
      core: {
        accessKey: null,
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
      items: [
        {
          description: 'Resma de papel A4 75 g/m² (500 folhas)',
          quantity: '20 resmas',
          unitPrice: '$ 12,50',
          totalPrice: '$ 250,00',
        },
        {
          description: 'Caneta esferográfica azul — caixa com 50 unid.',
          quantity: '5 caixas',
          unitPrice: 'R$ 196,90',
          totalPrice: 'R$ 984,50',
        },
      ],
      narrative:
        'Recibo de compra de material de escritório emitido pelo fornecedor Mock Generic Vendor em março de 2026. ' +
        'Os itens adquiridos incluem papel sulfite e canetas esferográficas para uso administrativo interno. ' +
        'Pagamento realizado à vista via Pix no ato da entrega.',
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

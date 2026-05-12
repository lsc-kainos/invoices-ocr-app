import { invoiceSummarySchema } from './invoice-summary.schema';

describe('invoiceSummarySchema', () => {
  const validSummary = {
    documentType: 'unknown',
    confidence: 1,
    summary: {
      core: {
        accessKey: null,
        invoiceNumber: null,
        invoiceDate: null,
        dueDate: null,
        sellerName: null,
        sellerAddress: null,
        clientName: null,
        clientAddress: null,
        tax: null,
        discount: null,
        total: null,
        paymentMethod: null,
      },
      items: [],
      extras: [],
      narrative: '',
    },
    extractedText: '',
  };

  it('exige accessKey como campo nullable para compatibilidade com Structured Outputs', () => {
    const withoutAccessKey = structuredClone(validSummary);
    delete (withoutAccessKey.summary.core as Partial<{ accessKey: null }>)
      .accessKey;

    expect(
      invoiceSummarySchema.parse(validSummary).summary.core.accessKey,
    ).toBeNull();
    expect(() => invoiceSummarySchema.parse(withoutAccessKey)).toThrow();
  });
});

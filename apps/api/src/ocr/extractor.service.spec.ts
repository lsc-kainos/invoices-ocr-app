import { ExtractorService } from './extractor.service';
import { LlmConfigKey } from '@prisma/client';
import { invoiceSummarySchema } from './schemas/invoice-summary.schema';

describe('ExtractorService', () => {
  it('chama AiRuntime.generateObject com key=EXTRACTOR e schema', async () => {
    const generate = jest.fn().mockResolvedValue({
      summary: { core: {}, items: [], extras: [], narrative: 'n' },
      extractedText: 't',
    });
    const runtime = { generateObject: generate } as any;

    const svc = new ExtractorService(runtime);
    await svc.extract(Buffer.from('img'), 'image/jpeg');

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: LlmConfigKey.EXTRACTOR,
        schema: invoiceSummarySchema,
      }),
    );
  });

  it('passa data URL com mime correto na mensagem', async () => {
    const generate = jest
      .fn()
      .mockResolvedValue({ summary: {}, extractedText: '' });
    const runtime = { generateObject: generate } as any;

    const svc = new ExtractorService(runtime);
    await svc.extract(Buffer.from('img'), 'application/pdf');

    const callArg = generate.mock.calls[0][0];
    const userMsg = callArg.messages.find((m: any) => m.role === 'user');
    const imagePart = userMsg.content.find((c: any) => c.type === 'image');
    expect(imagePart.image).toMatch(/^data:application\/pdf;base64,/);
  });
});

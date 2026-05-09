import { ConfigService } from '@nestjs/config';
import { OpenAiOcrProvider } from './openai-ocr.provider';

const parseMock = jest.fn();

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { parse: parseMock } },
    })),
  };
});

jest.mock('openai/helpers/zod', () => ({
  __esModule: true,
  zodResponseFormat: jest.fn().mockReturnValue({ type: 'json_schema' }),
}));

const happy = {
  summary: {
    core: {
      tipo: null,
      numero: null,
      dataEmissao: null,
      cnpjEmitente: null,
      razaoSocial: null,
      cnpjDestinatario: null,
      razaoSocialDestinatario: null,
      valorTotal: null,
      chaveAcesso: null,
      cfop: null,
    },
    extras: [],
  },
  extractedText: 'hello',
};

describe('OpenAiOcrProvider', () => {
  let provider: OpenAiOcrProvider;
  const cfg = {
    getOrThrow: (k: string) =>
      ({ OPENAI_API_KEY: 'sk-test', OCR_MODEL: 'gpt-4o' })[k] as string,
    get: (k: string) => ({ OCR_MODEL: 'gpt-4o' })[k] as string,
  } as unknown as ConfigService;

  beforeEach(() => {
    parseMock.mockReset();
    provider = new OpenAiOcrProvider(cfg);
  });

  it('monta request com system prompt, image_url data URL, response_format e temperature 0', async () => {
    parseMock.mockResolvedValue({
      choices: [{ message: { parsed: happy, refusal: null } }],
    });

    const result = await provider.extract(
      Buffer.from([0xff, 0xd8, 0xff]),
      'image/jpeg',
    );
    expect(result).toEqual(happy);

    interface ChatCall {
      model: string;
      temperature: number;
      response_format: unknown;
      messages: Array<{
        role: string;
        content: string | Array<{ type: string; image_url?: { url: string } }>;
      }>;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const callArg: unknown = parseMock.mock.calls[0]?.[0];
    const call = callArg as ChatCall;
    expect(call.model).toBe('gpt-4o');
    expect(call.temperature).toBe(0);
    expect(call.response_format).toBeDefined();

    const sys = call.messages[0];
    expect(sys.role).toBe('system');
    const sysText =
      typeof sys.content === 'string'
        ? sys.content
        : JSON.stringify(sys.content);
    expect(sysText).toMatch(/extrator de dados/i);

    const usr = call.messages[1];
    expect(usr.role).toBe('user');
    const imgPart = (
      usr.content as Array<{ type: string; image_url?: { url: string } }>
    ).find((p) => p.type === 'image_url');
    expect(imgPart?.image_url?.url).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('refusal do modelo → erro com "refusal" na mensagem', async () => {
    parseMock.mockResolvedValue({
      choices: [
        { message: { parsed: null, refusal: 'I cannot process this' } },
      ],
    });
    await expect(
      provider.extract(Buffer.from('x'), 'image/jpeg'),
    ).rejects.toThrow(/refusal/i);
  });

  it('SDK lança 429 → propaga (caller decide retry)', async () => {
    const err: Error & { status?: number } = new Error('rate limited');
    err.status = 429;
    parseMock.mockRejectedValue(err);
    await expect(
      provider.extract(Buffer.from('x'), 'image/jpeg'),
    ).rejects.toMatchObject({ status: 429 });
  });
});

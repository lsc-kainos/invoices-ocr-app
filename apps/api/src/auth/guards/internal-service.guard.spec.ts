import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalServiceGuard } from './internal-service.guard';

const TOKEN = 'a'.repeat(48);
const WRONG = 'b'.repeat(48);
const SHORT = 'c'.repeat(10);

function ctxWith(
  headers: Record<string, string | string[] | undefined>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

function buildGuard(token: string | undefined = TOKEN) {
  const config = {
    get: jest.fn((key: string) =>
      key === 'INTERNAL_SERVICE_TOKEN' ? token : undefined,
    ),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'INTERNAL_SERVICE_TOKEN') {
        if (!token) throw new Error('missing');
        return token;
      }
      throw new Error('unexpected key');
    }),
  } as unknown as ConfigService;
  return new InternalServiceGuard(config);
}

describe('InternalServiceGuard', () => {
  it('libera quando o header x-internal-token bate com o esperado', () => {
    const guard = buildGuard();
    expect(guard.canActivate(ctxWith({ 'x-internal-token': TOKEN }))).toBe(
      true,
    );
  });

  it('rejeita quando o header está ausente', () => {
    const guard = buildGuard();
    expect(() => guard.canActivate(ctxWith({}))).toThrow(UnauthorizedException);
  });

  it('rejeita quando o token está errado mas com mesmo tamanho', () => {
    const guard = buildGuard();
    expect(() =>
      guard.canActivate(ctxWith({ 'x-internal-token': WRONG })),
    ).toThrow(UnauthorizedException);
  });

  it('rejeita quando o token tem tamanho diferente sem vazar via exception', () => {
    const guard = buildGuard();
    // hash interno garante length fixo de 32 bytes — não deve lançar
    // RangeError do timingSafeEqual nem qualquer erro além de UnauthorizedException
    expect(() =>
      guard.canActivate(ctxWith({ 'x-internal-token': SHORT })),
    ).toThrow(UnauthorizedException);
  });

  it('rejeita quando header é array', () => {
    const guard = buildGuard();
    expect(() =>
      guard.canActivate(ctxWith({ 'x-internal-token': [TOKEN, TOKEN] })),
    ).toThrow(UnauthorizedException);
  });
});

import {
  CallHandler,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggerInterceptor } from './logger.interceptor';

type ReqMock = {
  method: string;
  originalUrl?: string;
  url?: string;
  headers: Record<string, string>;
  user?: { id: string };
};

function makeCtx(req: ReqMock, statusCode = 200): ExecutionContext {
  const res = { statusCode };
  return {
    switchToHttp: () => ({
      getRequest: <T>() => req as unknown as T,
      getResponse: <T>() => res as unknown as T,
    }),
  } as unknown as ExecutionContext;
}

describe('LoggerInterceptor', () => {
  let interceptor: LoggerInterceptor;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggerInterceptor();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  function firstArg(spy: jest.SpyInstance, callIndex = 0): string {
    const calls = spy.mock.calls as unknown[][];
    return String(calls[callIndex][0]);
  }

  function allArgs(spy: jest.SpyInstance): string {
    const calls = spy.mock.calls as unknown[][];
    return calls.map((c) => String(c[0])).join('\n');
  }

  it('loga método, path, status e usuário em sucesso 2xx', async () => {
    const ctx = makeCtx({
      method: 'GET',
      originalUrl: '/api/v1/me',
      headers: { authorization: 'Bearer secret' },
      user: { id: 'u1' },
    });
    const next: CallHandler = { handle: () => of({ id: 'u1' }) };

    await lastValueFrom(interceptor.intercept(ctx, next));

    expect(logSpy).toHaveBeenCalledTimes(1);
    const msg = firstArg(logSpy);
    expect(msg).toMatch(/GET/);
    expect(msg).toMatch(/\/api\/v1\/me/);
    expect(msg).toMatch(/200/);
    expect(msg).toMatch(/user=u1/);
    expect(msg).toMatch(/\d+ms/);
  });

  it('marca user=anon quando req.user não existe', async () => {
    const ctx = makeCtx({
      method: 'GET',
      originalUrl: '/health',
      headers: {},
    });
    const next: CallHandler = { handle: () => of({ status: 'ok' }) };

    await lastValueFrom(interceptor.intercept(ctx, next));

    expect(firstArg(logSpy)).toMatch(/user=anon/);
  });

  // Regra de segurança: nunca emitir Bearer token nem qualquer header
  // Authorization no log. Verificado em todos os caminhos (sucesso e erro).
  it('NÃO inclui o valor do header Authorization no log de sucesso', async () => {
    const SECRET = 'super-secret-jwt-token-zzz';
    const ctx = makeCtx({
      method: 'GET',
      originalUrl: '/api/v1/me',
      headers: { authorization: `Bearer ${SECRET}` },
      user: { id: 'u1' },
    });
    const next: CallHandler = { handle: () => of({}) };

    await lastValueFrom(interceptor.intercept(ctx, next));

    const all = allArgs(logSpy);
    expect(all).not.toContain(SECRET);
    expect(all).not.toContain('Bearer');
  });

  it('loga warn em erro com status code, sem expor stack como mensagem', async () => {
    const ctx = makeCtx({
      method: 'POST',
      originalUrl: '/api/v1/documents',
      headers: { authorization: 'Bearer x' },
    });
    const next: CallHandler = {
      handle: () => throwError(() => new UnauthorizedException()),
    };

    await expect(
      lastValueFrom(interceptor.intercept(ctx, next)),
    ).rejects.toThrow(UnauthorizedException);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = firstArg(warnSpy);
    expect(msg).toMatch(/POST/);
    expect(msg).toMatch(/\/api\/v1\/documents/);
    expect(msg).toMatch(/401/);
    expect(msg).not.toContain('Bearer');
  });

  it('NÃO loga corpo da resposta (evita vazar dados de domínio)', async () => {
    const ctx = makeCtx({
      method: 'GET',
      originalUrl: '/api/v1/documents/abc',
      headers: {},
      user: { id: 'u1' },
    });
    const next: CallHandler = {
      handle: () =>
        of({
          extractedText: 'segredo do documento NF-e 12345',
          summary: { CNPJ: '00.000.000/0001-00' },
        }),
    };

    await lastValueFrom(interceptor.intercept(ctx, next));

    const all = allArgs(logSpy);
    expect(all).not.toContain('segredo');
    expect(all).not.toContain('CNPJ');
  });
});

import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

function ctx(headers: Record<string, string> = {}): ExecutionContext {
  const req: Record<string, unknown> = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const strategy = { decryptAndValidate: jest.fn() } as unknown as JwtStrategy;
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new JwtAuthGuard(reflector, strategy);

  beforeEach(() => {
    (reflector.getAllAndOverride as jest.Mock).mockReset();
    (strategy.decryptAndValidate as jest.Mock).mockReset();
  });

  it('libera quando @Public() está marcado', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((k) =>
      k === IS_PUBLIC_KEY ? true : undefined,
    );
    await expect(guard.canActivate(ctx())).resolves.toBe(true);
  });

  it('rejeita quando Authorization ausente', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    await expect(guard.canActivate(ctx())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('atribui req.user ao validar token', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const user = { id: 'u', email: 'a@b' };
    (strategy.decryptAndValidate as jest.Mock).mockResolvedValue(user);
    const c = ctx({ authorization: 'Bearer xyz' });
    await expect(guard.canActivate(c)).resolves.toBe(true);
    expect((c.switchToHttp().getRequest() as { user: unknown }).user).toBe(
      user,
    );
  });
});

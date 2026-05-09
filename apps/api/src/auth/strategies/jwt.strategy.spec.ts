import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const prismaMock = { user: { findUnique: jest.fn() } };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'a'.repeat(32) },
        },
      ],
    }).compile();
    strategy = moduleRef.get(JwtStrategy);
    prismaMock.user.findUnique.mockReset();
  });

  it('validate retorna user para sub válido', async () => {
    const user = {
      id: 'u1',
      email: 'x@y.com',
      name: 'X',
      avatar: null,
      role: Role.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.user.findUnique.mockResolvedValue(user);
    await expect(strategy.validate({ sub: 'u1' })).resolves.toBe(user);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
    });
  });

  it('lança UnauthorizedException quando sub ausente', async () => {
    await expect(strategy.validate({} as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lança UnauthorizedException quando user não existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'gone' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('decryptAndValidate lança Unauthorized para token inválido', async () => {
    await expect(
      strategy.decryptAndValidate('not.a.valid.jwe'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // Regressão: catch silencioso (catch {}) escondeu a causa-raiz do
  // incidente de prod (decryption operation failed → secret mismatch).
  // Agora logamos err.message para visibilidade — não muda comportamento
  // (ainda lança UnauthorizedException), só adiciona rastro.
  it('decryptAndValidate loga warn com a mensagem do jose ao falhar', async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    try {
      await expect(
        strategy.decryptAndValidate('not.a.valid.jwe'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const msg = String((warnSpy.mock.calls as unknown[][])[0][0]);
      expect(msg).toMatch(/JWE decrypt failed/);
      // O jose normalmente diz algo tipo "Invalid Compact JWE" para um
      // token malformado como 'not.a.valid.jwe'. Não fixamos o texto exato
      // (depende da versão), só asseguramos que existe alguma razão.
      expect(msg.length).toBeGreaterThan('JWE decrypt failed: '.length);
    } finally {
      warnSpy.mockRestore();
    }
  });
});

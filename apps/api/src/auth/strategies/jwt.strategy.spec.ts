import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
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
});

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtDecrypt, type JWTPayload } from 'jose';
import { hkdf } from '@panva/hkdf';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthPayload } from '../types/auth-payload';

async function deriveEncryptionKey(secret: string): Promise<Uint8Array> {
  return hkdf('sha256', secret, '', 'NextAuth.js Generated Encryption Key', 32);
}

@Injectable()
export class JwtStrategy {
  private readonly keyPromise: Promise<Uint8Array>;
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.keyPromise = deriveEncryptionKey(
      config.getOrThrow<string>('NEXTAUTH_SECRET'),
    );
  }

  async decryptAndValidate(token: string): Promise<User> {
    let payload: JWTPayload;
    try {
      const key = await this.keyPromise;
      ({ payload } = await jwtDecrypt(token, key, { clockTolerance: 15 }));
    } catch (err) {
      // Captura a mensagem real do jose (ex.: "decryption operation
      // failed" indica secret diferente do usado na assinatura;
      // "exp claim timestamp check failed" indica token expirado;
      // "Invalid Compact JWE" indica corrupção em trânsito). Sem isto,
      // 401s viram caixa-preta e o diagnóstico vira pura especulação.
      this.logger.warn(
        `JWE decrypt failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      throw new UnauthorizedException('invalid token');
    }
    return this.validate(payload as AuthPayload);
  }

  async validate(payload: AuthPayload): Promise<User> {
    if (!payload?.sub) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

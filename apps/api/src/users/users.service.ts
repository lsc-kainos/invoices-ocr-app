import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, type User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface UpsertUserInput {
  email: string;
  name?: string | null;
  avatar?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  upsertByEmail(input: UpsertUserInput): Promise<User> {
    const role = this.determineRole(input.email);
    const name = input.name ?? null;
    const avatar = input.avatar ?? null;
    return this.prisma.user.upsert({
      where: { email: input.email },
      create: { email: input.email, name, avatar, role },
      update: { name, avatar, role },
    });
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.prisma.user.delete({ where: { email } });
  }

  private determineRole(email: string): Role {
    const raw = this.config.get<string>('ADMIN_EMAILS') ?? '';
    const admins = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return admins.includes(email.toLowerCase()) ? Role.ADMIN : Role.USER;
  }
}

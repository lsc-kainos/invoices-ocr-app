import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import type { User } from '@prisma/client';

const hasDb = !!process.env.DATABASE_URL;
const describeOrSkip = hasDb ? describe : describe.skip;

describeOrSkip('Rate Limiting (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let resolveUser: (token: string) => Promise<User | null>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(JwtStrategy)
      .useValue({
        decryptAndValidate: async (token: string) => resolveUser(token),
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    resolveUser = (token: string) =>
      prisma.user.findUnique({ where: { id: token } });
  });

  afterAll(async () => {
    if (app) {
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'rate-test' } },
      });
      await prisma.$disconnect();
      await app.close();
    }
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'rate-test' } },
    });
  });

  const authHeader = (userId: string) => ({
    Authorization: `Bearer ${userId}`,
  });

  it('should return 429 after exceeding upload rate limit', async () => {
    const user = await prisma.user.create({
      data: { email: 'rate-test-upload@example.com', name: 'Rate Test' },
    });

    // Fazer requests de upload até atingir o limite
    for (let i = 0; i < 35; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/documents')
        .set(authHeader(user.id))
        .attach('file', Buffer.from('fake'), 'test.jpg');
      // Pode falhar por validação, mas não por rate limit ainda
      if (res.status === 429) break;
    }

    const blocked = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set(authHeader(user.id))
      .attach('file', Buffer.from('fake'), 'test.jpg');

    expect(blocked.status).toBe(429);
  });

  it('should return 429 after exceeding chat rate limit', async () => {
    const user = await prisma.user.create({
      data: { email: 'rate-test-chat@example.com', name: 'Rate Test' },
    });

    const session = await prisma.chatSession.create({
      data: { userId: user.id },
    });

    // Fazer requests de chat até atingir o limite
    for (let i = 0; i < 65; i++) {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/chat/sessions/${session.id}/messages`)
        .set(authHeader(user.id))
        .send({ content: 'test' });
      if (res.status === 429) break;
    }

    const blocked = await request(app.getHttpServer())
      .post(`/api/v1/chat/sessions/${session.id}/messages`)
      .set(authHeader(user.id))
      .send({ content: 'test' });

    expect(blocked.status).toBe(429);
  });
});

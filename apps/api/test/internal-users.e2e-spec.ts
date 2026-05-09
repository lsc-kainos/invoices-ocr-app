import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';

const TOKEN = 'integration-test-internal-token-with-32-plus-chars';

const hasDb = !!process.env.DATABASE_URL;
const describeOrSkip = hasDb ? describe : describe.skip;

describeOrSkip('InternalUsersController (e2e)', () => {
  let app: INestApplication<App>;
  const usersServiceMock = {
    upsertByEmail: jest.fn(),
    deleteByEmail: jest.fn(),
    findById: jest.fn(),
  };

  beforeAll(async () => {
    process.env.ALLOWED_ORIGINS =
      process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';
    process.env.INTERNAL_SERVICE_TOKEN = TOKEN;

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersService)
      .useValue(usersServiceMock)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.get(PrismaService).$disconnect();
      await app.close();
    }
  });

  beforeEach(() => {
    usersServiceMock.upsertByEmail.mockReset();
    usersServiceMock.deleteByEmail.mockReset();
    usersServiceMock.findById.mockReset();
  });

  describe('POST /api/v1/internal/users/sync', () => {
    it('200 quando token e body válidos', async () => {
      usersServiceMock.upsertByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar: null,
        role: Role.USER,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/internal/users/sync')
        .set('x-internal-token', TOKEN)
        .send({ email: 'a@b.com', name: 'A' })
        .expect(201);

      expect(res.body).toEqual({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar: null,
        role: Role.USER,
      });
      expect(usersServiceMock.upsertByEmail).toHaveBeenCalledWith({
        email: 'a@b.com',
        name: 'A',
        avatar: undefined,
      });
    });

    it('401 sem header x-internal-token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/internal/users/sync')
        .send({ email: 'a@b.com' })
        .expect(401);
      expect(usersServiceMock.upsertByEmail).not.toHaveBeenCalled();
    });

    it('401 com token errado', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/internal/users/sync')
        .set('x-internal-token', 'wrong-token-also-32-chars-long-padding')
        .send({ email: 'a@b.com' })
        .expect(401);
      expect(usersServiceMock.upsertByEmail).not.toHaveBeenCalled();
    });

    it('400 com body inválido (email ausente)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/internal/users/sync')
        .set('x-internal-token', TOKEN)
        .send({ name: 'A' })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/internal/users/by-email', () => {
    it('204 quando token e body válidos', async () => {
      usersServiceMock.deleteByEmail.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/api/v1/internal/users/by-email')
        .set('x-internal-token', TOKEN)
        .send({ email: 'gone@x.com' })
        .expect(204);

      expect(usersServiceMock.deleteByEmail).toHaveBeenCalledWith('gone@x.com');
    });

    it('401 sem token', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/internal/users/by-email')
        .send({ email: 'gone@x.com' })
        .expect(401);
    });
  });
});

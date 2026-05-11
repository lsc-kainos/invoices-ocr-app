import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE } from '../storage/storage.service';

function createPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };
}

function buildService(
  opts: {
    prisma?: ReturnType<typeof createPrismaMock>;
    adminEmails?: string;
    storage?: { delete: jest.Mock };
  } = {},
) {
  const prisma = opts.prisma ?? createPrismaMock();
  const config = {
    get: jest.fn((key: string) =>
      key === 'ADMIN_EMAILS' ? (opts.adminEmails ?? '') : undefined,
    ),
  };
  const storage = opts.storage ?? {
    delete: jest.fn().mockResolvedValue(undefined),
  };
  return Test.createTestingModule({
    providers: [
      UsersService,
      { provide: PrismaService, useValue: prisma },
      { provide: ConfigService, useValue: config },
      { provide: STORAGE_SERVICE, useValue: storage },
    ],
  })
    .compile()
    .then((m) => ({ service: m.get(UsersService), prisma, config, storage }));
}

describe('UsersService.upsertByEmail', () => {
  it('cria user com role USER quando email não está em ADMIN_EMAILS', async () => {
    const { service, prisma } = await buildService({
      adminEmails: 'admin@kainos.com',
    });
    prisma.user.upsert.mockResolvedValue({
      id: 'u1',
      email: 'jane@kainos.com',
      role: Role.USER,
    });

    await service.upsertByEmail({ email: 'jane@kainos.com', name: 'Jane' });

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'jane@kainos.com' },
        create: expect.objectContaining({
          email: 'jane@kainos.com',
          name: 'Jane',
          avatar: null,
          role: Role.USER,
        }),
        update: expect.objectContaining({ name: 'Jane', role: Role.USER }),
      }),
    );
  });

  it('cria user com role ADMIN quando email está em ADMIN_EMAILS', async () => {
    const { service, prisma } = await buildService({
      adminEmails: 'admin@kainos.com',
    });
    prisma.user.upsert.mockResolvedValue({
      id: 'u2',
      email: 'admin@kainos.com',
      role: Role.ADMIN,
    });

    await service.upsertByEmail({ email: 'admin@kainos.com' });

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ role: Role.ADMIN }),
        update: expect.objectContaining({ role: Role.ADMIN }),
      }),
    );
  });

  it('é case-insensitive na comparação de ADMIN_EMAILS', async () => {
    const { service, prisma } = await buildService({
      adminEmails: 'Admin@Kainos.COM',
    });
    prisma.user.upsert.mockResolvedValue({ id: 'u3', role: Role.ADMIN });

    await service.upsertByEmail({ email: 'admin@kainos.com' });

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ role: Role.ADMIN }),
      }),
    );
  });

  it('aceita lista CSV em ADMIN_EMAILS com espaços', async () => {
    const { service, prisma } = await buildService({
      adminEmails: ' a@x.com , b@y.com ,c@z.com',
    });
    prisma.user.upsert.mockResolvedValue({ id: 'u4', role: Role.ADMIN });

    await service.upsertByEmail({ email: 'b@y.com' });

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ role: Role.ADMIN }),
      }),
    );
  });

  it('passa null pra avatar/name quando não fornecidos', async () => {
    const { service, prisma } = await buildService();
    prisma.user.upsert.mockResolvedValue({ id: 'u5', role: Role.USER });

    await service.upsertByEmail({ email: 'plain@x.com' });

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ name: null, avatar: null }),
      }),
    );
  });

  it('atualiza role quando email entra em ADMIN_EMAILS', async () => {
    const { service, prisma } = await buildService({
      adminEmails: 'promoted@kainos.com',
    });
    prisma.user.upsert.mockResolvedValue({ id: 'u6', role: Role.ADMIN });

    await service.upsertByEmail({ email: 'promoted@kainos.com', name: 'P' });

    // O update sempre seta role — se o user existia como USER e agora está em
    // ADMIN_EMAILS, vira ADMIN no próximo login.
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ role: Role.ADMIN }),
      }),
    );
  });
});

describe('UsersService.deleteByEmail', () => {
  it('chama prisma.user.delete por email', async () => {
    const { service, prisma } = await buildService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      documents: [{ storagePath: 'u1/d1/original.jpg' }],
    });
    prisma.user.delete.mockResolvedValue({ id: 'gone' });

    await service.deleteByEmail('gone@x.com');

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { email: 'gone@x.com' },
    });
  });

  it('faz purge dos arquivos físicos antes de deletar usuário (LGPD)', async () => {
    const { service, prisma, storage } = await buildService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      documents: [
        { storagePath: 'u1/d1/original.jpg' },
        { storagePath: 'u1/d2/original.pdf' },
        { storagePath: 'pending' }, // skip
      ],
    });
    prisma.user.delete.mockResolvedValue({ id: 'gone' });

    await service.deleteByEmail('gone@x.com');

    expect(storage.delete).toHaveBeenCalledWith('u1/d1/original.jpg');
    expect(storage.delete).toHaveBeenCalledWith('u1/d2/original.pdf');
    expect(storage.delete).not.toHaveBeenCalledWith('pending');
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { email: 'gone@x.com' },
    });
  });

  it('ignora usuário inexistente sem lançar erro', async () => {
    const { service, prisma, storage } = await buildService();
    prisma.user.findUnique.mockResolvedValue(null);

    await service.deleteByEmail('nobody@x.com');

    expect(storage.delete).not.toHaveBeenCalled();
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});

describe('UsersService.findById', () => {
  it('chama prisma.user.findUnique por id', async () => {
    const { service, prisma } = await buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'x', role: Role.USER });

    const result = await service.findById('x');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'x' } });
    expect(result).toMatchObject({ id: 'x' });
  });
});

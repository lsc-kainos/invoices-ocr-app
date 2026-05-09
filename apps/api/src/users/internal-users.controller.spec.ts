import { Role } from '@prisma/client';
import { InternalUsersController } from './internal-users.controller';
import type { UsersService } from './users.service';

describe('InternalUsersController', () => {
  function buildController() {
    const upsertByEmail = jest.fn();
    const deleteByEmail = jest.fn();
    const service = {
      upsertByEmail,
      deleteByEmail,
    } as unknown as jest.Mocked<UsersService>;
    const controller = new InternalUsersController(service);
    return { controller, upsertByEmail, deleteByEmail };
  }

  describe('sync', () => {
    it('chama upsertByEmail e retorna projeção do user', async () => {
      const { controller, upsertByEmail } = buildController();
      upsertByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar: 'http://x/y.png',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.sync({
        email: 'a@b.com',
        name: 'A',
        avatar: 'http://x/y.png',
      });

      expect(upsertByEmail).toHaveBeenCalledWith({
        email: 'a@b.com',
        name: 'A',
        avatar: 'http://x/y.png',
      });
      expect(result).toEqual({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar: 'http://x/y.png',
        role: Role.USER,
      });
    });

    it('aceita name/avatar undefined', async () => {
      const { controller, upsertByEmail } = buildController();
      upsertByEmail.mockResolvedValue({
        id: 'u2',
        email: 'plain@x.com',
        name: null,
        avatar: null,
        role: Role.USER,
      });

      const result = await controller.sync({ email: 'plain@x.com' });

      expect(upsertByEmail).toHaveBeenCalledWith({
        email: 'plain@x.com',
        name: undefined,
        avatar: undefined,
      });
      expect(result.role).toBe(Role.USER);
    });
  });

  describe('deleteByEmail', () => {
    it('chama deleteByEmail no service', async () => {
      const { controller, deleteByEmail } = buildController();
      deleteByEmail.mockResolvedValue(undefined);

      await controller.deleteByEmail({ email: 'gone@x.com' });

      expect(deleteByEmail).toHaveBeenCalledWith('gone@x.com');
    });
  });
});

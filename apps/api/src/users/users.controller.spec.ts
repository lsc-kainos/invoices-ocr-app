import { UsersController } from './users.controller';
import { Role } from '@prisma/client';

describe('UsersController.me', () => {
  it('retorna projeção do user injetado', () => {
    const c = new UsersController();
    const user = {
      id: 'u',
      email: 'a@b.com',
      name: 'A',
      avatar: null,
      role: Role.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(c.me(user)).toEqual({
      id: 'u',
      email: 'a@b.com',
      name: 'A',
      avatar: null,
      role: Role.USER,
    });
  });
});

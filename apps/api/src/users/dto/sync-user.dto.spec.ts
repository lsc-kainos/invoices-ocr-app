import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SyncUserDto } from './sync-user.dto';

describe('SyncUserDto', () => {
  it('should accept valid user data', async () => {
    const dto = plainToInstance(SyncUserDto, {
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.png',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid email', async () => {
    const dto = plainToInstance(SyncUserDto, {
      email: 'not-an-email',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should reject email too long', async () => {
    const dto = plainToInstance(SyncUserDto, {
      email: 'a'.repeat(250) + '@example.com',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should accept minimal user data (only email)', async () => {
    const dto = plainToInstance(SyncUserDto, {
      email: 'test@example.com',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject avatar URL too long', async () => {
    const dto = plainToInstance(SyncUserDto, {
      email: 'test@example.com',
      avatar: 'https://example.com/' + 'a'.repeat(3000),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('avatar');
  });
});

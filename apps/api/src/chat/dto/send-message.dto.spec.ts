import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

describe('SendMessageDto', () => {
  it('should accept valid content', async () => {
    const dto = plainToInstance(SendMessageDto, { content: 'Hello' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject empty content', async () => {
    const dto = plainToInstance(SendMessageDto, { content: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('content');
  });

  it('should reject content too long', async () => {
    const dto = plainToInstance(SendMessageDto, { content: 'a'.repeat(8001) });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('content');
  });
});

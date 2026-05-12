import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListDocumentsQueryDto } from './list-documents.query.dto';
import { DocumentStatus } from '@prisma/client';

describe('ListDocumentsQueryDto', () => {
  it('should accept valid query', async () => {
    const dto = plainToInstance(ListDocumentsQueryDto, {
      status: ['READY', 'FAILED'],
      limit: 10,
      updatedSince: '2024-01-01T00:00:00Z',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid status enum', async () => {
    const dto = plainToInstance(ListDocumentsQueryDto, {
      status: ['INVALID_STATUS'],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('should reject limit above max', async () => {
    const dto = plainToInstance(ListDocumentsQueryDto, {
      limit: 9999,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should reject limit below min', async () => {
    const dto = plainToInstance(ListDocumentsQueryDto, {
      limit: 0,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should accept comma-separated status string', async () => {
    const dto = plainToInstance(ListDocumentsQueryDto, {
      status: 'READY,FAILED',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.status).toEqual(['READY', 'FAILED']);
  });
});

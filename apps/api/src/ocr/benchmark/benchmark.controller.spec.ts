import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { BenchmarkController } from './benchmark.controller';
import { BenchmarkService } from './benchmark.service';
import { BenchmarkPersistenceService } from './benchmark-persistence.service';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type {
  BenchmarkRunDetailDto,
  BenchmarkRunDto,
} from '@invoices-ocr/shared-types';

const makeRunDto = (over: Partial<BenchmarkRunDto> = {}): BenchmarkRunDto => ({
  id: 'run1',
  runByEmail: 'admin@example.com',
  llmConfigKey: 'default',
  llmConfigVersion: 1,
  modelSnapshot: 'gpt-4o',
  datasetVersion: 'v1',
  sampleCount: 5,
  aggregate: {
    avgScore: 0.8,
    passedCount: 4,
    failedCount: 1,
    perField: {},
    errorCounts: { refusal: 0, parse_error: 0, io_error: 0, unknown: 0 },
  },
  durationMs: 1234,
  createdAt: new Date().toISOString(),
  ...over,
});

const makeDetailDto = (
  over: Partial<BenchmarkRunDetailDto> = {},
): BenchmarkRunDetailDto => ({
  ...makeRunDto(),
  promptSnapshot: 'You are an extractor...',
  paramsSnapshot: { temperature: 0 },
  results: [{ filename: 'a.jpg', score: 1 }],
  ...over,
});

describe('BenchmarkController', () => {
  let controller: BenchmarkController;
  let persistenceMock: { list: jest.Mock; findById: jest.Mock };

  beforeEach(async () => {
    persistenceMock = {
      list: jest.fn(),
      findById: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [BenchmarkController],
      providers: [
        { provide: BenchmarkService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: BenchmarkPersistenceService, useValue: persistenceMock },
      ],
    }).compile();

    controller = module.get<BenchmarkController>(BenchmarkController);
  });

  describe('GET benchmark/runs', () => {
    it('returns list from persistence service with default limit 20', async () => {
      const dtos = [makeRunDto()];
      persistenceMock.list.mockResolvedValue(dtos);

      const result = await controller.listRuns(undefined);

      expect(persistenceMock.list).toHaveBeenCalledWith(20);
      expect(result).toBe(dtos);
    });

    it('passes parsed limit to persistence service', async () => {
      const dtos = [makeRunDto(), makeRunDto({ id: 'run2' })];
      persistenceMock.list.mockResolvedValue(dtos);

      const result = await controller.listRuns('5');

      expect(persistenceMock.list).toHaveBeenCalledWith(5);
      expect(result).toBe(dtos);
    });

    it('caps limit at 100', async () => {
      persistenceMock.list.mockResolvedValue([]);

      await controller.listRuns('999');

      expect(persistenceMock.list).toHaveBeenCalledWith(100);
    });
  });

  describe('GET benchmark/runs/:id', () => {
    it('returns detail DTO when run is found', async () => {
      const detail = makeDetailDto();
      persistenceMock.findById.mockResolvedValue(detail);

      const result = await controller.getRun('run1');

      expect(persistenceMock.findById).toHaveBeenCalledWith('run1');
      expect(result).toBe(detail);
    });

    it('throws NotFoundException when persistence returns null', async () => {
      persistenceMock.findById.mockResolvedValue(null);

      await expect(controller.getRun('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(persistenceMock.findById).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('RBAC', () => {
    it('controller class has Roles(ADMIN) decorator', () => {
      const reflector = new Reflector();
      const roles = reflector.get<Role[]>(ROLES_KEY, BenchmarkController);
      expect(roles).toContain(Role.ADMIN);
    });
  });
});

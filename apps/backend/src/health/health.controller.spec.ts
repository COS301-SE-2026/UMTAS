import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockEntity = {
    id: 'test-uuid-1234',
    message: 'Hello World',
    createdAt: new Date('2026-04-20T00:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            writeHello: vi.fn().mockResolvedValue(mockEntity),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('hello', () => {
    it('should call healthService.writeHello()', async () => {
      await controller.hello();
      expect(service.writeHello).toHaveBeenCalledOnce();
    });

    it('should return success response with correct shape', async () => {
      const result = await controller.hello();

      expect(result).toEqual({
        success: true,
        message: 'Hello World',
        id: 'test-uuid-1234',
        createdAt: mockEntity.createdAt,
      });
    });

    it('should propagate service errors', async () => {
      vi.mocked(service.writeHello).mockRejectedValueOnce(
        new Error('DB connection failed'),
      );

      await expect(controller.hello()).rejects.toThrow('DB connection failed');
    });
  });
});

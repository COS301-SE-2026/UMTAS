import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            check: jest.fn().mockResolvedValue({ status: 'ok' }),
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

  describe('check', () => {
    it('should call healthService.check()', async () => {
      const checkSpy = jest.spyOn(service, 'check');
      await controller.check();
      expect(checkSpy).toHaveBeenCalledTimes(1);
    });

    it('should return health status', async () => {
      const result = await controller.check();

      expect(result).toEqual({ status: 'ok' });
    });

    it('should propagate service errors', async () => {
      (service.check as jest.Mock).mockRejectedValueOnce(
        new Error('DB connection failed'),
      );

      await expect(controller.check()).rejects.toThrow('DB connection failed');
    });
  });
});

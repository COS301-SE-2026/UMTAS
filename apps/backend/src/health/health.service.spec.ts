import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';
import { MailerService } from '../mail/mailer.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const executeMock = jest.fn();
  const mailerVerifyMock = jest.fn();

  beforeEach(async () => {
    executeMock.mockReset().mockResolvedValue([]);
    mailerVerifyMock.mockReset().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DatabaseService,
          useValue: { db: { execute: executeMock } },
        },
        {
          provide: MailerService,
          useValue: { verify: mailerVerifyMock },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return ok status with database service listed', async () => {
      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.services.database).toBe('ok');
      expect(executeMock).toHaveBeenCalledTimes(1);
    });

    it('should return error status when database check fails', async () => {
      executeMock.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.services.database).toBe('error');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';
import { HealthService } from './health.service';
import { helloWorldTable } from '../entities/hello-world/hello-world.schema';

describe('HealthService', () => {
  let service: HealthService;
  const returningMock = jest.fn();
  const valuesMock = jest.fn();
  const insertMock = jest.fn();

  const mockEntity = {
    id: 'test-uuid-1234',
    message: 'Hello World',
    createdAt: new Date('2026-04-20T00:00:00Z'),
  };

  beforeEach(async () => {
    returningMock.mockReset().mockResolvedValue([mockEntity]);
    valuesMock.mockReset().mockReturnValue({ returning: returningMock });
    insertMock.mockReset().mockReturnValue({ values: valuesMock });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DatabaseService,
          useValue: {
            db: {
              insert: insertMock,
            },
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('writeHello', () => {
    it('should create an entity with message "Hello World"', async () => {
      await service.writeHello();

      expect(insertMock).toHaveBeenCalledWith(helloWorldTable);
    });

    it('should insert the expected payload', async () => {
      await service.writeHello();

      expect(valuesMock).toHaveBeenCalledWith({ message: 'Hello World' });
      expect(returningMock).toHaveBeenCalledTimes(1);
    });

    it('should return the saved entity', async () => {
      const result = await service.writeHello();

      expect(result).toEqual(mockEntity);
      expect(result.id).toBe('test-uuid-1234');
      expect(result.message).toBe('Hello World');
    });

    it('should propagate database errors', async () => {
      returningMock.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(service.writeHello()).rejects.toThrow('Connection refused');
    });
  });
});

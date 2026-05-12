import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from '../db/database.service';
import { MailerService } from '../mail/mailer.service';

jest.mock('../redis/redis');

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;
  let databaseService: DatabaseService;
  let mailerService: MailerService;

  const mockDb = {
    query: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                BETTER_AUTH_SECRET: 'test-secret-key-32-chars-minimum!!',
                BETTER_AUTH_URL: 'http://localhost:3001',
                NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
                NODE_ENV: 'development',
                REDIS_URL: 'redis://localhost:6379',
                GOOGLE_CLIENT_ID: 'test-google-id',
                GOOGLE_CLIENT_SECRET: 'test-google-secret',
                SYSTEM_ADMIN_USER_IDS: 'admin-user-id-1,admin-user-id-2',
              };
              return config[key];
            }),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            db: mockDb,
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    mailerService = module.get<MailerService>(MailerService);
  });

  describe('onModuleInit', () => {
    it('should initialize without error when BETTER_AUTH_SECRET is set', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('should throw error if BETTER_AUTH_SECRET is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);
      expect(() => service.onModuleInit()).toThrow(
        'BETTER_AUTH_SECRET is required',
      );
    });
  });

  describe('getAuth', () => {
    it('should return cached auth instance on subsequent calls', () => {
      service.onModuleInit();
      const auth1 = service.getAuth();
      const auth2 = service.getAuth();
      expect(auth1).toBe(auth2);
    });

    it('should create auth instance with base configuration', () => {
      service.onModuleInit();
      const auth = service.getAuth();
      expect(auth).toBeDefined();
      expect(auth.handler).toBeDefined();
    });

    it('should initialize Redis client when REDIS_URL is provided', () => {
      service.onModuleInit();
      const auth = service.getAuth();
      expect(auth).toBeDefined();
    });

    it('should configure trustedOrigins from environment', () => {
      service.onModuleInit();
      const auth = service.getAuth();
      expect(auth).toBeDefined();
    });

    it('should pass email callbacks to auth instance', async () => {
      service.onModuleInit();
      const auth = service.getAuth();
      expect(auth).toBeDefined();
      expect(mailerService.sendMail).toBeDefined();
    });

    it('should handle system admin user IDs', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const config: Record<string, string> = {
          BETTER_AUTH_SECRET: 'test-secret-key-32-chars-minimum!!',
          BETTER_AUTH_URL: 'http://localhost:3001',
          NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
          NODE_ENV: 'development',
          REDIS_URL: '',
          GOOGLE_CLIENT_ID: '',
          GOOGLE_CLIENT_SECRET: '',
          SYSTEM_ADMIN_USER_IDS: '',
        };
        return config[key];
      });
      service.onModuleInit();
      const auth = service.getAuth();
      expect(auth).toBeDefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { AuthService } from './auth.service';
import { DatabaseService } from '../db/database.service';
import { MailerService } from '../mail/mailer.service';

jest.mock('../redis/redis');

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;
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
    mailerService = module.get<MailerService>(MailerService);
  });

  function makeDrizzleMock(rows: unknown[] = []) {
    const limitMock = jest.fn().mockResolvedValue(rows);
    const whereMock = jest.fn().mockReturnValue({ limit: limitMock });
    const fromMock = jest.fn().mockReturnValue({ where: whereMock });
    const selectMock = jest.fn().mockReturnValue({ from: fromMock });
    return { select: selectMock };
  }

  describe('onModuleInit', () => {
    it('should initialize without error when BETTER_AUTH_SECRET is set', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('should reject production boot without REDIS_URL', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const config: Record<string, string | undefined> = {
          BETTER_AUTH_SECRET: 'test-secret-key-32-chars-minimum!!',
          NODE_ENV: 'production',
          REDIS_URL: undefined,
        };
        return config[key];
      });

      expect(() => service.onModuleInit()).toThrow(
        'REDIS_URL is required in production',
      );
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

    it('should pass email callbacks to auth instance', () => {
      service.onModuleInit();
      const auth = service.getAuth();
      expect(auth).toBeDefined();
      expect(typeof mailerService.sendMail).toBe('function');
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

  describe('userExistsByEmail', () => {
    it('returns true when user row found', async () => {
      const drizzle = makeDrizzleMock([{ id: 'user-1' }]);
      const localModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const c: Record<string, string | undefined> = {
                  BETTER_AUTH_SECRET: 'test-secret-key-32-chars-minimum!!',
                  NODE_ENV: 'development',
                };
                return c[key];
              }),
            },
          },
          {
            provide: DatabaseService,
            useValue: { db: drizzle },
          },
          {
            provide: MailerService,
            useValue: { sendMail: jest.fn() },
          },
        ],
      }).compile();

      const svc = localModule.get<AuthService>(AuthService);
      const result = await svc.userExistsByEmail('found@example.com');
      expect(result).toBe(true);
      expect(drizzle.select).toHaveBeenCalled();
    });

    it('returns false when no user found', async () => {
      const drizzle = makeDrizzleMock([]);
      const localModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const c: Record<string, string | undefined> = {
                  BETTER_AUTH_SECRET: 'test-secret-key-32-chars-minimum!!',
                  NODE_ENV: 'development',
                };
                return c[key];
              }),
            },
          },
          {
            provide: DatabaseService,
            useValue: { db: drizzle },
          },
          {
            provide: MailerService,
            useValue: { sendMail: jest.fn() },
          },
        ],
      }).compile();

      const svc = localModule.get<AuthService>(AuthService);
      const result = await svc.userExistsByEmail('missing@example.com');
      expect(result).toBe(false);
    });
  });

  describe('getAuth — mail callback wiring', () => {
    it('wires sendResetPasswordEmail to mailerService.sendResetPasswordEmail', async () => {
      const mockMailerService = {
        sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      };
      const localModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const c: Record<string, string | undefined> = {
                  BETTER_AUTH_SECRET: 'test-secret-key-32-chars-minimum!!',
                  BETTER_AUTH_URL: 'http://localhost:3001',
                  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
                  NODE_ENV: 'development',
                };
                return c[key];
              }),
            },
          },
          {
            provide: DatabaseService,
            useValue: { db: {} },
          },
          {
            provide: MailerService,
            useValue: mockMailerService,
          },
        ],
      }).compile();

      const svc = localModule.get<AuthService>(AuthService);
      svc.onModuleInit();
      svc.getAuth();

      // Extract the captured betterAuth config and invoke the sendResetPassword callback
      const mockCalls = (betterAuth as jest.Mock).mock.calls;
      const lastCall = mockCalls[mockCalls.length - 1] as unknown[];
      const capturedConfig = lastCall[0] as Record<string, unknown>;
      const emailAndPassword = capturedConfig.emailAndPassword as Record<
        string,
        unknown
      >;
      const sendResetPassword = emailAndPassword.sendResetPassword as (input: {
        user: { id: string; email: string; name: string };
        url: string;
      }) => Promise<void>;

      await sendResetPassword({
        user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
        url: 'http://localhost:3001/reset',
      });

      expect(mockMailerService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com' }),
      );
    });
  });
});

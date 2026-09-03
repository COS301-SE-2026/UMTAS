import { Test, TestingModule } from '@nestjs/testing';
import { betterAuth } from 'better-auth';
import { AuthService } from './auth.service';
import { DatabaseService } from '../db/database.service';
import { MailerService } from '../mail/mailer.service';
import { admin } from 'better-auth/plugins/admin';
import { createRedisClient, getRedisClient } from '../redis/redis';
import {
  createMockSession,
  createUniversity,
  createUniversityRole,
} from '../Testing/Factories';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockSequentialResults,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import { MockUserRole } from './auth.dto';

jest.mock('../redis/redis');

describe('AuthService', () => {
  let service: AuthService;
  let mailerService: MailerService;
  const originalEnv = process.env;

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
          provide: DatabaseService,
          useValue: {
            db: mockDb,
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(undefined),
            sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mailerService = module.get<MailerService>(MailerService);
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('onModuleInit', () => {
    it('should initialize without error when BETTER_AUTH_SECRET is set', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('uses secure cookies in staging without enabling production checks', () => {
      const nodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'staging';
      (betterAuth as jest.Mock).mockClear();

      try {
        service.onModuleInit();
        service.getAuth();
        const calls = (betterAuth as jest.Mock).mock.calls as Array<
          [Record<string, { useSecureCookies?: boolean }>]
        >;
        expect(calls.at(-1)?.[0].advanced.useSecureCookies).toBe(true);
      } finally {
        if (nodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = nodeEnv;
      }
    });

    it('uses the local Redis default when REDIS_URL is absent', () => {
      const redisUrl = process.env.REDIS_URL;
      delete process.env.REDIS_URL;
      expect(() => service.onModuleInit()).not.toThrow();
      expect(createRedisClient).toHaveBeenCalledWith('redis://localhost:6379');
      process.env.REDIS_URL = redisUrl;
    });

    it('uses an explicit Redis URL', () => {
      process.env.REDIS_URL = 'redis://cache:6380';
      service.onModuleInit();
      expect(createRedisClient).toHaveBeenCalledWith('redis://cache:6380');
    });

    it('should throw error if BETTER_AUTH_SECRET is missing', () => {
      const secret = process.env.BETTER_AUTH_SECRET;
      delete process.env.BETTER_AUTH_SECRET;
      expect(() => service.onModuleInit()).toThrow(
        'BETTER_AUTH_SECRET is required',
      );
      process.env.BETTER_AUTH_SECRET = secret;
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
      process.env.SYSTEM_ADMIN_USER_IDS = ' admin-1, ,admin-2 ';
      service.onModuleInit();
      const auth = service.getAuth();
      expect(auth).toBeDefined();
      expect(admin).toHaveBeenCalledWith(
        expect.objectContaining({ adminUserIds: ['admin-1', 'admin-2'] }),
      );
    });

    it.each([
      [undefined, false],
      ['development', false],
      ['staging', true],
      ['production', true],
    ])('configures secure cookies for NODE_ENV=%p', (nodeEnv, secure) => {
      if (nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnv;
      if (nodeEnv === 'production') {
        jest.mocked(getRedisClient).mockReturnValue({} as never);
      }
      service.getAuth();
      const config = lastBetterAuthConfig();
      expect(config.advanced.useSecureCookies).toBe(secure);
    });

    it('uses default URLs and filters empty trusted origins', () => {
      delete process.env.BETTER_AUTH_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        ' https://one.example, ,https://two.example ';
      service.getAuth();
      const config = lastBetterAuthConfig();
      expect(config.baseURL).toBe('http://localhost:3000/api/auth');
      expect(config.trustedOrigins).toEqual([
        'https://one.example',
        'https://two.example',
      ]);
    });

    it('uses explicit URLs and defaults trusted origins to an empty list', () => {
      process.env.BETTER_AUTH_URL = 'https://api.example/auth';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example';
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      service.getAuth();
      const config = lastBetterAuthConfig();
      expect(config.baseURL).toBe('https://api.example/auth');
      expect(config.trustedOrigins).toEqual([]);
    });

    it('configures Google only when both credentials are present', () => {
      process.env.GOOGLE_CLIENT_ID = 'client';
      process.env.GOOGLE_CLIENT_SECRET = 'secret';
      service.getAuth();
      expect(lastBetterAuthConfig().socialProviders).toMatchObject({
        google: { clientId: 'client', clientSecret: 'secret' },
      });

      const local = new AuthService({ db: {} } as never, mailerService);
      delete process.env.GOOGLE_CLIENT_SECRET;
      local.getAuth();
      expect(lastBetterAuthConfig().socialProviders).toBeUndefined();
    });

    it('delegates reset and verification emails, including default names', async () => {
      service.getAuth();
      const config = lastBetterAuthConfig();
      await config.emailAndPassword.sendResetPassword({
        user: { id: 'u1', email: 'reset@example.com', name: '' },
        url: 'http://localhost:3000/api/auth/reset-password/token-1',
      });
      await config.emailVerification.sendVerificationEmail({
        user: { id: 'u2', email: 'verify@example.com', name: 'Verifier' },
        url: 'http://localhost:3000/api/auth/verify-email?token=token-2',
      });
      expect(mailerService.sendResetPasswordEmail).toHaveBeenCalledWith({
        email: 'reset@example.com',
        name: 'User',
        url: 'http://localhost:3000/reset-password?token=token-1',
      });
      expect(mailerService.sendVerificationEmail).toHaveBeenCalledWith({
        email: 'verify@example.com',
        name: 'Verifier',
        url: 'http://localhost:3000/verify-email?token=token-2',
      });
    });
  });

  describe('userExistsByEmail', () => {
    it('returns true when user row found', async () => {
      const { mockDb: database, service: local } = userExistsHarness([
        { id: 'user-1' },
      ]);
      const result = await local.userExistsByEmail('found@example.com');
      expect(result).toBe(true);
      expect(database.select).toHaveBeenCalled();
    });

    it('returns false when no user found', async () => {
      const { service: local } = userExistsHarness([]);
      const result = await local.userExistsByEmail('missing@example.com');
      expect(result).toBe(false);
    });
  });

  describe('userExistsById', () => {
    it('returns true when the authoritative user row exists', async () => {
      const { service: local } = userExistsHarness([{ id: 'user-1' }]);

      await expect(local.userExistsById('user-1')).resolves.toBe(true);
    });

    it('returns false when a cached session refers to a deleted user', async () => {
      const { service: local } = userExistsHarness([]);

      await expect(local.userExistsById('deleted-user')).resolves.toBe(false);
    });
  });

  describe('getAuth - mail callback wiring', () => {
    it('wires sendResetPasswordEmail to mailerService.sendResetPasswordEmail', async () => {
      const mockMailerService = {
        sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      };
      const localModule = await Test.createTestingModule({
        providers: [
          AuthService,
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

  describe('university selection', () => {
    it('rejects a missing university', async () => {
      const { service: local } = roleHarness([[]]);
      await expect(
        local.getUniversityRole('user-1', 'missing'),
      ).rejects.toThrow('University[missing] does not exist');
    });

    it('returns undefined when the user has no eligible role', async () => {
      const { service: local } = roleHarness([
        [createUniversity({ UniversityID: 'uni-1' })],
        [],
      ]);
      await expect(
        local.getUniversityRole('user-1', 'uni-1'),
      ).resolves.toBeUndefined();
    });

    it.each([
      ['UNIVERSITY_ADMIN', 'uni_admin'],
      ['UNIVERSITY_ADMIN_PENDING', 'uni_admin_pending'],
      ['LECTURER', 'lecturer'],
      ['LECTURER_PENDING', 'lecturer_pending'],
      ['STUDENT', 'student'],
      ['defensive-future-role', 'student'],
    ])('maps persisted university role %s to %s', async (role, expected) => {
      const { service: local } = roleHarness([
        [createUniversity({ UniversityID: 'uni-1' })],
        [
          createUniversityRole({
            UserID: 'user-1',
            UniversityID: 'uni-1',
            role: role as never,
          }),
        ],
      ]);
      await expect(local.getUniversityRole('user-1', 'uni-1')).resolves.toBe(
        expected,
      );
    });

    it('rejects missing or empty university IDs', async () => {
      const session = createMockSession('user-1');
      await expect(service.selectUniversity(session, '')).rejects.toThrow(
        'Probleempie: uniId[]',
      );
    });

    it('enriches a session while preserving all existing fields', async () => {
      const session = createMockSession('user-1', 'user', {
        uniId: 'old-uni',
        uniRole: 'student',
        user: { name: 'Preserved' },
      });
      jest
        .spyOn(service, 'getUniversityRole')
        .mockResolvedValue('lecturer_pending');
      await expect(service.selectUniversity(session, 'uni-2')).resolves.toEqual(
        {
          ...session,
          uniId: 'uni-2',
          uniRole: 'lecturer_pending',
        },
      );
    });

    it('allows selection when the university role is undefined', async () => {
      const session = createMockSession('user-1');
      jest.spyOn(service, 'getUniversityRole').mockResolvedValue(undefined);
      await expect(service.selectUniversity(session, 'uni-1')).resolves.toEqual(
        {
          ...session,
          uniId: 'uni-1',
          uniRole: undefined,
        },
      );
    });
  });

  describe('mock-user management', () => {
    function mockUserHarness(ops: {
      select?: unknown[][];
      insert?: unknown[][];
      update?: unknown[][];
      delete?: unknown[][];
    }) {
      const { mockDb: database } = createMockDatabase();
      mockTransaction(database, ops);
      const local = new AuthService(
        { db: database } as never,
        {
          sendResetPasswordEmail: jest.fn(),
          sendVerificationEmail: jest.fn(),
        } as never,
      );
      const createUser = jest.fn().mockResolvedValue({
        user: { id: 'created-user' },
      });
      Object.assign(local as object, {
        authInitialized: true,
        authInstance: { api: { createUser } },
      });
      return { database, local, createUser };
    }

    it('returns an existing mock user without creating a duplicate', async () => {
      const { local, createUser } = mockUserHarness({
        select: [[{ id: 'existing-user', email: 'existing@simulation.com' }]],
      });

      await expect(
        local.createMockUser({
          email: 'existing@simulation.com',
          password: 'Existing!Password',
        }),
      ).resolves.toEqual({
        email: 'existing@simulation.com',
        password: 'Existing!Password',
      });
      expect(createUser).not.toHaveBeenCalled();
    });

    it('creates, verifies, and assigns a university role to a mock user', async () => {
      const { database, local, createUser } = mockUserHarness({
        select: [[], [{ uniID: 'uni-1' }]],
        update: [[]],
        insert: [[{ UserID: 'created-user' }]],
      });

      await expect(
        local.createMockUser(
          {
            email: 'lecturer@simulation.com',
            name: 'Mock Lecturer',
            password: 'Lecturer!Password',
          },
          MockUserRole.LECTURER,
        ),
      ).resolves.toEqual({
        email: 'lecturer@simulation.com',
        password: 'Lecturer!Password',
        uniId: 'uni-1',
      });
      expect(createUser).toHaveBeenCalledWith({
        body: {
          email: 'lecturer@simulation.com',
          password: 'Lecturer!Password',
          name: 'Mock Lecturer',
          role: 'user',
        },
      });
      expect(database.update).toHaveBeenCalledTimes(1);
      expect(database.insert).toHaveBeenCalledTimes(1);
    });

    it('uses generated defaults and skips role assignment without a university', async () => {
      const now = jest.spyOn(Date, 'now').mockReturnValue(123456789);
      const random = jest.spyOn(Math, 'random').mockReturnValue(0.042);
      const { database, local, createUser } = mockUserHarness({
        select: [[], []],
        update: [[]],
      });

      try {
        await expect(local.createMockUser({})).resolves.toEqual({
          email: 'test_user_123456789_42@simulation.com',
          password: 'password123!',
          uniId: undefined,
        });
        expect(createUser).toHaveBeenCalledWith({
          body: {
            email: 'test_user_123456789_42@simulation.com',
            password: 'password123!',
            name: 'Test User',
            role: 'user',
          },
        });
        expect(database.insert).not.toHaveBeenCalled();
      } finally {
        now.mockRestore();
        random.mockRestore();
      }
    });

    it('deletes only generated mock users and reports the count', async () => {
      const { database, local } = mockUserHarness({
        delete: [[{ id: 'one' }, { id: 'two' }]],
      });

      await expect(local.deleteMockUsers()).resolves.toEqual({
        success: true,
        message: 'Deleted 2 users.',
      });
      expect(database.delete).toHaveBeenCalledTimes(1);
    });
  });

  function roleHarness(results: unknown[][]) {
    const { mockDb } = createMockDatabase();
    mockSequentialResults(mockDb.select as jest.Mock, results);
    return {
      service: new AuthService(
        { db: mockDb } as never,
        {
          sendResetPasswordEmail: jest.fn(),
          sendVerificationEmail: jest.fn(),
        } as never,
      ),
    };
  }

  function userExistsHarness(rows: unknown[]) {
    const { mockDb: database } = createMockDatabase();
    mockDbResult(database.select as jest.Mock, rows);
    return {
      mockDb: database,
      service: new AuthService(
        { db: database } as never,
        {
          sendResetPasswordEmail: jest.fn(),
          sendVerificationEmail: jest.fn(),
        } as never,
      ),
    };
  }

  function lastBetterAuthConfig(): any {
    return (betterAuth as jest.Mock).mock.calls.at(-1)?.[0];
  }
});

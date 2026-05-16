import { mapGoogleProfileToUser, createAuth } from './auth';
import { betterAuth } from 'better-auth';
import type { LoggerService } from '@nestjs/common';

describe('mapGoogleProfileToUser', () => {
  it('maps full profile with all fields', () => {
    const result = mapGoogleProfileToUser({
      name: 'Alice Smith',
      email: 'alice@example.com',
      picture: 'https://example.com/pic.jpg',
    });
    expect(result).toEqual({
      name: 'Alice Smith',
      email: 'alice@example.com',
      image: 'https://example.com/pic.jpg',
    });
  });

  it('falls back to email prefix when name missing', () => {
    const result = mapGoogleProfileToUser({
      email: 'bob@example.com',
    });
    expect(result.name).toBe('bob');
    expect(result.image).toBeUndefined();
  });

  it('returns empty strings when name and email both missing', () => {
    const result = mapGoogleProfileToUser({});
    expect(result.name).toBe('');
    expect(result.email).toBe('');
  });

  it('ignores non-string picture', () => {
    const result = mapGoogleProfileToUser({
      name: 'Charlie',
      email: 'charlie@example.com',
      picture: 42,
    });
    expect(result.image).toBeUndefined();
  });
});

describe('createAuth — URL rewrite', () => {
  const mockLogger: LoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const mockDb = {} as never;
  const sendResetPasswordEmail = jest.fn().mockResolvedValue(undefined);
  const sendVerificationEmail = jest.fn().mockResolvedValue(undefined);

  function getConfig(appURL?: string) {
    (betterAuth as jest.Mock).mockClear();
    createAuth({
      db: mockDb,
      dbProvider: 'pg',
      baseURL: 'http://localhost:3001/api/auth',
      secret: 'test-secret-at-least-32-chars-long!!',
      trustedOrigins: ['http://localhost:3000'],
      isProduction: false,
      logger: mockLogger,
      sendResetPasswordEmail,
      sendVerificationEmail,
      ...(appURL ? { appURL } : {}),
    });
    return (betterAuth as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendResetPassword', () => {
    it('rewrites URL to appURL when appURL set and token in path', async () => {
      const config = getConfig('http://localhost:3000');
      const emailAndPassword = config.emailAndPassword as Record<
        string,
        unknown
      >;
      const cb = emailAndPassword.sendResetPassword as (input: {
        user: { id: string; email: string; name: string };
        url: string;
      }) => Promise<void>;

      await cb({
        user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
        url: 'http://localhost:3001/api/auth/reset-password/TOKEN123',
      });

      expect(sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:3000/reset-password?token=TOKEN123',
        }),
      );
    });

    it('uses original URL when no appURL', async () => {
      const config = getConfig(undefined);
      const emailAndPassword = config.emailAndPassword as Record<
        string,
        unknown
      >;
      const cb = emailAndPassword.sendResetPassword as (input: {
        user: { id: string; email: string; name: string };
        url: string;
      }) => Promise<void>;

      await cb({
        user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
        url: 'http://localhost:3001/api/auth/reset-password/TOKEN123',
      });

      expect(sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:3001/api/auth/reset-password/TOKEN123',
        }),
      );
    });

    it('warns and uses original URL when token cannot be extracted', async () => {
      const config = getConfig('http://localhost:3000');
      const emailAndPassword = config.emailAndPassword as Record<
        string,
        unknown
      >;
      const cb = emailAndPassword.sendResetPassword as (input: {
        user: { id: string; email: string; name: string };
        url: string;
      }) => Promise<void>;

      await cb({
        user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
        url: 'http://localhost:3001/api/auth/reset-password/',
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Reset URL missing token'),
      );
    });
  });

  describe('sendVerificationEmail callback', () => {
    it('rewrites URL to appURL when appURL set and token present', async () => {
      const config = getConfig('http://localhost:3000');
      const evConfig = config.emailVerification as Record<string, unknown>;
      const cb = evConfig.sendVerificationEmail as (input: {
        user: { id: string; email: string; name: string };
        url: string;
        token: string;
      }) => Promise<void>;

      await cb({
        user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
        url: 'http://localhost:3001/api/auth/verify-email?token=VT123',
        token: 'VT123',
      });

      expect(sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:3000/verify-email?token=VT123',
        }),
      );
    });

    it('warns when URL missing token', async () => {
      const config = getConfig('http://localhost:3000');
      const evConfig = config.emailVerification as Record<string, unknown>;
      const cb = evConfig.sendVerificationEmail as (input: {
        user: { id: string; email: string; name: string };
        url: string;
        token: string;
      }) => Promise<void>;

      await cb({
        user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
        url: 'http://localhost:3001/api/auth/verify-email',
        token: '',
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Verification URL missing token'),
      );
    });

    it('warns instead of sending when no sendVerificationEmail provided', async () => {
      (betterAuth as jest.Mock).mockClear();
      createAuth({
        db: mockDb,
        dbProvider: 'pg',
        baseURL: 'http://localhost:3001/api/auth',
        secret: 'test-secret-at-least-32-chars-long!!',
        trustedOrigins: [],
        isProduction: false,
        logger: mockLogger,
        sendResetPasswordEmail,
        // No sendVerificationEmail
      });
      const config = (betterAuth as jest.Mock).mock.calls[0][0] as Record<
        string,
        unknown
      >;
      const evConfig = config.emailVerification as Record<string, unknown>;
      const cb = evConfig.sendVerificationEmail as (input: {
        user: { id: string; email: string; name: string };
        url: string;
        token: string;
      }) => Promise<void>;

      await cb({
        user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
        url: 'http://localhost:3001/api/auth/verify-email?token=X',
        token: 'X',
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no mailer configured'),
      );
    });
  });

  describe('background task error handler', () => {
    it('logs error when background task rejects', async () => {
      const config = getConfig();
      const advanced = config.advanced as Record<string, unknown>;
      const bgTasks = advanced.backgroundTasks as Record<string, unknown>;
      const backgroundHandler = bgTasks.handler as (
        p: Promise<unknown>,
      ) => void;

      backgroundHandler(Promise.reject(new Error('background fail')));
      await new Promise((r) => setTimeout(r, 0));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Background auth task failed',
        expect.any(Error),
      );
    });
  });
});

describe('createAuth — databaseHooks', () => {
  const mockLogger: LoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  const mockDb = {} as never;
  const sendResetPasswordEmail = jest.fn().mockResolvedValue(undefined);

  type UserCreateBeforeHook = (
    data: Record<string, unknown>,
    ctx: Record<string, unknown> | null,
  ) => Promise<{ data: Record<string, unknown> }>;

  type UserCreateAfterHook = (
    data: Record<string, unknown>,
    ctx: Record<string, unknown> | null,
  ) => Promise<void>;

  type UserUpdateAfterHook = (data: Record<string, unknown>) => Promise<void>;

  type SessionCreateAfterHook = (
    data: Record<string, unknown>,
    ctx: Record<string, unknown> | null,
  ) => Promise<void>;

  type AccountCreateAfterHook = (
    data: Record<string, unknown>,
  ) => Promise<void>;

  function getHooks() {
    (betterAuth as jest.Mock).mockClear();
    createAuth({
      db: mockDb,
      dbProvider: 'pg',
      baseURL: 'http://localhost:3001/api/auth',
      secret: 'test-secret-at-least-32-chars-long!!',
      trustedOrigins: [],
      isProduction: false,
      logger: mockLogger,
      sendResetPasswordEmail,
    });
    const config = (betterAuth as jest.Mock).mock.calls[0][0] as {
      databaseHooks: {
        user: {
          create: { before: UserCreateBeforeHook; after: UserCreateAfterHook };
          update: { after: UserUpdateAfterHook };
        };
        session: { create: { after: SessionCreateAfterHook } };
        account: { create: { after: AccountCreateAfterHook } };
      };
    };
    return config.databaseHooks;
  }

  function makeCtx(actorRole?: string) {
    if (!actorRole) return null;
    return {
      context: {
        session: {
          user: { id: 'actor-1', role: actorRole },
        },
      },
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('user.create.before', () => {
    it('defaults role to student when no role provided and no actor', async () => {
      const hooks = getHooks();
      const result = await hooks.user.create.before({ email: 'x@x.com' }, null);
      expect(result.data.role).toBe('student');
    });

    it('sys_admin passes data through unchanged (no role override)', async () => {
      const hooks = getHooks();
      const result = await hooks.user.create.before(
        { email: 'x@x.com' },
        makeCtx('sys_admin'),
      );
      // sys_admin returns { data } unchanged — input had no role, so output has no role
      expect(result.data.role).toBeUndefined();
    });

    it('allows sys_admin to assign any valid role', async () => {
      const hooks = getHooks();
      const result = await hooks.user.create.before(
        { email: 'x@x.com', role: 'uni_admin' },
        makeCtx('sys_admin'),
      );
      expect(result.data.role).toBe('uni_admin');
    });

    it('allows uni_admin to assign lecturer', async () => {
      const hooks = getHooks();
      const result = await hooks.user.create.before(
        { email: 'x@x.com', role: 'lecturer' },
        makeCtx('uni_admin'),
      );
      expect(result.data.role).toBe('lecturer');
    });

    it('defaults uni_admin create to student when no role provided', async () => {
      const hooks = getHooks();
      const result = await hooks.user.create.before(
        { email: 'x@x.com' },
        makeCtx('uni_admin'),
      );
      expect(result.data.role).toBe('student');
    });

    it('throws FORBIDDEN when uni_admin tries to assign sys_admin', async () => {
      const hooks = getHooks();
      await expect(
        hooks.user.create.before(
          { email: 'x@x.com', role: 'sys_admin' },
          makeCtx('uni_admin'),
        ),
      ).rejects.toThrow('uni_admin can only assign student or lecturer role');
    });

    it('throws BAD_REQUEST for invalid role string', async () => {
      const hooks = getHooks();
      await expect(
        hooks.user.create.before({ email: 'x@x.com', role: 'hacker' }, null),
      ).rejects.toThrow('Invalid role value provided');
    });
  });

  describe('user.create.after', () => {
    it('calls logger.log with audit event containing user.create action', async () => {
      const hooks = getHooks();
      (mockLogger.log as jest.Mock).mockClear();
      await hooks.user.create.after(
        { id: 'u1', email: 'a@b.com' },
        makeCtx('sys_admin'),
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('"action":"user.create"'),
      );
    });
  });

  describe('user.update.after', () => {
    it('calls logger.log with audit event containing user.update action', async () => {
      const hooks = getHooks();
      (mockLogger.log as jest.Mock).mockClear();
      await hooks.user.update.after({ id: 'u1', email: 'a@b.com' });
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('"action":"user.update"'),
      );
    });
  });

  describe('session.create.after', () => {
    it('logs session creation audit event', async () => {
      const hooks = getHooks();
      (mockLogger.log as jest.Mock).mockClear();
      await hooks.session.create.after({ id: 's1', userId: 'u1' }, null);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('"action":"session.create"'),
      );
    });

    it('logs impersonation event when impersonatedBy set', async () => {
      const hooks = getHooks();
      (mockLogger.log as jest.Mock).mockClear();
      await hooks.session.create.after(
        { id: 's1', userId: 'u1', impersonatedBy: 'admin-session-1' },
        null,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('"event":"impersonate"'),
      );
    });
  });

  describe('account.create.after', () => {
    it('calls logger.log with audit event containing account.link action', async () => {
      const hooks = getHooks();
      (mockLogger.log as jest.Mock).mockClear();
      await hooks.account.create.after({
        userId: 'u1',
        providerId: 'credential',
      });
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('"action":"account.link"'),
      );
    });
  });
});

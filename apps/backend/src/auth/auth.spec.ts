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

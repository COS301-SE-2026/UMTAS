import type { LoggerService } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { redisStorage } from '@better-auth/redis-storage';
import * as appSchema from '../entities';
import { isAppRole, UniRole } from './roles';
import { getRedisClient } from '../redis/redis';
import { ac, sysAdmin, user } from './permissions';
import { SessionData } from './session.decorator';

export type AppDatabase =
  | NodePgDatabase<typeof appSchema>
  | PgliteDatabase<typeof appSchema>;
type Database = AppDatabase;

export type AuthInstance = ReturnType<typeof createAuth>;
export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role: string;
    banned: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    impersonatedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  uniId?: string;
  uniRole?: UniRole;
}

export function normalizeSession(raw: AuthSession): SessionData {
  const toIso = (v: unknown): string | undefined => {
    if (v == null) return undefined;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return new Date(v).toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object' && v !== null && 'toISOString' in v) {
      const maybeDate = v as { toISOString?: unknown };
      if (typeof maybeDate.toISOString === 'function') {
        return (maybeDate.toISOString as () => string)();
      }
    }
    return undefined;
  };

  return {
    ...raw,
    user: {
      ...raw.user,
      role: raw.user.role === 'sys_admin' ? 'sys_admin' : 'user',
      image: raw.user.image ?? undefined,
      banned: raw.user.banned ?? false,
      banReason: raw.user.banReason ?? undefined,
      banExpires: toIso(raw.user.banExpires),
      createdAt: toIso(raw.user.createdAt) ?? new Date().toISOString(),
      updatedAt: toIso(raw.user.updatedAt) ?? new Date().toISOString(),
    },
    session: (() => {
      const s = raw.session ?? ({} as AuthSession['session']);
      return {
        ...s,
        expiresAt: toIso(s.expiresAt) ?? new Date().toISOString(),
        createdAt: toIso(s.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(s.updatedAt) ?? new Date().toISOString(),
        ipAddress: s.ipAddress ?? undefined,
        userAgent: s.userAgent ?? undefined,
        impersonatedBy: s.impersonatedBy ?? undefined,
      };
    })(),
    uniId: raw.uniId,
    uniRole: raw.uniRole,
  };
}

export interface GoogleProfile {
  name?: unknown;
  email?: unknown;
  picture?: unknown;
}

export function mapGoogleProfileToUser(profile: GoogleProfile): {
  name: string;
  email: string;
  image?: string;
} {
  const result: { name: string; email: string; image?: string } = {
    name:
      typeof profile.name === 'string'
        ? profile.name
        : typeof profile.email === 'string'
          ? profile.email.split('@')[0]
          : '',
    email: typeof profile.email === 'string' ? profile.email : '',
  };

  if (typeof profile.picture === 'string') {
    result.image = profile.picture;
  }

  return result;
}

function logAuditEvent(
  logger: LoggerService,
  event: Record<string, unknown>,
): void {
  logger.log(
    JSON.stringify({
      audit: true,
      timestamp: new Date().toISOString(),
      ...event,
    }),
  );
}

function extractActorFromCtx(ctx: Record<string, unknown> | null): {
  id?: string;
  role?: string;
} {
  const session = (ctx?.context as Record<string, unknown> | undefined)
    ?.session as Record<string, unknown> | undefined;
  const user = session?.user as Record<string, unknown> | undefined;
  const userId = user?.id as string | number | null | undefined;
  const userRole = user?.role as string | number | null | undefined;
  return {
    id: userId != null ? String(userId) : undefined,
    role: userRole != null ? String(userRole) : undefined,
  };
}

interface CreateAuthInput {
  db: Database;
  dbProvider: 'pg' | 'mysql' | 'sqlite';
  baseURL: string;
  secret: string;
  trustedOrigins: string[];
  googleClientId?: string;
  googleClientSecret?: string;
  systemAdminUserIds?: string[];
  isProduction: boolean;
  useSecureCookies?: boolean;
  logger: LoggerService;
  appURL?: string;
  sendResetPasswordEmail: (input: {
    email: string;
    url: string;
    name?: string;
  }) => Promise<void>;
  sendVerificationEmail?: (input: {
    email: string;
    url: string;
    name: string;
  }) => Promise<void>;
  redisUrl?: string;
}

export function createAuth(input: CreateAuthInput) {
  const {
    db,
    dbProvider,
    baseURL,
    appURL,
    secret,
    trustedOrigins,
    googleClientId,
    googleClientSecret,
    systemAdminUserIds,
    isProduction,
    useSecureCookies = isProduction,
    logger,
    sendResetPasswordEmail,
    sendVerificationEmail,
    redisUrl,
  } = input;

  const redisClient = redisUrl ? getRedisClient() : null;

  // Validate Redis client in production when redisUrl is provided
  if (isProduction && redisUrl && !redisClient) {
    throw new Error(
      'Redis URL configured but client initialization failed. Rate limiting and session storage require Redis in production.',
    );
  }
  return betterAuth({
    secondaryStorage: redisClient
      ? redisStorage({
          client: redisClient,
          keyPrefix: 'umtas:auth:',
        })
      : undefined,
    database: drizzleAdapter(db, {
      provider: dbProvider,
      schema: {
        user: appSchema.usersTable,
        session: appSchema.sessionsTable,
        account: appSchema.accountsTable,
        verification: appSchema.verificationsTable,
        rateLimit: appSchema.rateLimitTable,
      },
    }),
    secret,
    baseURL,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }) => {
        logger.log(`BetterAuth generated reset URL: ${url}`);
        // url is constructed using baseURL (backend). If appURL (frontend) is
        // provided, we want to point the user to the frontend reset page.
        let resetUrl = url;
        if (appURL) {
          try {
            const urlObj = new URL(url);
            // BetterAuth puts the reset token in the path (/reset-password/{token}),
            // not a query param. Fall back to path extraction when ?token= is absent.
            const token =
              urlObj.searchParams.get('token') ??
              (urlObj.pathname.split('/').pop() || null);
            if (token) {
              resetUrl = `${appURL.replace(/\/$/, '')}/reset-password?token=${token}`;
              logger.log(`Rewrote reset URL to: ${resetUrl}`);
            } else {
              logger.warn(`Reset URL missing token: ${url}`);
            }
          } catch (error) {
            logger.error(`Failed to rewrite reset URL: ${url}`, error);
          }
        }

        logger.log(
          `Password reset requested for ${user.email}. Link: ${resetUrl}`,
        );
        logAuditEvent(logger, {
          action: 'password.reset_requested',
          targetUserId: user.id,
          targetEmail: user.email,
        });
        await sendResetPasswordEmail({
          email: user.email,
          url: resetUrl,
          name: user.name || 'User',
        });
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      onPasswordReset: async ({ user }) => {
        logger.log(`Password reset completed for ${user.email}`);
        logAuditEvent(logger, {
          action: 'password.reset_completed',
          targetUserId: user.id,
          targetEmail: user.email,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        logger.log(`BetterAuth generated verification URL: ${url}`);
        // url is constructed using baseURL (backend). If appURL (frontend) is
        // provided, we want to point the user to the frontend verification page.
        let verifyUrl = url;
        if (appURL) {
          try {
            const urlObj = new URL(url);
            const token = urlObj.searchParams.get('token');
            if (token) {
              verifyUrl = `${appURL.replace(/\/$/, '')}/verify-email?token=${token}`;
              logger.log(`Rewrote verification URL to: ${verifyUrl}`);
            } else {
              logger.warn(`Verification URL missing token: ${url}`);
            }
          } catch (error) {
            logger.error(`Failed to rewrite verification URL: ${url}`, error);
          }
        }

        logger.log(
          `Sending verification email to ${user.email}. Link: ${verifyUrl}`,
        );
        if (sendVerificationEmail) {
          await sendVerificationEmail({
            email: user.email,
            url: verifyUrl,
            name: user.name || 'User',
          });
        } else {
          logger.warn(
            `Email verification email not sent for ${user.email} (no mailer configured)`,
          );
        }
      },
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
              scope: ['openid', 'email', 'profile'],
              mapProfileToUser: mapGoogleProfileToUser,
            },
          }
        : undefined,
    rateLimit: {
      enabled: true,
      storage: redisClient ? 'secondary-storage' : 'memory',
      window: 60,
      max: 100,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days (reduced from 30 for classroom security)
      updateAge: 60 * 60 * 24, // Update session after 1 day of inactivity
      freshAge: 60 * 10, // Require fresh auth for sensitive operations (10 minutes)
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
        strategy: 'jwe',
      },
    },
    account: {
      encryptOAuthTokens: true,
      storeStateStrategy: 'cookie',
      accountLinking: {
        // Safe: BetterAuth only links accounts with matching email.
        // `requireEmailVerification: true` ensures the credential account
        // has a verified email before an OAuth account can link to it,
        // preventing OAuth account takeover via unverified email registration.
        enabled: true,
        trustedProviders: ['google'],
      },
    },
    advanced: {
      disableCSRFCheck: false,
      useSecureCookies: useSecureCookies,
      cookiePrefix: process.env.COOKIE_PREFIX ?? 'umtas',
      defaultCookieAttributes: {
        sameSite: 'lax',
        path: '/',
      },
      ipAddress: {
        ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
        ipv6Subnet: 64,
      },
      backgroundTasks: {
        handler: (promise) => {
          void promise.catch((error: unknown) => {
            logger.error('Background auth task failed', error);
          });
        },
      },
    },
    plugins: [
      admin({
        ac,
        defaultRole: 'user',
        adminRoles: ['sys_admin'],
        adminUserIds: systemAdminUserIds,
        roles: {
          sys_admin: sysAdmin,
          user: user,
        },
      }),
    ],
    databaseHooks: {
      user: {
        create: {
          // eslint-disable-next-line @typescript-eslint/require-await
          before: async (
            data: Record<string, unknown>,
            ctx: Record<string, unknown> | null,
          ) => {
            // generate uuid
            if (!data.id) data.id = crypto.randomUUID();

            const contextObj = ctx?.context as
              | Record<string, unknown>
              | undefined;
            const sessionObj = contextObj?.session as
              | Record<string, unknown>
              | undefined;
            const userObj = sessionObj?.user as
              | Record<string, unknown>
              | undefined;
            const actorRole = userObj?.role;
            const requestedRole = data.role;

            if (requestedRole !== undefined && !isAppRole(requestedRole)) {
              throw new APIError('BAD_REQUEST', {
                message: 'Invalid app role value provided',
              });
            }

            if (actorRole === 'sys_admin') {
              return {
                data: { ...data, role: requestedRole ?? 'user' },
              };
            }

            if (requestedRole === 'sys_admin') {
              throw new APIError('FORBIDDEN', {
                message: 'Only sys_admin can assign sys_admin role',
              });
            }

            return {
              data: {
                ...data,
                role: 'user',
              },
            };
          },
          // eslint-disable-next-line @typescript-eslint/require-await
          after: async (
            data: Record<string, unknown>,
            ctx: Record<string, unknown> | null,
          ) => {
            const actor = extractActorFromCtx(ctx);
            logAuditEvent(logger, {
              action: 'user.create',
              actorId: actor.id,
              actorRole: actor.role,
              targetUserId: String(data.id),
              targetEmail: typeof data.email === 'string' ? data.email : '',
            });
          },
        },
        update: {
          // eslint-disable-next-line @typescript-eslint/require-await
          after: async (data: Record<string, unknown>) => {
            logAuditEvent(logger, {
              action: 'user.update',
              targetUserId: String(data.id),
              targetEmail: typeof data.email === 'string' ? data.email : '',
            });
          },
        },
      },
      session: {
        create: {
          // eslint-disable-next-line @typescript-eslint/require-await
          after: async (
            data: Record<string, unknown>,
            ctx: Record<string, unknown> | null,
          ) => {
            const requestObj = ctx?.request as Request | undefined;
            logger.log(
              `Session created for user ${String(data.userId)} from ${requestObj?.headers?.get('x-forwarded-for') ?? 'unknown-ip'}`,
            );

            if (data.impersonatedBy) {
              logAuditEvent(logger, {
                event: 'impersonate',
                actorSessionId:
                  typeof data.impersonatedBy === 'string'
                    ? data.impersonatedBy
                    : JSON.stringify(data.impersonatedBy),
                targetUserId: String(data.userId),
              });
            }

            logAuditEvent(logger, {
              action: 'session.create',
              targetUserId: String(data.userId),
              sessionId: String(data.id),
            });
          },
        },
      },
      account: {
        create: {
          // eslint-disable-next-line @typescript-eslint/require-await
          after: async (data: Record<string, unknown>) => {
            logger.log(
              `Account linked for user ${String(data.userId)} via ${String(data.providerId)}`,
            );
            logAuditEvent(logger, {
              action: 'account.link',
              targetUserId: String(data.userId),
              providerId: String(data.providerId),
            });
          },
        },
      },
    },
  });
}

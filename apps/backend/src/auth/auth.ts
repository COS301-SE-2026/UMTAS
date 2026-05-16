import type { LoggerService } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { redisStorage } from '@better-auth/redis-storage';
import * as appSchema from '../db/schema';
import { isAppRole } from './roles';
import { getRedisClient } from '../redis/redis';
import { ac, student, lecturer, uniAdmin, sysAdmin } from './permissions';

export type AppDatabase =
  | NodePgDatabase<typeof appSchema>
  | PgliteDatabase<typeof appSchema>;
type Database = AppDatabase;

export type AuthInstance = ReturnType<typeof betterAuth>;
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
  logger: LoggerService;
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

export function createAuth(input: CreateAuthInput): AuthInstance {
  const {
    db,
    dbProvider,
    baseURL,
    secret,
    trustedOrigins,
    googleClientId,
    googleClientSecret,
    systemAdminUserIds,
    isProduction,
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

  // Type cast needed: BetterAuth's admin plugin extends the user schema at
  // runtime (adds banned/role fields) but the generic type system can't
  // represent this as assignable to the base Auth<BetterAuthOptions>.
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
        await sendResetPasswordEmail({
          email: user.email,
          url,
          name: user.name || 'User',
        });
      },
      onPasswordReset: ({ user }) => {
        logger.log(`Password reset completed for ${user.email}`);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (sendVerificationEmail) {
          await sendVerificationEmail({
            email: user.email,
            url,
            name: user.name || 'User',
          });
        } else {
          logger.warn(
            `Email verification email not sent (no mailer configured)`,
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
      freshAge: 60 * 60, // Require fresh auth for sensitive operations (1 hour)
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
      },
    },
    advanced: {
      disableCSRFCheck: false,
      useSecureCookies: isProduction,
      cookiePrefix: 'umtas',
      defaultCookieAttributes: {
        sameSite: 'lax',
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
        defaultRole: 'student',
        adminRoles: ['sys_admin'],
        adminUserIds: systemAdminUserIds,
        roles: {
          student,
          lecturer,
          uni_admin: uniAdmin,
          sys_admin: sysAdmin,
        },
      }),
    ],
    databaseHooks: {
      user: {
        create: {
          before: (
            data: Record<string, unknown>,
            ctx: Record<string, unknown> | null,
          ) => {
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
                message: 'Invalid role value provided',
              });
            }

            // sys_admin may assign any valid role, or omit role (defaults to student)
            if (actorRole === 'sys_admin') {
              return { data };
            }

            // uni_admin may only assign student or lecturer
            if (actorRole === 'uni_admin') {
              const assignable = ['student', 'lecturer'];
              if (
                requestedRole !== undefined &&
                !assignable.includes(requestedRole)
              ) {
                throw new APIError('FORBIDDEN', {
                  message: 'uni_admin can only assign student or lecturer role',
                });
              }
              return {
                data: { ...data, role: requestedRole ?? 'student' },
              };
            }

            return {
              data: {
                ...data,
                role: 'student',
              },
            };
          },
          after: (
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
          after: (data: Record<string, unknown>) => {
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
          after: (
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
          after: (data: Record<string, unknown>) => {
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

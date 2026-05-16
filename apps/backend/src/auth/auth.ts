import type { LoggerService } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { defaultRoles } from 'better-auth/plugins/admin/access';
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
export type AuthSession = any;

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
      onPasswordReset: async ({ user }) => {
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
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 60,
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
          before: async (
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
                !assignable.includes(requestedRole as string)
              ) {
                throw new APIError('FORBIDDEN', {
                  message: 'uni_admin can only assign student or lecturer role',
                });
              }
              return { data: { ...data, role: requestedRole ?? 'student' } };
            }

            return {
              data: {
                ...data,
                role: 'student',
              },
            };
          },
          after: async (
            data: Record<string, unknown>,
            ctx: Record<string, unknown> | null,
          ) => {
            const actor = (ctx?.context as Record<string, unknown> | undefined)
              ?.session as Record<string, unknown> | undefined;
            logAuditEvent(logger, {
              action: 'user.create',
              actorId: actor?.user
                ? String((actor.user as Record<string, unknown>).id)
                : undefined,
              actorRole: actor?.user
                ? String((actor.user as Record<string, unknown>).role)
                : undefined,
              targetUserId: String(data.id),
              targetEmail: String(data.email ?? ''),
            });
          },
        },
        update: {
          after: async (data: Record<string, unknown>) => {
            logAuditEvent(logger, {
              action: 'user.update',
              targetUserId: String(data.id),
              targetEmail: String(data.email ?? ''),
            });
          },
        },
      },
      session: {
        create: {
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
                actorSessionId: String(data.impersonatedBy),
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
  }) as any;
}

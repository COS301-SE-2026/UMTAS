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
import { ac, student, uniAdmin, sysAdmin } from './permissions';

export type AppDatabase =
  | NodePgDatabase<typeof appSchema>
  | PgliteDatabase<typeof appSchema>;
type Database = AppDatabase;

export type AuthInstance = ReturnType<typeof betterAuth>;
export type AuthSession = any;

interface CreateAuthInput {
  db: Database;
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
      provider: 'pg',
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
        void sendResetPasswordEmail({ email: user.email, url });
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
              mapProfileToUser: (profile) => {
                const result: { name: string; email: string; image?: string } =
                  {
                    name:
                      typeof profile.name === 'string'
                        ? profile.name
                        : 'Student',
                    email:
                      typeof profile.email === 'string' ? profile.email : '',
                  };
                if (typeof profile.picture === 'string') {
                  result.image = profile.picture;
                }
                return result;
              },
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

            if (
              actorRole === 'sys_admin' &&
              requestedRole !== undefined &&
              !isAppRole(requestedRole)
            ) {
              throw new APIError('BAD_REQUEST', {
                message: 'Invalid role value provided',
              });
            }

            if (actorRole === 'sys_admin' && isAppRole(requestedRole)) {
              return { data };
            }

            return {
              data: {
                ...data,
                role: 'student',
              },
            };
          },
        },
        update: {
          after: async (data: Record<string, unknown>) => {
            logger.warn(`User updated: ${String(data.id)}`);
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
          },
        },
      },
      account: {
        create: {
          after: async (data: Record<string, unknown>) => {
            logger.log(
              `Account linked for user ${String(data.userId)} via ${String(data.providerId)}`,
            );
          },
        },
      },
    },
  }) as any;
}

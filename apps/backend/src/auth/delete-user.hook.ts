import type { LoggerService } from '@nestjs/common';
import { APIError } from 'better-auth';

export interface DeletableUser {
  id: string;
  email: string;
  role?: string | null;
}

export interface BeforeDeleteUserHookOptions {
  logger: LoggerService;
  systemAdminUserIds?: string[];
  prepareUserDeletion: (user: { id: string; email: string }) => Promise<void>;
  audit: (logger: LoggerService, event: Record<string, unknown>) => void;
}

export const SYS_ADMIN_DELETE_MESSAGE =
  'System administrator accounts cannot be deleted from Account settings. Ask another system administrator to remove your administrator role first.';

export function createBeforeDeleteUserHook(
  options: BeforeDeleteUserHookOptions,
): (user: DeletableUser) => Promise<void> {
  const {
    logger,
    systemAdminUserIds = [],
    prepareUserDeletion,
    audit,
  } = options;

  return async (user) => {
    if (user.role === 'sys_admin' || systemAdminUserIds.includes(user.id)) {
      audit(logger, {
        action: 'user.delete_blocked',
        targetUserId: user.id,
        reason: 'sys_admin',
      });
      throw new APIError('FORBIDDEN', { message: SYS_ADMIN_DELETE_MESSAGE });
    }

    try {
      await prepareUserDeletion({ id: user.id, email: user.email });
    } catch (error) {
      logger.warn('Account deletion preparation failed', error);
    }

    audit(logger, {
      action: 'user.delete_attempt',
      targetUserId: user.id,
      targetEmail: user.email,
    });
  };
}

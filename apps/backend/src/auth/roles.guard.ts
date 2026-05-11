import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthSession } from './auth.js';
import type { AppRole } from './roles.js';
import { AuthService } from './auth.service.js';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredRoles =
      (Reflect.getMetadata(ROLES_KEY, context.getHandler()) as
        | AppRole[]
        | undefined) ??
      (Reflect.getMetadata(ROLES_KEY, context.getClass()) as
        | AppRole[]
        | undefined);

    if (!requiredRoles) {
      return true;
    }

    return await this.validateSession(request, requiredRoles);
  }

  private async validateSession(
    request: Request,
    requiredRoles: AppRole[],
  ): Promise<boolean> {
    let session: AuthSession | null =
      (request as unknown as Record<string, unknown>).authSession ?? null;

    if (!session && (request.headers.cookie || request.headers.authorization)) {
      const headers = new Headers();
      if (request.headers.cookie)
        headers.set('cookie', String(request.headers.cookie));
      if (request.headers.authorization)
        headers.set('authorization', String(request.headers.authorization));

      const auth = this.authService.getAuth();
      try {
        const data = await auth.api.getSession({ headers });
        if (data) {
          session = data as AuthSession;
          (request as unknown as Record<string, unknown>).authSession = session;
        }
      } catch (err) {
        this.logger.error('Failed to fetch session via auth API', err);
      }
    }

    if (!session || !(session.user as { role?: unknown })?.role) {
      throw new ForbiddenException('No active session');
    }

    const userRole = (session.user as { role?: unknown }).role as AppRole;
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      this.logger.warn(
        `Access denied: user ${session.user.id} role=${userRole} required=${requiredRoles.join(',')}`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

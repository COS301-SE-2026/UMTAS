import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithSession } from './auth.guard';
import type { AppRole } from './roles';
import { SYS_ADMIN_ROLE } from './roles';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
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

    return this.validateSession(request, requiredRoles);
  }

  private validateSession(
    request: RequestWithSession,
    requiredRoles: AppRole[],
  ): boolean {
    const session = request.session ?? null;

    if (!session || !session.user.role) {
      throw new UnauthorizedException('No active session');
    }

    const userRole = session.user.role as AppRole;
    if (userRole === SYS_ADMIN_ROLE) {
      return true;
    }
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

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
import type { AllRoles } from './roles';
import { SYS_ADMIN_ROLE } from './roles';

//User roles
export const ROLES_KEY = 'roles';
export const Roles = (...roles: AllRoles[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const requiredRoles =
      (Reflect.getMetadata(ROLES_KEY, context.getHandler()) as
        | AllRoles[]
        | undefined) ??
      (Reflect.getMetadata(ROLES_KEY, context.getClass()) as
        | AllRoles[]
        | undefined);

    if (!requiredRoles) return true;

    return this.validateSession(request, requiredRoles);
  }

  private validateSession(
    request: RequestWithSession,
    requiredRoles: AllRoles[],
  ): boolean {
    const session = request.session ?? null;

    if (!session || !session.user)
      throw new UnauthorizedException('No active session');

    const userRole = session.user.role as AllRoles;
    //Sys_admin has full access
    if (userRole === SYS_ADMIN_ROLE) return true;
    //if not an admin -> if User included in requiredRoles then grant access
    if (requiredRoles.includes('user')) return true;

    //UniRole logic - same role decorator with the requiredRoles just including the uni specific roles
    //Check if uni has been selected
    const uniId = session.uniId;
    if (!uniId)
      throw new ForbiddenException(
        `No university selected for user[${session.user.id}]`,
      );

    //Check if user has role for university
    const uniRole = session.uniRole as AllRoles;
    if (!uniRole)
      throw new ForbiddenException(
        `No role for user[${session.user.id}] for university[${uniId}]`,
      );

    //if requiredroles include the user's uniRole -> grant access
    if (requiredRoles.includes(uniRole)) return true;

    throw new ForbiddenException('Insufficient permissions');

    // const hasRole = requiredRoles.includes(userRole);

    // if (!hasRole) {
    //   this.logger.warn(
    //     `Access denied: user ${session.user.id} role=${userRole} required=${requiredRoles.join(',')}`,
    //   );
    // throw new ForbiddenException('Insufficient permissions');
    // }

    // return true;
  }
}

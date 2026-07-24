import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithSession } from './auth.guard';
import type { ApprovedUniRole } from './roles';
import { isApprovedUniRole, isPendingUniRole, SYS_ADMIN_ROLE } from './roles';

export const ROLES_KEY = 'roles';
export const SYSTEM_ADMIN_KEY = 'systemAdmin';
export const Roles = (...roles: ApprovedUniRole[]) =>
  SetMetadata(ROLES_KEY, roles);
export const SystemAdmin = () => SetMetadata(SYSTEM_ADMIN_KEY, true);

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const requiredUniRoles =
      (Reflect.getMetadata(ROLES_KEY, context.getHandler()) as
        | ApprovedUniRole[]
        | undefined) ??
      (Reflect.getMetadata(ROLES_KEY, context.getClass()) as
        | ApprovedUniRole[]
        | undefined);
    const requiresSystemAdmin =
      (Reflect.getMetadata(SYSTEM_ADMIN_KEY, context.getHandler()) as
        | boolean
        | undefined) ??
      (Reflect.getMetadata(SYSTEM_ADMIN_KEY, context.getClass()) as
        | boolean
        | undefined) ??
      false;

    if (!requiresSystemAdmin && requiredUniRoles === undefined) return true;

    return this.validateSession(request, requiresSystemAdmin, requiredUniRoles);
  }

  private validateSession(
    request: RequestWithSession,
    requiresSystemAdmin: boolean,
    requiredUniRoles: ApprovedUniRole[] | undefined,
  ): boolean {
    const session = request.session ?? null;

    if (!session || !session.user)
      throw new UnauthorizedException('No active session');

    if (session.user.role === SYS_ADMIN_ROLE) return true;

    if (requiresSystemAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (
      (requiredUniRoles && requiredUniRoles.length === 0) ||
      requiredUniRoles === undefined
    )
      return true;

    const rolesToCheck =
      requiredUniRoles.length > 0 ? requiredUniRoles : ['student'];
    const uniId = session.uniId;
    if (!uniId) throw new ForbiddenException('No university selected');

    const uniRole = session.uniRole;
    if (!uniRole)
      throw new ForbiddenException('No role for selected university');

    if (isPendingUniRole(uniRole)) {
      throw new ForbiddenException('Role pending approval');
    }

    if (isApprovedUniRole(uniRole) && rolesToCheck.includes(uniRole)) {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}

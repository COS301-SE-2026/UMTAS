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

    //If no roles specified -> return true - basically authenticated public
    if (
      (requiredUniRoles && requiredUniRoles.length === 0) ||
      requiredUniRoles === undefined
    )
      return true;

    //Roles specified in decorator
    const rolesToCheck = requiredUniRoles;

    //Get uniId
    const uniId = session.uniId;
    if (!uniId) throw new ForbiddenException('No university selected');

    //Role of the current user
    const uniRole = session.uniRole;

    //Undefined
    if (!uniRole)
      throw new ForbiddenException('No role for selected university');

    //Pending role
    if (isPendingUniRole(uniRole)) {
      throw new ForbiddenException('Role pending approval');
    }

    //Role hierarchy
    // | role | permission granted to roles |
    // | student | student, lecturer, uni_admin |
    // | lecturer | lecturer, uni_admin |
    // | uni_admin | uni_admin |
    const ROLE_HIERARCHY: Record<ApprovedUniRole, ApprovedUniRole[]> = {
      student: ['student', 'lecturer', 'uni_admin'],
      lecturer: ['lecturer', 'uni_admin'],
      uni_admin: ['uni_admin'],
    };

    if (isApprovedUniRole(uniRole)) {
      //Handle hierarchy
      for (const role of rolesToCheck) {
        if (ROLE_HIERARCHY[role].includes(uniRole)) return true;
      } //END_role
    } //END_is approved role check

    throw new ForbiddenException('Insufficient permissions');
  }
}

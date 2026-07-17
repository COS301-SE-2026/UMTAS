export type AppRole = 'user' | 'sys_admin';
export type ApprovedUniRole = 'student' | 'uni_admin' | 'lecturer';
export type PendingUniRole = 'uni_admin_pending' | 'lecturer_pending';
export type UniRole = ApprovedUniRole | PendingUniRole;
export type AllRoles = AppRole | UniRole;

const APP_ROLES: AppRole[] = ['user', 'sys_admin'];
const APPROVED_UNI_ROLES: ApprovedUniRole[] = [
  'student',
  'uni_admin',
  'lecturer',
];
const PENDING_UNI_ROLES: PendingUniRole[] = [
  'uni_admin_pending',
  'lecturer_pending',
];
const VALID_ROLES: AllRoles[] = [
  ...APP_ROLES,
  ...APPROVED_UNI_ROLES,
  ...PENDING_UNI_ROLES,
];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && APP_ROLES.includes(value as AppRole);
}

export function isApprovedUniRole(value: unknown): value is ApprovedUniRole {
  return (
    typeof value === 'string' &&
    APPROVED_UNI_ROLES.includes(value as ApprovedUniRole)
  );
}

export function isPendingUniRole(value: unknown): value is PendingUniRole {
  return (
    typeof value === 'string' &&
    PENDING_UNI_ROLES.includes(value as PendingUniRole)
  );
}

export function isRole(value: unknown): value is AllRoles {
  return typeof value === 'string' && VALID_ROLES.includes(value as AllRoles);
}

export function assertRole(value: unknown): AllRoles {
  if (!isRole(value)) {
    throw new Error(`Invalid role: ${String(value)}`);
  }
  return value;
}

export const SYS_ADMIN_ROLE: AppRole = 'sys_admin';

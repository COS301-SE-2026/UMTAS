export type AppRole = 'user' | 'sys_admin';
export type UniRole =
  | 'student'
  | 'uni_admin'
  | 'uni_admin_pending'
  | 'lecturer'
  | 'lecturer_pending';
export type AllRoles = AppRole | UniRole;

const VALID_ROLES: AllRoles[] = [
  'user',
  'sys_admin',
  'student',
  'uni_admin',
  'uni_admin_pending',
  'lecturer',
  'lecturer_pending',
];

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

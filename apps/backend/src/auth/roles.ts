export type AppRole = 'student' | 'lecturer' | 'uni_admin' | 'sys_admin';

const VALID_ROLES: AppRole[] = [
  'student',
  'lecturer',
  'uni_admin',
  'sys_admin',
];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as AppRole);
}

export function assertAppRole(value: unknown): AppRole {
  if (!isAppRole(value)) {
    throw new Error(`Invalid role: ${String(value)}`);
  }
  return value;
}

import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

/**
 * Statement definitions - resource types and their allowed actions.
 * These are the permissions that can be granted to roles.
 */
const statements = {
  ...defaultStatements, // user, session (from Better Auth core)
  timetable: ['create', 'view', 'delete', 'export'],
  module: ['create', 'update', 'delete', 'view'],
  venue: ['create', 'update', 'delete', 'view'],
  analytics: ['view'],
  parseJob: ['create', 'view'],
  university: ['create', 'update', 'view'],
} as const;

export const ac = createAccessControl(statements);

/**
 * student - can manage their own timetables only.
 * All other resources are blocked at the service layer.
 */
export const student = ac.newRole({
  timetable: ['create', 'view', 'delete', 'export'],
});

/**
 * lecturer - created by a uni_admin. Read-only on venues/timetables;
 * can update (but not create or delete) modules within their university.
 */
export const lecturer = ac.newRole({
  module: ['update', 'view'],
  venue: ['view'],
  timetable: ['view'],
});

/**
 * uni_admin - full user management within their university,
 * plus venue/module/parse job administration.
 * Cannot manage universities themselves (sys_admin only).
 */
export const uniAdmin = ac.newRole({
  ...adminAc.statements, // grants: user.create/update/delete/ban, session.revoke
  module: ['create', 'update', 'delete', 'view'],
  venue: ['create', 'update', 'delete', 'view'],
  timetable: ['view'],
  analytics: ['view'],
  parseJob: ['create', 'view'],
});

/**
 * sys_admin - full platform access including university provisioning.
 */
export const sysAdmin = ac.newRole({
  ...adminAc.statements,
  timetable: ['create', 'view', 'delete', 'export'],
  module: ['create', 'update', 'delete', 'view'],
  venue: ['create', 'update', 'delete', 'view'],
  analytics: ['view'],
  parseJob: ['create', 'view'],
  university: ['create', 'update', 'view'],
});

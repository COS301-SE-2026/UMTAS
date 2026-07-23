import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ROLES_KEY,
  Roles,
  RolesGuard,
  SYSTEM_ADMIN_KEY,
  SystemAdmin,
} from './roles.guard';
import type { RequestWithSession } from './auth.guard';
import type { SessionData } from './session.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: RequestWithSession;

    beforeEach(() => {
      mockRequest = {
        headers: {
          cookie: 'test-cookie',
        },
      } as unknown as RequestWithSession;

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should read role metadata from the class when handler has none', () => {
      const requiredRoles = ['lecturer'];
      const mockSession: SessionData = {
        user: {
          id: 'user-class-meta',
          email: 'lecturer@example.com',
          role: 'user',
          name: 'Lecturer',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-class-meta',
          token: 'token',
          userId: 'user-class-meta',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        uniId: 'uni-1',
        uniRole: 'lecturer',
      };

      const getMetadataSpy = jest.spyOn(Reflect, 'getMetadata');
      getMetadataSpy.mockImplementation((key, target) => {
        if (key !== ROLES_KEY) return undefined;
        if (target === mockExecutionContext.getHandler()) {
          return undefined;
        }
        if (target === mockExecutionContext.getClass()) {
          return requiredRoles;
        }
        return undefined;
      });
      mockRequest.session = mockSession;

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow access when user has required uniRole', () => {
      const requiredRoles = ['student'];
      const mockSession: SessionData = {
        user: {
          id: 'user-1',
          email: 'student@example.com',
          role: 'user',
          name: 'John Student',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-1',
          token: 'token',
          userId: 'user-1',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        uniId: 'uni-1',
        uniRole: 'student',
      };

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === ROLES_KEY) return requiredRoles;
        return undefined;
      });
      mockRequest.session = mockSession;

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should deny access when user lacks required university role', () => {
      const requiredRoles = ['uni_admin'];
      const mockSession: SessionData = {
        user: {
          id: 'user-1',
          email: 'student@example.com',
          role: 'user',
          name: 'John Student',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-1',
          token: 'token',
          userId: 'user-1',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        uniId: 'uni-1',
        uniRole: 'student',
      };

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === ROLES_KEY) return requiredRoles;
        return undefined;
      });
      mockRequest.session = mockSession;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when session is missing from request', () => {
      const requiredRoles = ['student'];

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === ROLES_KEY) return requiredRoles;
        return undefined;
      });
      // No session attached to request (AuthGuard was bypassed or route is misconfigured)

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should allow sys_admin to bypass any role restriction', () => {
      const requiredRoles = ['lecturer'];
      const mockSession: SessionData = {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'sys_admin',
          name: 'Admin',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-admin',
          token: 'token',
          userId: 'admin-1',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === ROLES_KEY) return requiredRoles;
        return undefined;
      });
      mockRequest.session = mockSession;

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should deny access when no university role exists for selected university', () => {
      const requiredRoles = ['student'];
      const mockSession: SessionData = {
        user: {
          id: 'user-no-role',
          email: 'norole@example.com',
          role: 'user',
          name: 'No Role',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-norole',
          token: 'token',
          userId: 'user-no-role',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        uniId: 'uni-1',
      };

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === ROLES_KEY) return requiredRoles;
        return undefined;
      });
      mockRequest.session = mockSession;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when university role is pending', () => {
      const requiredRoles = ['uni_admin'];
      const mockSession: SessionData = {
        user: {
          id: 'pending-user',
          email: 'pending@example.com',
          role: 'user',
          name: 'Pending User',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-pending',
          token: 'token',
          userId: 'pending-user',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        uniId: 'uni-1',
        uniRole: 'uni_admin_pending',
      };

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === ROLES_KEY) return requiredRoles;
        return undefined;
      });
      mockRequest.session = mockSession;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Role pending approval',
      );
    });

    it('defaults empty @Roles() metadata to student', () => {
      const mockSession: SessionData = {
        user: {
          id: 'student-empty-roles',
          email: 'student@example.com',
          role: 'user',
          name: 'Student',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-empty-roles',
          token: 'token',
          userId: 'student-empty-roles',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        uniId: 'uni-1',
        uniRole: 'student',
      };

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === ROLES_KEY) return [];
        return undefined;
      });
      mockRequest.session = mockSession;

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('requires sys_admin for @SystemAdmin metadata', () => {
      const mockSession: SessionData = {
        user: {
          id: 'normal-user',
          email: 'user@example.com',
          role: 'user',
          name: 'Normal User',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-normal-user',
          token: 'token',
          userId: 'normal-user',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === SYSTEM_ADMIN_KEY) return true;
        return undefined;
      });
      mockRequest.session = mockSession;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should allow multiple valid roles', () => {
      const requiredRoles = ['student', 'uni_admin'];
      const mockSession: SessionData = {
        user: {
          id: 'user-3',
          email: 'admin@uni.example.com',
          role: 'user',
          name: 'Admin',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-3',
          token: 'token',
          userId: 'user-3',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        uniId: 'uni-3',
        uniRole: 'uni_admin',
      };

      jest.spyOn(Reflect, 'getMetadata').mockImplementation((key) => {
        if (key === ROLES_KEY) return requiredRoles;
        return undefined;
      });
      mockRequest.session = mockSession;

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });
});

describe('Roles decorator', () => {
  it('creates a metadata decorator', () => {
    const decorator: unknown = Roles('student', 'lecturer');
    expect(typeof decorator).toBe('function');
    expect(ROLES_KEY).toBe('roles');
  });

  it('creates system admin metadata decorator', () => {
    const decorator: unknown = SystemAdmin();
    expect(typeof decorator).toBe('function');
    expect(SYSTEM_ADMIN_KEY).toBe('systemAdmin');
  });
});

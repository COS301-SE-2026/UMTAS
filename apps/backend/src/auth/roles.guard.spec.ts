import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ROLES_KEY, Roles, RolesGuard } from './roles.guard';
import type { RequestWithSession } from './auth.guard';
import type { SessionData } from './session.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard();
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
          role: 'lecturer',
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
      };

      const getMetadataSpy = jest.spyOn(Reflect, 'getMetadata');
      getMetadataSpy.mockImplementation((key, target) => {
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

    it('should allow access when user has required role', () => {
      const requiredRoles = ['student'];
      const mockSession: SessionData = {
        user: {
          id: 'user-1',
          email: 'student@example.com',
          role: 'student',
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
      };

      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(requiredRoles);
      mockRequest.session = mockSession;

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should deny access when user lacks required role', () => {
      const requiredRoles = ['sys_admin'];
      const mockSession: SessionData = {
        user: {
          id: 'user-1',
          email: 'student@example.com',
          role: 'student',
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
      };

      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(requiredRoles);
      mockRequest.session = mockSession;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when session is missing from request', () => {
      const requiredRoles = ['student'];

      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(requiredRoles);
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

      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(requiredRoles);
      mockRequest.session = mockSession;

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when session user has no role', () => {
      const requiredRoles = ['student'];
      const mockSession: SessionData = {
        user: {
          id: 'user-no-role',
          email: 'norole@example.com',
          role: '',
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
      };

      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(requiredRoles);
      mockRequest.session = mockSession;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should allow multiple valid roles', () => {
      const requiredRoles = ['student', 'uni_admin', 'sys_admin'];
      const mockSession: SessionData = {
        user: {
          id: 'user-3',
          email: 'admin@uni.example.com',
          role: 'uni_admin',
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
      };

      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(requiredRoles);
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
});

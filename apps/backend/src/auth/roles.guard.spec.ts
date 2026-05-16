import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { RolesGuard, ROLES_KEY } from './roles.guard';
import { AuthService } from './auth.service';
import type { AuthSession } from './auth';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockAuthService = {
    getAuth: jest.fn().mockReturnValue({
      api: {
        getSession: jest.fn(),
      },
    }),
  };

  beforeEach(() => {
    guard = new RolesGuard(mockAuthService as unknown as AuthService);
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {
          cookie: 'test-cookie',
        },
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('should allow access when no roles are required', async () => {
      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow access when user has required role', async () => {
      const requiredRoles = ['student'];
      const mockSession: AuthSession = {
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

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should deny access when user lacks required role', async () => {
      const requiredRoles = ['sys_admin'];
      const mockSession: AuthSession = {
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

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when session is missing', async () => {
      const requiredRoles = ['student'];

      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(requiredRoles);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should fetch session from auth API if not cached', async () => {
      const requiredRoles = ['uni_admin'];
      const mockSession: AuthSession = {
        user: {
          id: 'user-2',
          email: 'admin@example.com',
          role: 'uni_admin',
          name: 'Jane Admin',
          emailVerified: true,
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'session-2',
          token: 'token',
          userId: 'user-2',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      jest.spyOn(Reflect, 'getMetadata').mockReturnValue(requiredRoles);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockResolvedValue(mockSession),
        },
      });

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
      expect(mockRequest.session).toEqual(mockSession);
    });

    it('should allow multiple valid roles', async () => {
      const requiredRoles = ['student', 'uni_admin', 'sys_admin'];
      const mockSession: AuthSession = {
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

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });
});

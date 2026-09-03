import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { RequestWithSession } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;

  const mockAuthService = {
    getAuth: jest.fn().mockReturnValue({
      api: {
        getSession: jest.fn(),
      },
    }),
    userExistsById: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        Reflector,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: RequestWithSession;

    beforeEach(() => {
      mockRequest = {
        headers: {
          cookie: 'test-cookie',
          authorization: 'Bearer test-token',
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

    it('should allow access to public routes without session', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no session exists', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should attach session to request when valid', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          role: 'user',
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

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const getSession = jest.fn().mockResolvedValue(mockSession);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession,
        },
      });

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
      expect(getSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
      expect(mockRequest.session).toBeDefined();
      expect(mockRequest.session!.user.id).toBe('user-1');
    });

    it('rejects a cached session whose user was deleted', async () => {
      const mockSession = {
        user: { id: 'deleted-user' },
        session: { id: 'stale-session' },
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockResolvedValue(mockSession),
        },
      });
      mockAuthService.userExistsById.mockResolvedValueOnce(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Session user no longer exists'),
      );
      expect(mockRequest.session).toBeUndefined();
    });

    it('should handle requests with no headers', async () => {
      mockRequest.headers = {};
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow();
    });

    it('should handle array header values correctly', async () => {
      mockRequest.headers = {
        'accept-encoding': 'gzip, deflate',
      };

      const mockSession = { user: { id: 'user-1' } };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockResolvedValue(mockSession),
        },
      });

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when getSession rejects', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockRejectedValue(new Error('network error')),
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when getSession rejects with non-Error', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockRejectedValue('string error'),
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

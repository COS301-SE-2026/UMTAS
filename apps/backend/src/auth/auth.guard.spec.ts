import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard, IS_PUBLIC_KEY } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let authService: AuthService;

  const mockAuthService = {
    getAuth: jest.fn().mockReturnValue({
      api: {
        getSession: jest.fn(),
      },
    }),
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
    authService = module.get<AuthService>(AuthService);
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {
          cookie: 'test-cookie',
          authorization: 'Bearer test-token',
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
        user: { id: 'user-1', email: 'test@example.com' },
        session: { id: 'session-1', token: 'token' },
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(mockAuthService, 'getAuth').mockReturnValueOnce({
        api: {
          getSession: jest.fn().mockResolvedValue(mockSession),
        },
      });

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
      expect(mockRequest.session).toEqual(mockSession);
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
        'accept-encoding': ['gzip', 'deflate'],
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
  });
});

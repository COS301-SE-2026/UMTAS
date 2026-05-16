import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FreshSessionGuard } from './fresh-session.guard';

describe('FreshSessionGuard', () => {
  let guard: FreshSessionGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FreshSessionGuard],
    }).compile();

    guard = module.get<FreshSessionGuard>(FreshSessionGuard);
  });

  it('is defined', () => {
    expect(guard).toBeDefined();
  });

  it('throws UnauthorizedException if no session', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ session: null }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('No active session');
  });

  it('throws UnauthorizedException if session is older than 10 minutes', () => {
    const tenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000);
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          session: {
            session: {
              createdAt: tenMinutesAgo.toISOString(),
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    try {
      guard.canActivate(mockContext);
    } catch (e: unknown) {
      if (e instanceof UnauthorizedException) {
        const response = e.getResponse() as Record<string, unknown>;
        expect(response.error).toBe('SESSION_STALE');
      } else {
        throw e;
      }
    }
  });

  it('returns true if session is fresh (under 10 minutes)', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          session: {
            session: {
              createdAt: fiveMinutesAgo.toISOString(),
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});

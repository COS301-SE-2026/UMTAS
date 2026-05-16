import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FreshSessionGuard } from './fresh-session.guard';

describe('FreshSessionGuard', () => {
  let guard: FreshSessionGuard;

  beforeEach(() => {
    guard = new FreshSessionGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow a fresh session (< 1 hour old)', async () => {
    const now = Date.now();
    const createdAt = new Date(now - 30 * 60 * 1000).toISOString(); // 30 mins ago

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          session: {
            session: {
              createdAt,
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException for a stale session (> 1 hour old)', async () => {
    const now = Date.now();
    const createdAt = new Date(now - 60 * 60 * 1000 - 1000).toISOString(); // 1 hour and 1 second ago

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          session: {
            session: {
              createdAt,
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;

    try {
      await guard.canActivate(context);
      fail('Should have thrown UnauthorizedException');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toEqual({
        error: 'SESSION_STALE',
        message: 'Re-authenticate to continue',
      });
    }
  });

  it('should throw UnauthorizedException if no session exists', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          session: null,
        }),
      }),
    } as unknown as ExecutionContext;

    try {
      await guard.canActivate(context);
      fail('Should have thrown UnauthorizedException');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('No active session');
    }
  });
});

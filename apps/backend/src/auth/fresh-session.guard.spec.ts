import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FreshSessionGuard } from './fresh-session.guard';
import type { RequestWithSession } from './auth.guard';

describe('FreshSessionGuard', () => {
  let guard: FreshSessionGuard;

  beforeEach(() => {
    guard = new FreshSessionGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow a fresh session (< 10 minutes old)', () => {
    const now = Date.now();
    const createdAt = new Date(now - 5 * 60 * 1000).toISOString(); // 5 mins ago

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

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException for a stale session (> 10 minutes old)', () => {
    const now = Date.now();
    const createdAt = new Date(now - 10 * 60 * 1000 - 1000).toISOString(); // 10 minutes and 1 second ago

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

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if no session exists', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () =>
          ({
            session: undefined,
          }) as RequestWithSession,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});

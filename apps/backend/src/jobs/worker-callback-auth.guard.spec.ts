import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import {
  WorkerCallbackAuthGuard,
  extractBearerToken,
  isValidWorkerCallbackAuth,
} from './worker-callback-auth.guard';

describe('worker callback auth helpers', () => {
  it('extracts bearer tokens', () => {
    expect(extractBearerToken('Bearer secret')).toBe('secret');
    expect(extractBearerToken('Basic secret')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('validates the configured callback token', () => {
    expect(isValidWorkerCallbackAuth('Bearer secret', 'secret')).toBe(true);
    expect(isValidWorkerCallbackAuth('Bearer wrong', 'secret')).toBe(false);
    expect(isValidWorkerCallbackAuth('Bearer secret', undefined)).toBe(false);
  });
});

describe('WorkerCallbackAuthGuard', () => {
  it('allows requests with the configured bearer token', () => {
    const guard = new WorkerCallbackAuthGuard();

    expect(guard.canActivate(contextWithAuthorization('Bearer secret'))).toBe(
      true,
    );
  });

  it('rejects requests with a missing or invalid token', () => {
    const guard = new WorkerCallbackAuthGuard();

    expect(() =>
      guard.canActivate(contextWithAuthorization('Bearer wrong')),
    ).toThrow(UnauthorizedException);
  });
});

function contextWithAuthorization(authorization?: string): ExecutionContext {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: { authorization },
      }),
    }),
  } as unknown as ExecutionContext;
}

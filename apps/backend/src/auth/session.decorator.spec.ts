import { ExecutionContext } from '@nestjs/common';
import { currentSessionFactory } from './session.decorator';

describe('CurrentSession Decorator', () => {
  it('should extract session from request', () => {
    const mockSession = {
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: true,
        image: 'https://example.com/avatar.jpg',
        role: 'student',
        banned: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      session: {
        id: 'session-1',
        token: 'token-123',
        userId: 'user-1',
        expiresAt: '2024-02-01T00:00:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          session: mockSession,
        }),
      }),
    } as unknown as ExecutionContext;

    const result = currentSessionFactory(undefined, mockExecutionContext);
    expect(result).toEqual(mockSession);
    expect(result.user.id).toBe('user-1');
    expect(result.session.token).toBe('token-123');
  });

  it('should handle missing session gracefully', () => {
    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    const result = currentSessionFactory(undefined, mockExecutionContext);
    expect(result).toBeUndefined();
  });

  it('should provide session with all required fields', () => {
    const mockSession = {
      user: {
        id: 'user-2',
        name: 'Jane Admin',
        email: 'jane@example.com',
        emailVerified: true,
        image: null,
        role: 'uni_admin',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      session: {
        id: 'session-2',
        token: 'token-456',
        userId: 'user-2',
        expiresAt: '2024-02-01T00:00:00Z',
        ipAddress: '192.168.1.2',
        userAgent: 'Chrome/120.0',
        impersonatedBy: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          session: mockSession,
        }),
      }),
    } as unknown as ExecutionContext;

    const result = currentSessionFactory(undefined, mockExecutionContext);
    expect(result.user.role).toBe('uni_admin');
    expect(result.session.impersonatedBy).toBeNull();
  });
});

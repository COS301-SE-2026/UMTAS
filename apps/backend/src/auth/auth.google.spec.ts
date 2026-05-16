import { mapGoogleProfileToUser, createAuth } from './auth';
import { betterAuth } from 'better-auth';

describe('Google OAuth helpers', () => {
  describe('mapGoogleProfileToUser', () => {
    it('maps google profile fields into Better Auth user data', () => {
      expect(
        mapGoogleProfileToUser({
          name: 'Jane Lecturer',
          email: 'jane@example.com',
          picture: 'https://example.com/avatar.png',
        }),
      ).toEqual({
        name: 'Jane Lecturer',
        email: 'jane@example.com',
        image: 'https://example.com/avatar.png',
      });
    });

    it('falls back to email prefix when name missing', () => {
      expect(mapGoogleProfileToUser({ email: 'jane@example.com' })).toEqual({
        name: 'jane',
        email: 'jane@example.com',
      });
    });

    it('falls back to empty string when both name and email missing', () => {
      expect(mapGoogleProfileToUser({})).toEqual({ name: '', email: '' });
    });
  });

  describe('createAuth config gating', () => {
    const mockInput: any = {
      db: {},
      dbProvider: 'pg',
      baseURL: 'http://localhost:3000',
      secret: 'secret',
      trustedOrigins: [],
      isProduction: false,
      logger: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
      sendResetPasswordEmail: jest.fn(),
    };

    it('disables google provider when client ID/secret missing', () => {
      createAuth({ ...mockInput });
      expect(betterAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          socialProviders: undefined,
        }),
      );
    });

    it('enables google provider when client ID/secret provided', () => {
      createAuth({
        ...mockInput,
        googleClientId: 'client-id',
        googleClientSecret: 'client-secret',
      });
      expect(betterAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          socialProviders: expect.objectContaining({
            google: expect.objectContaining({
              clientId: 'client-id',
              clientSecret: 'client-secret',
            }),
          }),
        }),
      );
    });
  });
});

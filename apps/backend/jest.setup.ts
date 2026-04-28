jest.mock('./src/auth/auth.ts', () => ({
  auth: {},
  getSession: jest.fn(),
}));

jest.mock('./src/auth/auth.service.ts', () => ({
  AuthService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { toNodeHandler } from 'better-auth/node';
import type { IncomingMessage, ServerResponse } from 'node:http';

describe('AuthController', () => {
  let controller: AuthController;

  const handler = jest.fn().mockResolvedValue(undefined);
  const authService = {
    getAuth: jest.fn(() => ({
      handler,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('forwards requests through better-auth node handler', async () => {
    const req = {
      method: 'POST',
      url: '/api/auth/sign-in/email',
      headers: {},
    } as unknown as IncomingMessage;
    const res = {
      headersSent: false,
      end: jest.fn(),
    } as unknown as ServerResponse;

    await controller.handler(req, res);

    expect(authService.getAuth).toHaveBeenCalled();
    expect(toNodeHandler).toHaveBeenCalledWith(handler);
    expect(handler).toHaveBeenCalledWith(req, res);
  });

  it('returns 404 for google oauth routes when env missing', async () => {
    const req = {
      method: 'GET',
      url: '/api/auth/callback/google',
      headers: {},
    } as unknown as IncomingMessage;
    const res = {} as ServerResponse;

    await expect(controller.googleOAuthCallback(req, res)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns 404 for google account linking when env missing', async () => {
    const req = {
      method: 'POST',
      url: '/api/auth/link-account/google',
      headers: {},
    } as unknown as IncomingMessage;
    const res = {} as ServerResponse;

    await expect(
      controller.linkGoogleAccount(req, res, { code: 'code', state: 'state' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('AuthController — forgetPassword', () => {
  it('returns 200 {} without calling BetterAuth when user not found', async () => {
    const nodeHandler = jest.fn().mockResolvedValue(undefined);
    const mockAuthService = {
      getAuth: jest.fn(() => ({ handler: nodeHandler })),
      userExistsByEmail: jest.fn().mockResolvedValue(false),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    const ctrl = module.get<AuthController>(AuthController);

    const res = {
      statusCode: 0,
      end: jest.fn(),
      setHeader: jest.fn(),
      headersSent: false,
    } as unknown as ServerResponse;

    const req = {
      method: 'POST',
      url: '/api/auth/forget-password',
      headers: { 'content-type': 'application/json' },
      body: { email: 'nobody@example.com' },
      [Symbol.asyncIterator]: async function* () {},
    } as unknown as IncomingMessage;

    await ctrl.forgetPassword(req, res);

    expect(mockAuthService.userExistsByEmail).toHaveBeenCalledWith(
      'nobody@example.com',
    );
    expect(nodeHandler).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({}));
  });

  it('rewrites URL to request-password-reset and delegates to BetterAuth when user found', async () => {
    let capturedUrl: string | undefined;
    const nodeHandler = jest.fn().mockImplementation((req: IncomingMessage) => {
      capturedUrl = req.url;
    });
    const mockAuthService = {
      getAuth: jest.fn(() => ({ handler: nodeHandler })),
      userExistsByEmail: jest.fn().mockResolvedValue(true),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    const ctrl = module.get<AuthController>(AuthController);

    const res = {
      statusCode: 200,
      end: jest.fn(),
      setHeader: jest.fn(),
      headersSent: false,
    } as unknown as ServerResponse;

    const req = {
      method: 'POST',
      url: '/api/auth/forget-password',
      headers: {},
      body: { email: 'found@example.com' },
      [Symbol.asyncIterator]: async function* () {},
    } as unknown as IncomingMessage;

    await ctrl.forgetPassword(req, res);

    expect(mockAuthService.userExistsByEmail).toHaveBeenCalledWith(
      'found@example.com',
    );
    expect(capturedUrl).toContain('request-password-reset');
  });
});

describe('AuthController — handleRequest error path', () => {
  it('returns 500 JSON when handler throws', async () => {
    const throwingHandler = jest
      .fn()
      .mockRejectedValue(new Error('handler crash'));
    const mockAuthService = {
      getAuth: jest.fn(() => ({ handler: throwingHandler })),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    const ctrl = module.get<AuthController>(AuthController);

    const res = {
      statusCode: 0,
      headersSent: false,
      setHeader: jest.fn(),
      end: jest.fn(),
    } as unknown as ServerResponse;

    const req = {
      method: 'POST',
      url: '/api/auth/sign-in/email',
      headers: {},
    } as unknown as IncomingMessage;

    await ctrl.signInEmail(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.end).toHaveBeenCalledWith(
      JSON.stringify({ error: 'Internal server error' }),
    );
  });

  it('does not call res.end if headers already sent when handler throws', async () => {
    const throwingHandler = jest.fn().mockRejectedValue(new Error('crash'));
    const mockAuthService = {
      getAuth: jest.fn(() => ({ handler: throwingHandler })),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    const ctrl = module.get<AuthController>(AuthController);

    const res = {
      statusCode: 0,
      headersSent: true,
      setHeader: jest.fn(),
      end: jest.fn(),
    } as unknown as ServerResponse;

    const req = {
      method: 'GET',
      url: '/api/auth/session',
      headers: {},
    } as unknown as IncomingMessage;

    await ctrl.getSession(req, res);

    expect(res.end).not.toHaveBeenCalled();
  });
});

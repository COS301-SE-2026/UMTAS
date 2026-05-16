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

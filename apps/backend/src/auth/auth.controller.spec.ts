import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IncomingMessage, ServerResponse } from 'node:http';

describe('AuthController (Integration)', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    getAuth: jest.fn().mockReturnValue({
      handler: jest
        .fn()
        .mockResolvedValue(new Response('{"status":"ok"}', { status: 200 })),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('handler', () => {
    it('should forward requests to BetterAuth handler', async () => {
      const mockReq = {
        method: 'POST',
        url: '/api/auth/sign-up',
        headers: { 'content-type': 'application/json' },
      } as unknown as IncomingMessage;

      const mockRes = {
        statusCode: 200,
        headersSent: false,
        end: jest.fn(),
      } as unknown as ServerResponse;

      await controller.handler(mockReq, mockRes);

      expect(mockAuthService.getAuth).toHaveBeenCalled();
    });

    it('should handle auth errors gracefully', async () => {
      const mockReq = {
        method: 'POST',
        url: '/api/auth/sign-up',
        headers: {},
      } as unknown as IncomingMessage;

      const mockRes = {
        statusCode: 200,
        headersSent: false,
        end: jest.fn(),
        writeHead: jest.fn(),
      } as unknown as ServerResponse;

      jest.spyOn(mockAuthService, 'getAuth').mockImplementationOnce(() => {
        throw new Error('Auth initialization failed');
      });

      await controller.handler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
    });

    it('should not send response headers if already sent', async () => {
      const mockReq = {
        method: 'GET',
        url: '/api/auth/session',
        headers: {},
      } as unknown as IncomingMessage;

      const mockRes = {
        statusCode: 200,
        headersSent: true,
        end: jest.fn(),
      } as unknown as ServerResponse;

      jest.spyOn(mockAuthService, 'getAuth').mockImplementationOnce(() => {
        throw new Error('Auth error');
      });

      await controller.handler(mockReq, mockRes);

      expect(mockRes.end).not.toHaveBeenCalled();
    });
  });
});

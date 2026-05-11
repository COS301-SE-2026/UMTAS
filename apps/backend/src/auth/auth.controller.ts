import { All, Controller, Logger, Req, Res } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AuthService } from './auth.service.js';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @All('*path')
  async handler(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    try {
      const auth = this.authService.getAuth();
      const handler = auth.handler;
      const { toNodeHandler } = await import('better-auth/node');
      const nodeHandler = toNodeHandler(handler);
      await nodeHandler(req, res);
    } catch (error) {
      this.logger.error('Auth handler error', error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal auth error' }));
      }
    }
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IncomingMessage } from 'node:http';
import { AuthService } from './auth.service';

// Decorator to mark routes as public (no auth required)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<IncomingMessage>();
    const auth = this.authService.getAuth();

    // Extract session from request via better-auth API
    const headers = new Headers();
    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }
    }

    let session;
    try {
      session = await auth.api.getSession({ headers });
    } catch {
      throw new UnauthorizedException('No active session');
    }

    if (!session) {
      throw new UnauthorizedException('No active session');
    }

    // Attach session to request so controllers can access it
    (req as any).session = session;
    return true;
  }
}

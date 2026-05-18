import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithSession } from './auth.guard';

@Injectable()
export class FreshSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithSession>();
    const session = req.session?.session;

    if (!session) {
      throw new UnauthorizedException('No active session');
    }

    const createdAt = new Date(session.createdAt).getTime();
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    if (now - createdAt > TEN_MINUTES) {
      throw new UnauthorizedException({
        error: 'SESSION_STALE',
        message: 'Re-authenticate to continue',
      });
    }

    return true;
  }
}

/**
 * Decorator that applies FreshSessionGuard to a route.
 * Ensures the session is less than 10 minutes old.
 */
export const RequiresFreshSession = () => UseGuards(FreshSessionGuard);

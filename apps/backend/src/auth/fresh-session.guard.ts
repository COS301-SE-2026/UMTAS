import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

@Injectable()
export class FreshSessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const session = req.session?.session;

    if (!session) {
      throw new UnauthorizedException('No active session');
    }

    const createdAt = new Date(session.createdAt).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (now - createdAt > oneHour) {
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
 * Ensures the session is less than 1 hour old.
 */
export const RequiresFreshSession = () => UseGuards(FreshSessionGuard);

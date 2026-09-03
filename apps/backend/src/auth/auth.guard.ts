import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IncomingMessage } from 'node:http';
import { AuthService } from './auth.service';
import type { SessionData } from './session.decorator';
import type { AuthSession } from './auth';
import { normalizeSession } from './auth';

// Decorator to mark routes as public (no auth required)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface RequestWithSession extends IncomingMessage {
  session?: SessionData;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

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

    const req = context.switchToHttp().getRequest<RequestWithSession>();
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

    let session: SessionData | null;
    try {
      // The cookie cache is kept on purpose (see auth.ts); the userExistsById
      // check below is what authoritatively rejects an identity whose user row
      // is gone, so a cached session can never reach application FKs.
      const result = await auth.api.getSession({ headers });
      const rawSession = result as AuthSession | null;
      session = rawSession ? normalizeSession(rawSession) : null;
    } catch (error) {
      this.logger.error(
        'Session fetch failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new UnauthorizedException('No active session');
    }

    if (!session) {
      throw new UnauthorizedException('No active session');
    }

    // Secondary session storage can also survive a database reset. Never pass
    // a cached identity into application tables unless its user row still
    // exists in the authoritative database.
    if (!(await this.authService.userExistsById(session.user.id))) {
      throw new UnauthorizedException('Session user no longer exists');
    }

    const cookieValue = headers.get('cookie') ?? '';
    const cookieUniId = cookieValue
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('umtas-uni-id='))
      ?.split('=')[1];

    const uniId = cookieUniId || null;

    if (uniId) {
      try {
        if (!session.uniRole || session.uniId !== uniId) {
          const uniRole = await this.authService.getUniversityRole(
            session.user.id,
            uniId,
          );
          // attach to session for downstream guards
          session.uniId = uniId;
          session.uniRole = uniRole;
        }
      } catch (error) {
        this.logger.warn(
          `Failed enrichment of session with uniRole for uni[${uniId}] user[${session.user.id}] | Error: ${error}`,
        );
      }
    } //END_hUniId

    // Attach session to request so controllers can access it
    req.session = session;
    return true;
  }
}

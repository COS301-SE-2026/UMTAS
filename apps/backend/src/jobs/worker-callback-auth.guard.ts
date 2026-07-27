import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';

const BEARER_AUTH_SCHEME = 'Bearer';

export function extractBearerToken(
  authorization: IncomingHttpHeaders['authorization'],
): string | null {
  if (typeof authorization !== 'string') {
    return null;
  }

  const authParts = authorization.split(' ');
  const scheme = authParts[0];
  const token = authParts[1];

  if (scheme !== BEARER_AUTH_SCHEME || !token) {
    return null;
  }

  return token;
}

export function isValidWorkerCallbackAuth(
  authorization: IncomingHttpHeaders['authorization'],
  expectedToken: string | undefined,
): boolean {
  const token = extractBearerToken(authorization);
  return Boolean(expectedToken && token && token === expectedToken);
}

@Injectable()
export class WorkerCallbackAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: IncomingHttpHeaders;
    }>();

    const expectedToken = process.env.WORKER_CALLBACK_TOKEN;
    if (
      !isValidWorkerCallbackAuth(request.headers.authorization, expectedToken)
    ) {
      throw new UnauthorizedException('Invalid worker callback token');
    }

    return true;
  }
}

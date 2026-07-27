import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import {
  IS_PUBLIC_KEY,
  type RequestWithSession,
} from '../../../../src/auth/auth.guard';
import type { UniRole } from '../../../../src/auth/roles';
import type { SessionData } from '../../../../src/auth/session.decorator';
import type { TestActor } from '../http-test-client';

type RegisteredMockSession = {
  readonly session: SessionData;
  readonly universityRoles: Readonly<Record<string, UniRole>>;
};

@Injectable()
export class MockSessionRegistry {
  private readonly sessions = new Map<string, RegisteredMockSession>();

  register(
    session: SessionData,
    universityRoles: Readonly<Record<string, UniRole>> = {},
  ): string {
    const token = `test-session-${randomUUID()}`;
    this.sessions.set(token, {
      session: structuredClone(session),
      universityRoles: { ...universityRoles },
    });
    return token;
  }

  resolve(
    token: string,
    selectedUniversityId?: string,
  ): SessionData | undefined {
    const registered = this.sessions.get(token);
    if (!registered) return undefined;
    const session = structuredClone(registered.session);
    if (selectedUniversityId) {
      session.uniId = selectedUniversityId;
      session.uniRole = registered.universityRoles[selectedUniversityId];
    }
    return session;
  }

  revoke(token: string): void {
    this.sessions.delete(token);
  }

  clear(): void {
    this.sessions.clear();
  }
}

@Injectable()
export class MockSessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly registry: MockSessionRegistry,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const rawToken = request.headers['x-umtas-test-session'];
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
    if (!token) throw new UnauthorizedException('No test session');

    const selectedUniversityId =
      firstHeader(request.headers['x-umtas-uni-id']) ??
      firstHeader(request.headers['x-umtas-uni']) ??
      selectedUniversityCookie(firstHeader(request.headers.cookie));
    const session = this.registry.resolve(token, selectedUniversityId);
    if (!session) throw new UnauthorizedException('Invalid test session');
    request.session = session;
    return true;
  }
}

export function authenticateMockActor(
  actor: TestActor,
  registry: MockSessionRegistry,
  session: SessionData,
  universityRoles: Readonly<Record<string, UniRole>> = {},
): TestActor {
  const token = registry.register(session, universityRoles);
  return actor.setSession({ strategy: 'mock-auth', token });
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function selectedUniversityCookie(cookieHeader?: string): string | undefined {
  return cookieHeader
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith('umtas-uni-id='))
    ?.slice('umtas-uni-id='.length);
}

export * from './real-auth';

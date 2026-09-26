import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { RequestWithSession } from './auth.guard';
import type { UniRole, AppRole } from './roles';

export interface SessionData {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    role: AppRole;
    banned: boolean;
    banReason?: string;
    banExpires?: string;
    createdAt: string;
    updatedAt: string;
  };
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: string;
    ipAddress?: string;
    userAgent?: string;
    impersonatedBy?: string;
    createdAt: string;
    updatedAt: string;
  };
  uniId?: string;
  uniRole?: UniRole;
}

export const currentSessionFactory = (
  _data: unknown,
  ctx: ExecutionContext,
): SessionData | undefined => {
  const req = ctx.switchToHttp().getRequest<RequestWithSession>();
  return req.session;
};

export const CurrentUniId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const uniId = request.session?.uniId;
    if (!uniId) throw new ForbiddenException('No university selected');
    return uniId;
  },
);

export const CurrentSession = createParamDecorator(currentSessionFactory);

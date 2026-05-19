import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithSession } from './auth.guard';

type UUID = string & { readonly __brand: 'UUID' };
export interface SessionData {
  user: {
    id: UUID;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    role: string;
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
}

export const currentSessionFactory = (
  _data: unknown,
  ctx: ExecutionContext,
): SessionData | undefined => {
  const req = ctx.switchToHttp().getRequest<RequestWithSession>();
  return req.session;
};

export const CurrentSession = createParamDecorator(currentSessionFactory);

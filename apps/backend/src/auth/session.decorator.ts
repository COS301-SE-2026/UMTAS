import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';

export interface SessionData {
  user: {
    id: string;
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
): SessionData => {
  const req = ctx.switchToHttp().getRequest<IncomingMessage>();
  return (req as any).session;
};

export const CurrentSession = createParamDecorator(currentSessionFactory);

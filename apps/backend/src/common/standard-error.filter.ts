import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

type ErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
};

@Catch()
export class StandardErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = request.header('x-request-id') ?? `req_${randomUUID()}`;
    const status = getStatus(exception);
    const source = getErrorSource(exception);
    const body: ErrorBody = {
      code: typeof source.code === 'string' ? source.code : defaultCode(status),
      message: getMessage(exception, source),
      ...getDetails(source),
      requestId,
    };

    response.setHeader('x-request-id', requestId);
    response.status(status).json(body);
  }
}

function getStatus(exception: unknown): number {
  return exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
}

function getErrorSource(exception: unknown): Record<string, unknown> {
  if (!(exception instanceof HttpException)) {
    return {};
  }

  const response = exception.getResponse();
  return typeof response === 'object' && response !== null
    ? (response as Record<string, unknown>)
    : {};
}

function getMessage(
  exception: unknown,
  source: Record<string, unknown>,
): string {
  if (typeof source.message === 'string') {
    return source.message;
  }

  if (Array.isArray(source.message)) {
    return 'Request validation failed.';
  }

  return exception instanceof Error
    ? exception.message
    : 'Unexpected server error.';
}

function getDetails(
  source: Record<string, unknown>,
): Pick<ErrorBody, 'details'> {
  if (Array.isArray(source.message)) {
    return { details: { issues: source.message } };
  }

  if (source.details && typeof source.details === 'object') {
    return { details: source.details as Record<string, unknown> };
  }

  return {};
}

function defaultCode(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION_INVALID_REQUEST';
    case 401:
      return 'AUTH_UNAUTHENTICATED';
    case 403:
      return 'AUTH_FORBIDDEN';
    case 404:
      return 'INTERNAL_NOT_FOUND';
    case 409:
      return 'INTERNAL_CONFLICT';
    case 429:
      return 'INTERNAL_RATE_LIMITED';
    default:
      return 'INTERNAL_UNEXPECTED_ERROR';
  }
}

import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import type { App } from 'supertest/types';

export type MultipartFile = {
  readonly field: string;
  readonly buffer: Buffer;
  readonly filename: string;
  readonly contentType?: string;
};

export type HttpRequest = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly json?: unknown;
  readonly fields?: Readonly<Record<string, string>>;
  readonly files?: readonly MultipartFile[];
  readonly timeoutMs?: number;
};

export type HttpResponse<T = unknown> = {
  readonly status: number;
  readonly headers: Readonly<Record<string, string | readonly string[]>>;
  readonly text: string;
  readonly body: T;
};

export type HttpExchangeDiagnostic = {
  readonly method: string;
  readonly path: string;
  readonly status?: number;
  readonly requestHeaders: Readonly<Record<string, string>>;
  readonly requestBody?: unknown;
  readonly responseBody?: unknown;
};

export type HttpTransport = (request: HttpRequest) => Promise<HttpResponse>;

const REDACTED = '[REDACTED]';
const SENSITIVE_HEADER = /^(authorization|cookie|set-cookie)$/i;
const SENSITIVE_FIELD = /password|token|secret|cookie|authorization/i;

export class HttpTestClient {
  private readonly cookies = new Map<string, string>();
  private readonly defaultHeaders = new Map<string, string>();
  private lastExchangeValue?: HttpExchangeDiagnostic;

  constructor(private readonly transport: HttpTransport) {}

  fork(): HttpTestClient {
    return new HttpTestClient(this.transport);
  }

  setHeader(name: string, value: string): this {
    this.defaultHeaders.set(name.toLowerCase(), value);
    return this;
  }

  removeHeader(name: string): this {
    this.defaultHeaders.delete(name.toLowerCase());
    return this;
  }

  get<T = unknown>(
    path: string,
    options: Omit<HttpRequest, 'method' | 'path'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'GET', path });
  }

  post<T = unknown>(
    path: string,
    options: Omit<HttpRequest, 'method' | 'path'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'POST', path });
  }

  put<T = unknown>(
    path: string,
    options: Omit<HttpRequest, 'method' | 'path'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'PUT', path });
  }

  patch<T = unknown>(
    path: string,
    options: Omit<HttpRequest, 'method' | 'path'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'PATCH', path });
  }

  delete<T = unknown>(
    path: string,
    options: Omit<HttpRequest, 'method' | 'path'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'DELETE', path });
  }

  async request<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>> {
    const headers = Object.fromEntries(this.defaultHeaders);
    Object.assign(headers, normalizeHeaders(request.headers ?? {}));
    if (this.cookies.size > 0) {
      headers.cookie = [...this.cookies]
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    }

    try {
      const response = await this.transport({ ...request, headers });
      this.captureCookies(response.headers);
      this.lastExchangeValue = {
        method: request.method,
        path: request.path,
        status: response.status,
        requestHeaders: redactHeaders(headers),
        requestBody: redactValue(request.json ?? request.fields),
        responseBody: redactValue(response.body),
      };
      return response as HttpResponse<T>;
    } catch (error) {
      this.lastExchangeValue = {
        method: request.method,
        path: request.path,
        requestHeaders: redactHeaders(headers),
        requestBody: redactValue(request.json ?? request.fields),
        responseBody:
          error instanceof Error ? { transportError: error.message } : error,
      };
      throw error;
    }
  }

  lastExchange(): HttpExchangeDiagnostic | undefined {
    return this.lastExchangeValue;
  }

  cookieNames(): readonly string[] {
    return [...this.cookies.keys()];
  }

  private captureCookies(
    headers: Readonly<Record<string, string | readonly string[]>>,
  ): void {
    const raw = headers['set-cookie'];
    const values: readonly string[] =
      typeof raw === 'string' ? [raw] : (raw ?? []);
    for (const cookie of values) {
      const pair = cookie.split(';', 1)[0];
      const separator = pair.indexOf('=');
      if (separator < 1) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
  }
}

export type SessionDescriptor =
  | { readonly strategy: 'anonymous' }
  | { readonly strategy: 'mock-auth'; readonly token: string }
  | {
      readonly strategy: 'real-auth';
      readonly userId?: string;
      readonly email?: string;
    };

export class TestActor {
  private sessionValue: SessionDescriptor = { strategy: 'anonymous' };

  constructor(
    readonly name: string,
    readonly request: HttpTestClient,
  ) {}

  session(): SessionDescriptor {
    return this.sessionValue;
  }

  setSession(session: SessionDescriptor): this {
    this.sessionValue = session;
    if (session.strategy === 'mock-auth') {
      this.request.setHeader('x-umtas-test-session', session.token);
    } else {
      this.request.removeHeader('x-umtas-test-session');
    }
    return this;
  }
}

export function createNestHttpTransport(app: INestApplication): HttpTransport {
  return async (input) => {
    const agent = supertest(app.getHttpServer() as App);
    let request: supertest.Test;
    switch (input.method) {
      case 'GET':
        request = agent.get(input.path);
        break;
      case 'POST':
        request = agent.post(input.path);
        break;
      case 'PUT':
        request = agent.put(input.path);
        break;
      case 'PATCH':
        request = agent.patch(input.path);
        break;
      case 'DELETE':
        request = agent.delete(input.path);
        break;
    }
    for (const [name, value] of Object.entries(input.headers ?? {})) {
      request = request.set(name, value);
    }
    if (input.timeoutMs) request = request.timeout(input.timeoutMs);
    if (input.json !== undefined) {
      const payload: string | object =
        typeof input.json === 'string' ||
        (typeof input.json === 'object' && input.json !== null)
          ? input.json
          : JSON.stringify(input.json);
      request = request.send(payload);
    }
    for (const [name, value] of Object.entries(input.fields ?? {})) {
      request = request.field(name, value);
    }
    for (const file of input.files ?? []) {
      request = request.attach(file.field, file.buffer, {
        filename: file.filename,
        contentType: file.contentType,
      });
    }
    const response: supertest.Response = await request;
    const text =
      typeof response.text === 'string'
        ? response.text
        : JSON.stringify(response.body);
    return {
      status: response.status,
      headers: normalizeResponseHeaders(response.headers),
      text,
      body: response.body as unknown,
    };
  };
}

export function createFetchHttpTransport(baseUrl: string): HttpTransport {
  return async (input) => {
    const headers = new Headers(input.headers);
    let body: BodyInit | undefined;
    if (input.files?.length || input.fields) {
      const form = new FormData();
      for (const [name, value] of Object.entries(input.fields ?? {})) {
        form.append(name, value);
      }
      for (const file of input.files ?? []) {
        form.append(
          file.field,
          new Blob([Uint8Array.from(file.buffer)], {
            type: file.contentType,
          }),
          file.filename,
        );
      }
      body = form;
    } else if (input.json !== undefined) {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(input.json);
    }
    const response = await fetch(new URL(input.path, baseUrl), {
      method: input.method,
      headers,
      body,
      signal: input.timeoutMs
        ? AbortSignal.timeout(input.timeoutMs)
        : undefined,
    });
    const text = await response.text();
    let parsed: unknown = text;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // Preserve non-JSON response text.
      }
    }
    const responseHeaders: Record<string, string | readonly string[]> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });
    const responseHeadersWithCookies = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const setCookies = responseHeadersWithCookies.getSetCookie?.();
    if (setCookies) responseHeaders['set-cookie'] = setCookies;
    return {
      status: response.status,
      headers: responseHeaders,
      text,
      body: parsed,
    };
  };
}

export async function pollUntil<T>(
  read: () => Promise<T>,
  accept: (value: T) => boolean,
  options: {
    timeoutMs: number;
    intervalMs?: number;
    fail?: (value: T) => string | undefined;
  },
): Promise<T> {
  const deadline = performance.now() + options.timeoutMs;
  let lastValue: T | undefined;
  while (performance.now() < deadline) {
    lastValue = await read();
    const failure = options.fail?.(lastValue);
    if (failure) throw new Error(failure);
    if (accept(lastValue)) return lastValue;
    await new Promise((resolve) =>
      setTimeout(resolve, options.intervalMs ?? 100),
    );
  }
  throw new Error(
    `Polling timed out after ${options.timeoutMs}ms. Last value: ${safeJson(lastValue)}`,
  );
}

function normalizeHeaders(
  headers: Readonly<Record<string, string>>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
}

function normalizeResponseHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | readonly string[]> {
  return Object.fromEntries(
    Object.entries(headers)
      .filter((entry): entry is [string, string | string[]] => entry[1] != null)
      .map(([key, value]) => [key.toLowerCase(), value]),
  );
}

function redactHeaders(
  headers: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      SENSITIVE_HEADER.test(key) ? REDACTED : value,
    ]),
  );
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_FIELD.test(key) ? REDACTED : redactValue(item),
    ]),
  );
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(redactValue(value));
  } catch {
    return String(value);
  }
}

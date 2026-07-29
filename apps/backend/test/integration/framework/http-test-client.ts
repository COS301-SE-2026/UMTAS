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

export type HttpTransport = (request: HttpRequest) => Promise<HttpResponse>;

const REDACTED = '[REDACTED]';
const SENSITIVE_FIELD = /password|token|secret|cookie|authorization/i;

export class HttpTestClient {
  private readonly cookies = new Map<string, string>();

  constructor(private readonly transport: HttpTransport) {}

  fork(): HttpTestClient {
    return new HttpTestClient(this.transport);
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
    const headers = normalizeHeaders(request.headers ?? {});
    if (this.cookies.size > 0) {
      headers.cookie = [...this.cookies]
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    }

    const response = await this.transport({ ...request, headers });
    this.captureCookies(response.headers);
    return response as HttpResponse<T>;
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
    return this;
  }
}

export function createFetchHttpTransport(baseUrl: string): HttpTransport {
  const normalizedBaseUrl = `${baseUrl.replace(/\/+$/u, '')}/`;
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
    const response = await fetch(
      new URL(input.path.replace(/^\/+/u, ''), normalizedBaseUrl),
      {
        method: input.method,
        headers,
        body,
        signal: input.timeoutMs
          ? AbortSignal.timeout(input.timeoutMs)
          : undefined,
      },
    );
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

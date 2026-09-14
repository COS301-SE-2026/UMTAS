import ky, {
  isHTTPError,
  isNetworkError,
  isTimeoutError,
  type Options,
} from "ky";

export const GOOGLE_API = "https://www.googleapis.com/calendar/v3";

const RATE_LIMIT_REASONS = new Set([
  "rateLimitExceeded",
  "userRateLimitExceeded",
  "quotaExceeded",
]);

const AUTH_REASONS = new Set([
  "authError",
  "invalidCredentials",
  "insufficientAuthenticationScopes",
  "insufficientPermissions",
]);

const MIN_REQUEST_GAP_MS = 200;
const MAX_REQUEST_GAP_MS = 2_000;
let requestGapMs = MIN_REQUEST_GAP_MS;
let nextRequestSlot = 0;

interface GoogleErrorBody {
  error?: string | { message?: string; errors?: { reason?: string }[] };
  message?: string;
}

interface ParsedGoogleError {
  status: number;
  message: string;
  reasons: string[];
}

export class GoogleApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly reasons: string[] = [],
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

export class GoogleAuthError extends GoogleApiError {
  constructor(status: number, message: string, reasons: string[] = []) {
    super(status, message, reasons);
    this.name = "GoogleAuthError";
  }
}

export class GoogleNetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GoogleNetworkError";
  }
}

export type GoogleRequestOptions = Pick<Options, "signal" | "timeout">;

function parseGoogleError(
  status: number,
  statusText: string,
  data: unknown,
): ParsedGoogleError {
  const body =
    typeof data === "object" && data !== null ? (data as GoogleErrorBody) : {};
  const detail = typeof body.error === "object" ? body.error : undefined;
  return {
    status,
    message:
      ((typeof body.error === "string" ? body.error : detail?.message) ??
        body.message ??
        statusText) ||
      `Google Calendar API returned ${status}`,
    reasons:
      detail?.errors
        ?.map((error) => error.reason)
        .filter((reason): reason is string => Boolean(reason)) ?? [],
  };
}

function waitForSlot(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(
      new DOMException("The operation was aborted", "AbortError"),
    );
  }
  if (delayMs <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("The operation was aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function takeRequestSlot(signal?: AbortSignal): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextRequestSlot);
  nextRequestSlot = slot + requestGapMs;
  await waitForSlot(slot - now, signal);
}

async function isRateLimitResponse(response: Response): Promise<boolean> {
  if (response.status === 429) return true;
  if (response.status !== 403) return false;

  const data = await response
    .clone()
    .json()
    .catch(() => undefined);
  const parsed = parseGoogleError(response.status, response.statusText, data);
  return parsed.reasons.some((reason) => RATE_LIMIT_REASONS.has(reason));
}

const googleApi = ky.create({
  prefix: GOOGLE_API,
  timeout: 15_000,
  retry: {
    limit: 6,
    methods: ["get", "post", "put", "delete"],
    statusCodes: [429, 500, 502, 503, 504],
    afterStatusCodes: [429, 503],
    maxRetryAfter: 16_000,
    backoffLimit: 16_000,
    retryOnTimeout: true,
    jitter: (delay) => delay * (0.5 + Math.random() / 2),
    shouldRetry: ({ error }) => {
      if (!isHTTPError(error) || error.response.status !== 403) {
        return undefined;
      }
      const parsed = parseGoogleError(
        error.response.status,
        error.response.statusText,
        error.data,
      );
      return parsed.reasons.some((reason) => RATE_LIMIT_REASONS.has(reason));
    },
  },
  hooks: {
    beforeRetry: [
      async ({ request }) => {
        await takeRequestSlot(request.signal ?? undefined);
      },
    ],
    afterResponse: [
      async ({ response }) => {
        if (await isRateLimitResponse(response)) {
          requestGapMs = Math.min(requestGapMs * 2, MAX_REQUEST_GAP_MS);
        } else if (response.ok) {
          requestGapMs = Math.max(MIN_REQUEST_GAP_MS, requestGapMs * 0.9);
        }
      },
    ],
  },
});

export async function requestGoogle(
  path: string,
  init: RequestInit,
  accessToken: string,
  opts: GoogleRequestOptions = {},
): Promise<Response> {
  try {
    await takeRequestSlot(opts.signal ?? undefined);
    return await googleApi(path, {
      ...init,
      ...opts,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch (error) {
    if (opts.signal?.aborted) {
      throw new DOMException("The operation was aborted", "AbortError");
    }
    if (isHTTPError(error)) {
      const parsed = parseGoogleError(
        error.response.status,
        error.response.statusText,
        error.data,
      );
      if (
        parsed.status === 401 ||
        (parsed.status === 403 &&
          parsed.reasons.some((reason) => AUTH_REASONS.has(reason)))
      ) {
        throw new GoogleAuthError(
          parsed.status,
          parsed.message,
          parsed.reasons,
        );
      }
      throw new GoogleApiError(parsed.status, parsed.message, parsed.reasons);
    }
    if (
      isNetworkError(error) ||
      isTimeoutError(error) ||
      error instanceof TypeError
    ) {
      throw new GoogleNetworkError(error.message, { cause: error });
    }
    throw error;
  }
}

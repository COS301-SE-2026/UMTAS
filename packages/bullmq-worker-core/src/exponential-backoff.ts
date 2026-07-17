export interface ExponentialBackoffOptions {
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitterRatio?: number;
  random?: () => number;
}

export interface RetryWithBackoffOptions extends ExponentialBackoffOptions {
  attempts: number;
  sleep?: (delayMs: number) => Promise<void>;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export function calculateExponentialBackoffDelay(
  attempt: number,
  options: ExponentialBackoffOptions = {},
): number {
  const initialDelayMs = options.initialDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 30_000;
  const factor = options.factor ?? 2;
  const jitterRatio = options.jitterRatio ?? 0;
  const random = options.random ?? Math.random;
  const baseDelay = Math.min(
    maxDelayMs,
    initialDelayMs * factor ** Math.max(0, attempt - 1),
  );

  if (jitterRatio <= 0) {
    return baseDelay;
  }

  const jitter = baseDelay * jitterRatio * random();
  return Math.min(maxDelayMs, Math.round(baseDelay + jitter));
}

export async function retryWithBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryWithBackoffOptions,
): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      if (!shouldRetryAttempt(error, attempt, options)) {
        throw error;
      }

      await sleep(calculateExponentialBackoffDelay(attempt, options));
    }
  }

  throw lastError;
}

function shouldRetryAttempt(
  error: unknown,
  attempt: number,
  options: RetryWithBackoffOptions,
): boolean {
  if (attempt >= options.attempts) {
    return false;
  }

  return options.shouldRetry?.(error, attempt) ?? true;
}

function defaultSleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

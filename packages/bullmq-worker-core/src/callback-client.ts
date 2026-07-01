import {
  retryWithBackoff,
  type RetryWithBackoffOptions,
} from "./exponential-backoff.js";
import type {
  WorkerCallbackClient,
  WorkerCallbackPayload,
} from "./contracts.js";

type FetchResponse = Pick<Response, "ok" | "status" | "text">;
type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<FetchResponse>;

export interface HttpCallbackClientOptions {
  token: string;
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  fetchFn?: FetchLike;
  sleep?: (delayMs: number) => Promise<void>;
}

export class HttpCallbackClient implements WorkerCallbackClient {
  private readonly token: string;
  private readonly retryOptions: RetryWithBackoffOptions;
  private readonly fetchFn: FetchLike;

  constructor(options: HttpCallbackClientOptions) {
    this.token = options.token;
    this.fetchFn = options.fetchFn ?? fetch;
    this.retryOptions = {
      attempts: options.maxAttempts ?? 3,
      initialDelayMs: options.initialDelayMs ?? 500,
      maxDelayMs: options.maxDelayMs ?? 5_000,
    };

    if (options.sleep !== undefined) {
      this.retryOptions.sleep = options.sleep;
    }
  }

  async post(url: string, payload: WorkerCallbackPayload): Promise<void> {
    await retryWithBackoff(async () => {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Callback POST failed with ${response.status}: ${body}`,
        );
      }
    }, this.retryOptions);
  }
}

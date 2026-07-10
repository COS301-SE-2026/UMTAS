import { WorkerExecutionError } from "bullmq-worker-core";
import { SolverInputSchema, type SolverInput } from "shared-types";
import type { SolverInputClient } from "./contracts.js";

type FetchResponse = Pick<Response, "ok" | "status" | "text">;
type FetchLike = (input: string, init?: RequestInit) => Promise<FetchResponse>;

export interface HttpSolverInputClientOptions {
  token: string;
  buildUrl: (jobId: string) => string;
  fetchFn?: FetchLike;
}

export class HttpSolverInputClient implements SolverInputClient {
  private readonly token: string;
  private readonly buildUrl: (jobId: string) => string;
  private readonly fetchFn: FetchLike;

  constructor(options: HttpSolverInputClientOptions) {
    this.token = options.token;
    this.buildUrl = options.buildUrl;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async getInput(
    jobId: string,
    abortSignal: AbortSignal,
  ): Promise<SolverInput> {
    const response = await this.fetchFn(this.buildUrl(jobId), {
      headers: { authorization: `Bearer ${this.token}` },
      signal: abortSignal,
    });
    const text = await response.text();

    if (!response.ok) {
      throw new WorkerExecutionError(
        "SOLVER_INPUT_FETCH_FAILED",
        "Could not fetch solver input.",
        {
          jobId,
          status: response.status,
          body: text,
        },
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new WorkerExecutionError(
        "SOLVER_INPUT_PROTOCOL_ERROR",
        "Solver input was not valid JSON.",
        {
          jobId,
          cause: error instanceof Error ? error.message : String(error),
        },
      );
    }

    const result = SolverInputSchema.safeParse(payload);
    if (!result.success) {
      throw new WorkerExecutionError(
        "SOLVER_INPUT_PROTOCOL_ERROR",
        "Solver input did not match the shared contract.",
        {
          jobId,
          issues: result.error.issues,
        },
      );
    }

    return result.data;
  }
}
